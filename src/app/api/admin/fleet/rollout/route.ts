/**
 * Phased Rollout / Canary — mcc-deploy-adv-4
 *
 * Permet de déployer une feature à un sous-ensemble de tenants (pilote) avant la flotte.
 *
 * POST /api/admin/fleet/rollout
 *   Body: { featureKey: string; pilotTenantIds: string[]; description?: string }
 *   Crée mcc/rollouts/{featureKey} = { featureKey, pilotTenantIds, status: 'pilot', ... }
 *
 * PATCH /api/admin/fleet/rollout
 *   Body: { featureKey: string; action: 'promote' | 'rollback' }
 *   promote → active pour tous les tenants (featureFlags mis à jour en masse)
 *   rollback → désactivé pour tous (featureFlags.{featureKey} = false)
 *
 * GET /api/admin/fleet/rollout?featureKey  — état d'un rollout
 * GET /api/admin/fleet/rollout             — tous les rollouts actifs
 *
 * Lecture des flags côté tenant : tenantConfig.featureFlags.{featureKey} = true | false
 * Protégé : fleet_admin.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const RolloutPostSchema = z.object({
  featureKey: z.string().min(1),
  pilotTenantIds: z.array(z.string()).min(1),
  description: z.string().optional()
});

const RolloutPatchSchema = z.object({
  featureKey: z.string().min(1),
  action: z.enum(['promote', 'rollback'])
});

type RolloutStatus = 'pilot' | 'promoted' | 'rolled_back';

interface Rollout {
  featureKey:      string;
  pilotTenantIds:  string[];
  status:          RolloutStatus;
  description:     string;
  createdAt:       string;
  updatedAt:       string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'fleet_admin');
  if (isDenied(caller)) return caller as NextResponse;

  let body: z.infer<typeof RolloutPostSchema>;
  try {
    body = RolloutPostSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: 'Validation failed', details: err }, { status: 400 });
  }

  const { featureKey, pilotTenantIds, description = '' } = body;

  const now     = new Date().toISOString();
  const rollout: Rollout = {
    featureKey, pilotTenantIds, status: 'pilot', description,
    createdAt: now, updatedAt: now,
  };

  await Nexus.adapter.set(`mcc/rollouts/${featureKey}`, rollout);

  // Activer le flag pour les pilotes seulement
  await Promise.all(
    pilotTenantIds.map(tid =>
      Nexus.adapter.set(`tenants/${tid}/tenantConfig`, {
        featureFlags: { [featureKey]: true },
      }, { merge: true })
    )
  );

  empireAudit.log({
    module: 'fleet',
    action: 'ROLLOUT_CREATED',
    severity: 'medium',
    details: { featureKey, pilotCount: pilotTenantIds.length } as unknown as import('@/shared/nexus-contract').SovereignData,
    timestamp: new Date(),
  });

  logger.info(`[Rollout] ${featureKey} en pilote sur ${pilotTenantIds.length} tenant(s)`);
  return NextResponse.json({ success: true, rollout });
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'fleet_admin');
  if (isDenied(caller)) return caller as NextResponse;

  let body: z.infer<typeof RolloutPatchSchema>;
  try {
    body = RolloutPatchSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: 'Validation failed', details: err }, { status: 400 });
  }

  const { featureKey, action } = body;

  const existing = await Nexus.adapter.get(`mcc/rollouts/${featureKey}`) as Rollout | null;
  if (!existing) return NextResponse.json({ error: 'Rollout non trouvé' }, { status: 404 });

  const instances = await Nexus.adapter.query('mcc/empire/instances') as Array<{ id?: string }>;
  const allIds    = instances.map(i => i.id ?? '').filter(Boolean);

  const flagValue = action === 'promote';
  const newStatus: RolloutStatus = action === 'promote' ? 'promoted' : 'rolled_back';

  await Promise.all(
    allIds.map(tid =>
      Nexus.adapter.set(`tenants/${tid}/tenantConfig`, {
        featureFlags: { [featureKey]: flagValue },
      }, { merge: true })
    )
  );

  await Nexus.adapter.set(`mcc/rollouts/${featureKey}`, {
    ...existing, status: newStatus, updatedAt: new Date().toISOString(),
  });

  empireAudit.log({
    module: 'fleet',
    action: action === 'promote' ? 'ROLLOUT_PROMOTED' : 'ROLLOUT_ROLLEDBACK',
    severity: 'high',
    details: { featureKey, affectedCount: allIds.length } as unknown as import('@/shared/nexus-contract').SovereignData,
    timestamp: new Date(),
  });

  logger.info(`[Rollout] ${featureKey} → ${newStatus} sur ${allIds.length} tenants`);
  return NextResponse.json({ success: true, status: newStatus, affectedCount: allIds.length });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller as NextResponse;

  const featureKey = req.nextUrl.searchParams.get('featureKey');

  if (featureKey) {
    const rollout = await Nexus.adapter.get(`mcc/rollouts/${featureKey}`);
    if (!rollout) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });
    return NextResponse.json(rollout);
  }

  const rollouts = await Nexus.adapter.query('mcc/rollouts');
  return NextResponse.json({ rollouts });
}
