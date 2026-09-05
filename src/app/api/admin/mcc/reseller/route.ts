/**
 * GET  /api/admin/mcc/reseller       — lister les revendeurs
 * POST /api/admin/mcc/reseller       — créer un revendeur (génère un code d'affiliation)
 * PATCH /api/admin/mcc/reseller      — mettre à jour statut / commission
 *
 * Modèle :
 *   - Chaque revendeur a un code d'affiliation unique (ex: "RESELLER_ABC123")
 *   - Quand un tenant est provisionné avec refCode=X, le revendeur est crédité
 *   - Commission = 10% du MRR tenant (calculé depuis mcc/billing/{tenantId})
 *
 * Stockage Nexus :
 *   mcc/resellers/{resellerId}        → profil revendeur
 *   mcc/resellerCommissions/{period}  → commissions calculées du mois
 *
 * Protégé : super_admin.
 */
import 'server-only';
import { type NextRequest, NextResponse } from 'next/server';
import { withMccRoute } from '@/lib/server/routeWrapper';
import type { MccRole } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { randomBytes } from 'node:crypto';
import { logger } from '@/lib/logger';
import type { JsonObject } from "@/shared/types/json";
import { parsePaginationParams, paginateAfterId } from '@/lib/api/pagination';

const COMMISSION_RATE = 0.10; // 10%

function generateAffiliateCode(): string {
  return `RS_${randomBytes(4).toString('hex').toUpperCase()}`;
}

export const GET = withMccRoute(
  async (req) => {
    const resellers = await Nexus.adapter.query<{ id?: string }>('mcc/resellers');
    const page = paginateAfterId(resellers, parsePaginationParams(req.url));
    return NextResponse.json({ resellers: page.items, total: page.total, nextCursor: page.nextCursor });
  },
  { minLevel: 'mcc_super_admin' },
);

export const POST = withMccRoute(
  async (req) => {
    const body = await req.json() as {
      name?: string;
      email?: string;
      phone?: string;
      commissionRate?: number;
      notes?: string;
    };

    const { name, email } = body;
    if (!name || !email) {
      return NextResponse.json({ error: 'name et email requis' }, { status: 400 });
    }

    const resellerId = `reseller_${randomBytes(6).toString('hex')}`;
    const affiliateCode = generateAffiliateCode();

    const reseller = {
      id: resellerId,
      name,
      email,
      phone: body.phone ?? '',
      affiliateCode,
      commissionRate: body.commissionRate ?? COMMISSION_RATE,
      status: 'active',
      totalTenantsReferred: 0,
      totalCommissionsEur: 0,
      notes: body.notes ?? '',
      createdAt: Date.now(),
    };

    await Nexus.adapter.set('mcc/resellers/' + resellerId, reseller);

    logger.info(`[Reseller] Revendeur créé : ${name} (${affiliateCode})`);
    return NextResponse.json({ reseller }, { status: 201 });
  },
  { minLevel: 'mcc_super_admin' },
);

export const PATCH = withMccRoute(
  async (req) => {
    const body = await req.json() as { resellerId?: string; status?: string; commissionRate?: number; notes?: string; name?: string; email?: string; phone?: string; };
    const { resellerId } = body;
    if (!resellerId) return NextResponse.json({ error: 'resellerId requis' }, { status: 400 });

    const existing = await Nexus.adapter.get('mcc/resellers/' + resellerId) as JsonObject | null;
    if (!existing) return NextResponse.json({ error: 'Revendeur introuvable' }, { status: 404 });

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (body.status !== undefined) updates.status = body.status;
    if (body.commissionRate !== undefined) updates.commissionRate = body.commissionRate;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.name !== undefined) updates.name = body.name;
    if (body.email !== undefined) updates.email = body.email;
    if (body.phone !== undefined) updates.phone = body.phone;

    await Nexus.adapter.set('mcc/resellers/' + resellerId, { ...existing, ...updates });

    return NextResponse.json({ ok: true, resellerId });
  },
  { minLevel: 'mcc_super_admin' },
);

export const DELETE = withMccRoute(
  async (req) => {
    const resellerId = req.nextUrl.searchParams.get('resellerId');
    if (!resellerId) return NextResponse.json({ error: 'resellerId requis' }, { status: 400 });

    await Nexus.adapter.delete('mcc/resellers/' + resellerId);
    logger.info(`[Reseller] Revendeur supprimé : ${resellerId}`);

    return NextResponse.json({ ok: true });
  },
  { minLevel: 'mcc_super_admin' },
);

