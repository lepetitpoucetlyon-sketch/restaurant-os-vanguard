/**
 * GET /api/tenant/franchise/overview
 * Synthèse réseau & consolidation multi-restaurants pour l'Admin / Propriétaire connecté.
 */

import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { FranchiseService } from '@/modules/commerce/franchise/services/FranchiseService';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest): Promise<NextResponse> {
    const caller = await requireTenantAdmin(req);
    if (isDenied(caller)) return caller as NextResponse;

    const { email } = caller as { tenantId: string; email?: string; role: string };

    try {
        const ownerId = email || 'admin@restaurantos.app';
        const sites = await FranchiseService.getOwnerSites(ownerId);
        const consolidated = FranchiseService.consolidateMetrics(sites);

        logger.info(`[FranchiseAPI] Synthèse générée pour ${sites.length} sites du réseau`);
        return NextResponse.json({
            ownerId,
            sites,
            consolidated,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logger.error('[FranchiseAPI] Échec de la récupération de la vue consolidée', { error });
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des données de franchise' },
            { status: 500 }
        );
    }
}
