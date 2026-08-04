/**
 * POST /api/admin/fleet/owner-view
 * Vue agrégée de la flotte d'un Owner B2B depuis le MCC.
 *
 * Body : { ownerId: string }
 * Retourne : { sites[], aggregated: { totalRevenue, avgHealth, totalUsers, totalAlerts } }
 *
 * Protégé : mcc_support minimum (lecture).
 * Filtre les sites de la flotte où tenantId/key correspond aux tenants
 * dont tenantConfig.metadata.ownerId === ownerId.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { fleetTelemetry } from '@/shared/nexus/engines/Intelligence/ia/fleet/FleetTelemetryService';
import { logger } from '@/lib/logger';
import type { SiteTelemetry } from '@/shared/nexus/contracts/fleet.types';

interface OwnerViewRequest {
    ownerId: string;
}

interface OwnerSiteSummary {
    tenantId: string;
    name: string;
    status: SiteTelemetry['status'];
    healthScore: number;
    dailyRevenue: number;
    activeUsers: number;
    lowStockAlerts: number;
    lastHeartbeat: string;
    version: string;
}

interface AggregatedMetrics {
    totalSites: number;
    onlineSites: number;
    avgHealthScore: number;
    totalDailyRevenue: number;
    totalActiveUsers: number;
    totalAlerts: number;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
    const caller = await requireMccLevel(req, 'mcc_support');
    if (isDenied(caller)) return caller as NextResponse;

    let body: OwnerViewRequest;
    try {
        body = await req.json() as OwnerViewRequest;
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { ownerId } = body;
    if (!ownerId) {
        return NextResponse.json({ error: 'ownerId est requis' }, { status: 400 });
    }

    try {
        // 1. Découvre toute la flotte
        const allSites = await fleetTelemetry.discoverRealFleet();

        // 2. Pour chaque site, vérifie si l'ownerId correspond dans tenantConfig
        const ownerSites: OwnerSiteSummary[] = [];

        await Promise.all(allSites.map(async (site) => {
            const tid = site.tenantId ?? site.key;
            if (!tid) return;

            try {
                const config = await Nexus.adapter.get(`tenants/${tid}/tenantConfig`) as {
                    metadata?: { ownerId?: string };
                } | null;

                if (config?.metadata?.ownerId === ownerId) {
                    ownerSites.push({
                        tenantId: tid,
                        name: site.name,
                        status: site.status,
                        healthScore: site.healthScore ?? 0,
                        dailyRevenue: site.dailyRevenue ?? 0,
                        activeUsers: site.activeUsers ?? 0,
                        lowStockAlerts: site.lowStockAlerts ?? 0,
                        lastHeartbeat: site.lastHeartbeat,
                        version: site.version,
                    });
                }
            } catch {
                // site potentiellement en cours de provisionnement — on ignore
            }
        }));

        // 3. Agrège les métriques
        const aggregated: AggregatedMetrics = {
            totalSites: ownerSites.length,
            onlineSites: ownerSites.filter(s => s.status === 'ONLINE').length,
            avgHealthScore: ownerSites.length
                ? Math.round(ownerSites.reduce((sum, s) => sum + s.healthScore, 0) / ownerSites.length)
                : 0,
            totalDailyRevenue: ownerSites.reduce((sum, s) => sum + s.dailyRevenue, 0),
            totalActiveUsers: ownerSites.reduce((sum, s) => sum + s.activeUsers, 0),
            totalAlerts: ownerSites.reduce((sum, s) => sum + s.lowStockAlerts, 0),
        };

        logger.info(`[MCC/owner-view] ${ownerSites.length} sites trouvés pour owner ${ownerId}`);

        return NextResponse.json({ ownerId, sites: ownerSites, aggregated });
    } catch (err) {
        logger.error('[MCC/owner-view] Erreur:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Erreur interne' },
            { status: 500 },
        );
    }
}
