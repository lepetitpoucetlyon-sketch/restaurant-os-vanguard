/**
 * POST /api/admin/hr/payroll/merge/sync
 * Pousse le pré-paie d'une période vers le provider connecté via Merge.dev.
 * Body : { periode: 'YYYY-MM' }
 * Protégé : manager / directeur minimum.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { MergePayrollClient, PrepaieBuilder } from '@/modules/human/payroll';
import type { PayrollProviderConfig } from '@/modules/human/payroll';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest): Promise<NextResponse> {
    const caller = await requireTenantAdmin(req);
    if (isDenied(caller)) return caller as NextResponse;

    const { periode } = await req.json() as { periode?: string };
    const month = periode ?? new Date().toISOString().slice(0, 7);

    if (!/^\d{4}-\d{2}$/.test(month)) {
        return NextResponse.json({ error: 'periode must be YYYY-MM' }, { status: 400 });
    }

    const configPath = Nexus.getTenantPath('settings/payroll');
    const config = await Nexus.adapter.get<PayrollProviderConfig>(configPath);

    if (!config || config.provider !== 'merge' || !config.mergeAccountToken) {
        return NextResponse.json({
            error: 'Merge.dev non configuré — connectez d\'abord votre prestataire RH via les paramètres',
        }, { status: 422 });
    }

    try {
        const summary = await PrepaieBuilder.build(caller.tenantId, month);
        const client = new MergePayrollClient(config);
        const result = await client.syncPeriod(summary);

        const periodPath = Nexus.getTenantPath(`payrollPeriods/${month}`);
        await Nexus.adapter.set(periodPath, {
            ...summary,
            provider: 'merge',
            syncStatus: result.success ? 'synced' : 'error',
            syncedAt: new Date().toISOString(),
            syncErrors: result.errors,
        }, { merge: true });

        logger.info(`[HR/Merge] Sync ${month}`, { tenantId: caller.tenantId, ...result });

        return NextResponse.json({ ...result, periode: month });
    } catch (err) {
        logger.error('[HR/Merge] Sync failed', err);
        return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    }
}
