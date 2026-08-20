import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { UniversalVerticalFleetService } from '@/infrastructure/services/fleet/UniversalVerticalFleetService';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/fleet/universal-health
 *
 * Retourne la santé de toute la flotte d'instances agrégée par verticale métier.
 * Protégé : mcc_support / admin.
 */
export async function GET(req: NextRequest) {
    const caller = await requireMccLevel(req, 'mcc_support');
    if (isDenied(caller)) return caller;

    try {
        const summary = await UniversalVerticalFleetService.getUniversalFleetHealth();
        return NextResponse.json(summary);
    } catch (err) {
        const e = toError(err);
        logger.error('[API:universal-health] Erreur calcul santé flotte', e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/fleet/universal-health/backup
 *
 * Déclenche une sauvegarde manuelle ou planifiée de l'ensemble de la flotte multi-verticales.
 */
export async function POST(req: NextRequest) {
    const caller = await requireMccLevel(req, 'mcc_super_admin');
    if (isDenied(caller)) return caller;

    try {
        const result = await UniversalVerticalFleetService.executeFleetBackup();
        return NextResponse.json(result);
    } catch (err) {
        const e = toError(err);
        logger.error('[API:universal-health] Erreur sauvegarde flotte', e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
