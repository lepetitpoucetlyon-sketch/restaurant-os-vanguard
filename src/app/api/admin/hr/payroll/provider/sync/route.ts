/**
 * POST /api/admin/hr/payroll/provider/sync
 * Synchronise une période pré-paie via le provider configuré pour ce tenant.
 * Agnostique : lit provider depuis tenants/{id}/settings/payroll, route via factory.
 *
 * Body : { periode: 'YYYY-MM' }
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { PayrollConnectorFactory } from '@/modules/human';
import { PrepaieBuilder } from '@/modules/human';
import type { PayrollProviderConfig } from '@/modules/human';
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

    const configPath = Nexus.getTenantPath('settings/payroll', caller.tenantId);
    const config = await Nexus.adapter.get<PayrollProviderConfig>(configPath);
    const providerId = config?.provider ?? process.env.PAYROLL_DEFAULT_PROVIDER;

    if (!providerId) {
        return NextResponse.json({
            error: 'Aucun provider paie configuré — connectez un prestataire dans Paramètres > Paie',
        }, { status: 422 });
    }

    let connector;
    try {
        connector = PayrollConnectorFactory.get(providerId);
    } catch {
        return NextResponse.json(
            { error: `Provider "${providerId}" inconnu. Vérifiez la configuration.` },
            { status: 422 },
        );
    }

    try {
        const summary = await PrepaieBuilder.build(caller.tenantId, month);
        const result = await connector.syncPeriod(summary);

        const periodPath = Nexus.getTenantPath(`payrollPeriods/${month}`, caller.tenantId);
        await Nexus.adapter.set(periodPath, {
            ...summary,
            provider: connector.id,
            syncStatus: result.success ? 'synced' : 'error',
            syncedAt: new Date().toISOString(),
            syncErrors: result.errors,
        }, { merge: true });

        logger.info(`[HR/Payroll] Sync ${month} via ${connector.id}`, {
            tenantId: caller.tenantId,
            ...result,
        });

        return NextResponse.json({
            success: result.success,
            provider: connector.id,
            periode: month,
            employeesUpserted: result.employeesUpserted,
            variablesAccepted: result.variablesAccepted,
            errors: result.errors,
        });
    } catch (err) {
        logger.error('[HR/Payroll] Sync failed', err);
        return NextResponse.json({ error: 'Erreur interne lors de la synchronisation' }, { status: 500 });
    }
}
