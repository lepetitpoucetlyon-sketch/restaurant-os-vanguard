/**
 * Fleet Upgrade — pousse une version cible à toute la flotte ou une sélection.
 *
 * POST /api/admin/fleet/upgrade
 *   Body: {
 *     version:     string,           // "2.4.1"
 *     targetState?: 'stable' | 'beta' | 'bleeding-edge'
 *     otaUrl?:     string,
 *     targetIds?:  string[],         // undefined = toute la flotte
 *     notes?:      string,           // release notes
 *     breaking?:   boolean,
 *   }
 *   Met à jour tenants/{tid}/tenantConfig.status.targetVersion + .targetState + .otaUrl.
 *   Enregistre un changelog par tenant + un entrée fleet.
 *
 * GET /api/admin/fleet/upgrade
 *   Retourne l'historique des upgrades (scope=fleet dans le changelog).
 *
 * Protégé : super_admin.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { ChangelogService } from '@/lib/mcc/ChangelogService';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const UpgradeSchema = z.object({
  version:      z.string().min(1),
  targetState:  z.enum(['stable', 'beta', 'bleeding-edge']).optional(),
  otaUrl:       z.string().optional(),
  targetIds:    z.array(z.string()).optional(),
  notes:        z.string().optional(),
  breaking:     z.boolean().optional(),
});

type UpgradeBody = z.infer<typeof UpgradeSchema>;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_super_admin');
  if (isDenied(caller)) return caller as NextResponse;

  let body: UpgradeBody;
  try {
    body = UpgradeSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: 'Validation failed', details: err }, { status: 400 });
  }

  const { version, targetState = 'stable', otaUrl, notes = '', breaking = false } = body;

  let targetIds: string[];
  if (body.targetIds?.length) {
    targetIds = body.targetIds;
  } else {
    const instances = await Nexus.adapter.query('mcc/empire/instances') as Array<{ id?: string }>;
    targetIds = instances.map(i => i.id ?? '').filter(Boolean);
  }

  const scope = targetIds.length === (
    (await Nexus.adapter.query('mcc/empire/instances') as Array<{ id?: string }>).length
  ) ? 'fleet' : 'pilot';

  const patch = {
    status: {
      targetVersion: version,
      targetState,
      ...(otaUrl ? { otaUrl } : {}),
    },
  };

  await Promise.all(
    targetIds.map(tid =>
      Nexus.adapter.set(`tenants/${tid}/tenantConfig`, patch, { merge: true })
    )
  );

  // One changelog entry per tenant + one fleet entry
  await Promise.all([
    ...targetIds.map(tid =>
      ChangelogService.record({
        tenantId:     tid,
        action:       'UPGRADE_PUSHED',
        key:          'status.targetVersion',
        after:        version,
        description:  notes || `Upgrade ${version} (${targetState})${breaking ? ' — BREAKING' : ''}`,
        appliedBy:    caller.uid,
        scope,
        category:     'UPGRADE',
        affectedCount: targetIds.length,
      })
    ),
    ChangelogService.record({
      tenantId:     '__FLEET__',
      action:       'UPGRADE_BROADCAST',
      after:        { version, targetState, targetIds },
      description:  notes || `Fleet upgrade ${version} → ${targetIds.length} tenant(s)`,
      appliedBy:    caller.uid,
      scope,
      category:     'UPGRADE',
      affectedCount: targetIds.length,
    }),
  ]);

  empireAudit.log({
    module: 'fleet',
    action: 'UPGRADE_PUSHED',
    severity: breaking ? 'critical' : 'high',
    details: { version, targetState, affectedCount: targetIds.length, breaking },
    timestamp: new Date(),
  });

  logger.info(`[Upgrade] ${version} → ${targetIds.length} tenant(s) (${scope})`);
  return NextResponse.json({
    success: true,
    version,
    targetState,
    scope,
    affectedCount: targetIds.length,
    targetIds,
  });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller as NextResponse;

  const tenantId = req.nextUrl.searchParams.get('tenantId');
  const entries  = tenantId
    ? await ChangelogService.getByCategory('UPGRADE', tenantId, 30)
    : await ChangelogService.getByCategory('UPGRADE', undefined, 30);

  return NextResponse.json({ upgrades: entries });
}
