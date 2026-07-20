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
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

type FleetCommandAction = 'RESTART' | 'MAINTENANCE' | 'SOFT_LOCK' | 'HARD_LOCK' | 'LOCK';

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

    let body: { action: FleetCommandAction; instanceId: string };
    try {
        body = await req.json() as { action: FleetCommandAction; instanceId: string };
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { action, instanceId } = body;

    if (!action || !instanceId) {
        return NextResponse.json({ error: 'action et instanceId sont requis' }, { status: 400 });
    }

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

        empireAudit.log({
            module: 'fleet',
            action: `FLEET_CMD_${action}`,
            severity: action === 'HARD_LOCK' || action === 'LOCK' ? 'high' : 'medium',
            details: { instanceId, newStatus } as unknown as import('@/shared/nexus-contract').SovereignData,
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
