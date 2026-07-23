/**
 * POST /api/admin/hr/payroll/silae/sync
 * Pousse le pré-paie d'une période vers Silae.
 * Body : { periode: 'YYYY-MM' }
 * Protégé : manager / directeur minimum.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { SilaeClient } from '@/lib/payroll/SilaeClient';
import { PrepaieBuilder } from '@/lib/payroll/PrepaieBuilder';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import type { PayrollProviderConfig } from '@/lib/payroll/types';

export async function POST(req: NextRequest): Promise<NextResponse> {
    const caller = await requireTenantAdmin(req);
    if (isDenied(caller)) return caller as NextResponse;

    const { periode } = await req.json() as { periode?: string };
    const month = periode ?? new Date().toISOString().slice(0, 7);

    if (!/^\d{4}-\d{2}$/.test(month)) {
        return NextResponse.json({ error: 'periode must be YYYY-MM' }, { status: 400 });
    }

    // Charger la config Silae depuis Nexus
    const configPath = Nexus.getTenantPath('settings/payroll');
    const config = await Nexus.adapter.get<PayrollProviderConfig>(configPath);

    if (!config || config.provider !== 'silae' || !config.silaeApiKey) {
        return NextResponse.json({
            error: 'Silae non configuré — connectez d\'abord votre compte via les paramètres RH',
        }, { status: 422 });
    }

    try {
        const summary = await PrepaieBuilder.build(caller.tenantId, month);
        const client = new SilaeClient(config);
        const result = await client.syncPeriod(summary);

        // Marquer la période comme synchronisée
        const periodPath = Nexus.getTenantPath(`payrollPeriods/${month}`);
        await Nexus.adapter.set(periodPath, {
            ...summary,
            provider: 'silae',
            syncStatus: result.success ? 'synced' : 'error',
            syncedAt: new Date().toISOString(),
            syncErrors: result.errors,
        }, { merge: true });

        logger.info(`[HR/Silae] Sync ${month}`, {
            tenantId: caller.tenantId,
            ...result,
        });

        return NextResponse.json({ ...result, periode: month });
    } catch (err) {
        logger.error('[HR/Silae] Sync failed', err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
