import 'server-only';
import { NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { FleetOutboxDrainService } from '@/modules/intelligence';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

/**
 * 🚀 Draine les outboxes de tous les tenants vers la vue globale MCC.
 * Endpoint accessible uniquement aux Fleet Admins (ou déclenché par un cron sécurisé).
 */
export async function POST(request: Request) {
  try {
    const admin = await requireMccLevel(request, 'mcc_support');
    if (isDenied(admin)) return admin;

    // Récupérer la liste des tenants actifs
    const tenants = await Nexus.adapter.query<{ id: string }>('mcc/tenants', {
        where: [{ field: 'status', operator: '==', value: 'active' }]
    });

    let totalDrained = 0;
    const results = [];

    for (const tenant of tenants) {
        const count = await FleetOutboxDrainService.drainTenant(tenant.id);
        if (count > 0) {
            results.push({ tenantId: tenant.id, count });
            totalDrained += count;
        }
    }

    logger.info(`[DrainOutbox] Drained ${totalDrained} events across ${results.length} tenants`);

    return NextResponse.json({
        success: true,
        drained: totalDrained,
        details: results
    });

  } catch (error) {
    logger.error('[DrainOutbox] Error during global drain', toError(error).message);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
