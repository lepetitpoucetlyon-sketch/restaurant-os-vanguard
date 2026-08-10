import { requireFleetAdmin, requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
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
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

import { z } from 'zod';

const OtaBroadcastSchema = z.object({
  targetIds: z.array(z.string()).optional(),
  maintenanceMode: z.boolean(),
  message: z.string().optional(),
  estimatedDurationMin: z.number().int().min(1).optional()
});

type OtaBroadcastBody = z.infer<typeof OtaBroadcastSchema>;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'fleet_admin');
  if (isDenied(caller)) return caller as NextResponse;

  let body: OtaBroadcastBody;
  try {
    body = OtaBroadcastSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: 'Validation failed', details: err }, { status: 400 });
  }

  const { maintenanceMode, message, estimatedDurationMin } = body;

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
    details: { targetCount: targetIds.length, maintenanceMode, message },
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
