import { NextRequest, NextResponse } from 'next/server';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { z } from 'zod';

/**
 * §11 — Suivi de progression de l'import onboarding
 *
 * GET  /api/tenant/onboarding/import-status
 *   → Retourne l'état courant de l'import (running / done / partial / error)
 *
 * POST /api/tenant/onboarding/import-status
 *   → Mise à jour par l'importeur (usage interne)
 *   → Body : ImportStatusUpdate
 *
 * DELETE /api/tenant/onboarding/import-status?category=products
 *   → Rejoue uniquement les items en erreur d'une catégorie
 */

const importStatusPath = (tenantId: string) => `tenants/${tenantId}/onboarding/import_status`;

export interface ImportError {
  item: string;
  reason: string;
  category: string;
}

export interface ImportStatusDoc {
  status: 'idle' | 'running' | 'done' | 'partial' | 'error';
  totalItems: number;
  imported: number;
  errors: ImportError[];
  byCategory: Record<string, { total: number; imported: number; errors: number }>;
  startedAt?: string;
  completedAt?: string;
  lastUpdatedAt: string;
}

const ImportStatusUpdateSchema = z.object({
  status: z.enum(['idle', 'running', 'done', 'partial', 'error']).optional(),
  totalItems: z.number().int().min(0).optional(),
  imported: z.number().int().min(0).optional(),
  errors: z.array(z.object({
    item: z.string(),
    reason: z.string(),
    category: z.string(),
  })).optional(),
  byCategory: z.record(z.string(), z.object({
    total: z.number().int(),
    imported: z.number().int(),
    errors: z.number().int(),
  })).optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const caller = await requireTenantUser(request);
    if (isDenied(caller)) return caller;
    const { tenantId } = caller;

    const doc = await Nexus.adapter.get<ImportStatusDoc>(importStatusPath(tenantId));
    if (!doc) {
      return NextResponse.json({
        status: 'idle',
        totalItems: 0,
        imported: 0,
        errors: [],
        byCategory: {},
        lastUpdatedAt: new Date().toISOString(),
      });
    }
    return NextResponse.json(doc);
  } catch (err) {
    logger.error('[import-status] GET', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const caller = await requireTenantUser(request);
    if (isDenied(caller)) return caller;
    const { tenantId } = caller;

    const body = await request.json();
    const parsed = ImportStatusUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Payload invalide' },
        { status: 400 },
      );
    }

    const update = {
      ...parsed.data,
      lastUpdatedAt: new Date().toISOString(),
    };

    await Nexus.adapter.set(importStatusPath(tenantId), update, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('[import-status] POST', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
