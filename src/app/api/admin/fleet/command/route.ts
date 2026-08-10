import { requireFleetAdmin, requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
/**
 * POST /api/admin/fleet/command
 * Envoi d'une commande opérationnelle sur une instance de la flotte.
 *
 * Actions :
 *   RESTART      → réinitialise le statut à ONLINE
 *   MAINTENANCE  → soft lock, statut MAINTENANCE
 *   SOFT_LOCK    → alias de MAINTENANCE
 *   HARD_LOCK    → verrouillage total, statut LOCKED
 *   LOCK         → alias de HARD_LOCK (legacy)
 *
 * Protégé : fleet_admin minimum.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const CommandSchema = z.object({
    action: z.enum(['RESTART', 'MAINTENANCE', 'SOFT_LOCK', 'HARD_LOCK', 'LOCK']),
    instanceId: z.string().min(1)
});

type FleetCommandAction = z.infer<typeof CommandSchema>['action'];

const ACTION_STATUS_MAP: Record<FleetCommandAction, string> = {
    RESTART:     'ONLINE',
    MAINTENANCE: 'MAINTENANCE',
    SOFT_LOCK:   'MAINTENANCE',
    HARD_LOCK:   'LOCKED',
    LOCK:        'LOCKED',
};

export async function POST(req: NextRequest): Promise<NextResponse> {
    const caller = await requireMccLevel(req, 'fleet_admin');
    if (isDenied(caller)) return caller as NextResponse;

    let body: z.infer<typeof CommandSchema>;
    try {
        body = CommandSchema.parse(await req.json());
    } catch (err) {
        return NextResponse.json({ error: 'Validation failed', details: err }, { status: 400 });
    }

    const { action, instanceId } = body;

    const newStatus = ACTION_STATUS_MAP[action];
    if (!newStatus) {
        return NextResponse.json({ error: `Action inconnue: ${action}` }, { status: 400 });
    }

    try {
        const telemetryPath = `mcc/fleet/${instanceId}`;
        await Nexus.adapter.set(telemetryPath, {
            status: newStatus,
            lastCommandAt: new Date().toISOString(),
            lastCommandAction: action,
        }, { merge: true });

        // Propager le statut vers tenantConfig pour que SovereignLockout s'active côté tenant
        if (newStatus === 'LOCKED' || newStatus === 'MAINTENANCE' || newStatus === 'ONLINE') {
            await Nexus.adapter.set(`tenants/${instanceId}/tenantConfig`, {
                status: {
                    licenceStatus: newStatus === 'LOCKED' ? 'LOCKED' : 'ACTIVE',
                    maintenanceMode: newStatus === 'MAINTENANCE',
                },
            }, { merge: true });
        }

        empireAudit.log({
            module: 'fleet',
            action: `FLEET_CMD_${action}`,
            severity: action === 'HARD_LOCK' || action === 'LOCK' ? 'high' : 'medium',
            details: { instanceId, newStatus },
            timestamp: new Date(),
        });

        logger.info(`[MCC/command] ${action} → ${instanceId} (status: ${newStatus})`);
        return NextResponse.json({ success: true, instanceId, action, newStatus });
    } catch (err) {
        logger.error('[MCC/command] Erreur:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Erreur interne' },
            { status: 500 },
        );
    }
}
