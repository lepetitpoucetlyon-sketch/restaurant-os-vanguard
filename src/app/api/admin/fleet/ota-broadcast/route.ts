/**
 * OTA Broadcast maintenanceMode — mcc-ota-3
 *
 * Broadcast un changement d'état (maintenanceMode: true/false) à une sélection
 * ou à toute la flotte. Chaque tenant reçoit une mise à jour dans son tenantConfig
 * qui déclenche la SovereignLockout bannière côté client.
 *
 * POST /api/admin/fleet/ota-broadcast
 *   Body: {
 *     targetIds?: string[]  // undefined = toute la flotte
 *     maintenanceMode: boolean
 *     message?: string      // message affiché dans la bannière
 *     estimatedDurationMin?: number
 *   }
 *   Retourne: { broadcasted: number; targetIds: string[] }
 *
 * Protégé : fleet_admin.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'fleet_admin');
  if (isDenied(caller)) return caller as NextResponse;

  let body: {
    targetIds?: string[];
    maintenanceMode: boolean;
    message?: string;
    estimatedDurationMin?: number;
  };
  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { maintenanceMode, message, estimatedDurationMin } = body;
  if (typeof maintenanceMode !== 'boolean') {
    return NextResponse.json({ error: 'maintenanceMode (boolean) requis' }, { status: 400 });
  }

  let targetIds: string[];

  if (body.targetIds?.length) {
    targetIds = body.targetIds;
  } else {
    const instances = await Nexus.adapter.query('mcc/empire/instances') as Array<{ id?: string }>;
    targetIds = instances.map(i => i.id ?? '').filter(Boolean);
  }

  const broadcastedAt = new Date().toISOString();
  const patch = {
    status: {
      maintenanceMode,
      maintenanceMessage: message ?? (maintenanceMode ? 'Maintenance en cours — retour imminent' : null),
      maintenanceEstimatedEnd: estimatedDurationMin
        ? new Date(Date.now() + estimatedDurationMin * 60_000).toISOString()
        : null,
      licenceStatus: maintenanceMode ? 'ACTIVE' : 'ACTIVE',
    },
    otaBroadcastedAt: broadcastedAt,
  };

  await Promise.all(
    targetIds.map(tid =>
      Nexus.adapter.set(`tenants/${tid}/tenantConfig`, patch, { merge: true })
    )
  );

  empireAudit.log({
    module: 'fleet',
    action: maintenanceMode ? 'OTA_MAINTENANCE_ON' : 'OTA_MAINTENANCE_OFF',
    severity: 'high',
    details: { targetCount: targetIds.length, maintenanceMode, message } as unknown as import('@/shared/nexus-contract').SovereignData,
    timestamp: new Date(),
  });

  logger.info(`[OTA] maintenanceMode=${maintenanceMode} → ${targetIds.length} tenant(s)`);
  return NextResponse.json({
    success:     true,
    broadcasted: targetIds.length,
    targetIds,
    maintenanceMode,
    broadcastedAt,
  });
}
