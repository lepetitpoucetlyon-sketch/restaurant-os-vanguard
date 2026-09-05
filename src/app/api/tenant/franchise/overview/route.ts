/**
 * GET /api/tenant/franchise/overview
 * Synthèse réseau & consolidation multi-restaurants pour l'Admin / Propriétaire connecté.
 */

import 'server-only';
import { type NextRequest, NextResponse } from 'next/server';
import { withTenantRoute } from '@/lib/server/routeWrapper';
import { FranchiseService } from '@/modules/commerce';
import { logger } from '@/lib/logger';

export const GET = withTenantRoute(
  async (req, { caller }) => {
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
  },
  { requireAdmin: true },
);

