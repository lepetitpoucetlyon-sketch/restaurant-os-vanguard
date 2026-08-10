import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
/**
 * Tenant Override — MCC granular per-tenant config patches.
 *
 * POST /api/admin/fleet/tenant-override
 *   Body: { tenantIds: string[], overrides: Record<string,unknown>, description?: string }
 *   Merge-patche tenants/{tid}/tenantConfig.overrides et enregistre dans le changelog.
 *
 * GET /api/admin/fleet/tenant-override?tenantId=xxx
 *   Retourne tenantConfig.overrides actuel du tenant.
 *
 * DELETE /api/admin/fleet/tenant-override
 *   Body: { tenantId: string, key: string }  (e.g. "ui.buttonRadius")
 *   Supprime une clé de l'override.
 *
 * Protégé : fleet_admin.
 */
import { NextRequest, NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { ChangelogService } from '@/lib/mcc/ChangelogService';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { JsonObject } from "@/shared/types/json";

const TenantOverridePostSchema = z.object({
  tenantIds: z.array(z.string()).min(1),
  overrides: z.record(z.string(), z.unknown()),
  description: z.string().optional()
});

const TenantOverrideDeleteSchema = z.object({
  tenantId: z.string().min(1),
  key: z.string().min(1)
});

function setNested(obj: Record<string, unknown>, dotPath: string, value: unknown): void {
  const parts = dotPath.split('.');
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof cur[parts[i]] !== 'object' || cur[parts[i]] === null) {
      cur[parts[i]] = {};
    }
    cur = cur[parts[i]] as JsonObject;
  }
  cur[parts[parts.length - 1]] = value;
}

function deleteNested(obj: Record<string, unknown>, dotPath: string): void {
  const parts = dotPath.split('.');
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof cur[parts[i]] !== 'object' || cur[parts[i]] === null) return;
    cur = cur[parts[i]] as JsonObject;
  }
  delete cur[parts[parts.length - 1]];
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'fleet_admin');
  if (isDenied(caller)) return caller as NextResponse;

  let body: z.infer<typeof TenantOverridePostSchema>;
  try {
    body = TenantOverridePostSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: 'Validation failed', details: err }, { status: 400 });
  }

  const { tenantIds, overrides, description = '' } = body;

  const results: string[] = [];

  await Promise.all(
    tenantIds.map(async (tid) => {
      const current = await Nexus.adapter.get(`tenants/${tid}/tenantConfig`) as JsonObject | null;
      const before  = (current as { overrides?: unknown } | null)?.overrides ?? {};

      // Deep-merge overrides into tenantConfig.overrides
      await Nexus.adapter.set(
        `tenants/${tid}/tenantConfig`,
        { overrides },
        { merge: true }
      );

      await ChangelogService.record({
        tenantId:    tid,
        action:      'OVERRIDE_APPLIED',
        key:         Object.keys(overrides)[0] ? `overrides.${Object.keys(overrides)[0]}` : 'overrides',
        before,
        after:       overrides,
        description: description || `Override appliqué par ${caller.uid}`,
        appliedBy:   caller.uid,
        scope:       tenantIds.length === 1 ? 'tenant' : 'fleet',
        affectedCount: tenantIds.length,
      });

      results.push(tid);
    })
  );

  logger.info(`[TenantOverride] ${results.length} tenant(s) patché(s) par ${caller.uid}`);
  return NextResponse.json({ success: true, patched: results });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller as NextResponse;

  const tenantId = req.nextUrl.searchParams.get('tenantId');
  if (!tenantId) return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });

  const config = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`) as {
    overrides?: unknown;
  } | null;

  return NextResponse.json({ tenantId, overrides: config?.overrides ?? {} });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'fleet_admin');
  if (isDenied(caller)) return caller as NextResponse;

  let body: z.infer<typeof TenantOverrideDeleteSchema>;
  try {
    body = TenantOverrideDeleteSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: 'Validation failed', details: err }, { status: 400 });
  }

  const { tenantId, key } = body;

  const current = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`) as {
    overrides?: Record<string, unknown>;
  } | null;
  const overrides = { ...(current?.overrides ?? {}) } as JsonObject;
  const before    = JSON.parse(JSON.stringify(overrides));

  deleteNested(overrides, key.replace(/^overrides\./, ''));

  await Nexus.adapter.set(
    `tenants/${tenantId}/tenantConfig`,
    { overrides },
    { merge: true }
  );

  await ChangelogService.record({
    tenantId,
    action:      'OVERRIDE_REMOVED',
    key:         `overrides.${key}`,
    before,
    after:       overrides,
    description: `Clé ${key} supprimée par ${caller.uid}`,
    appliedBy:   caller.uid,
    scope:       'tenant',
  });

  logger.info(`[TenantOverride] Clé "${key}" supprimée pour ${tenantId}`);
  return NextResponse.json({ success: true, tenantId, removed: key });
}

// only used internally
export { setNested, deleteNested };
