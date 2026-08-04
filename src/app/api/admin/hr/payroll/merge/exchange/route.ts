/**
 * POST /api/admin/hr/payroll/merge/exchange
 * Reçoit le public_token après que le client a terminé le flow Merge Link,
 * l'échange contre un account_token permanent, et le stocke dans Nexus.
 * Body : { publicToken: string }
 * Protégé : manager / directeur minimum.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { MergePayrollClient } from '@/verticals/restaurant/human/tip-pooling/payroll/MergePayrollClient';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest): Promise<NextResponse> {
    const caller = await requireTenantAdmin(req);
    if (isDenied(caller)) return caller as NextResponse;

    const { publicToken } = await req.json() as { publicToken?: string };
    if (!publicToken) {
        return NextResponse.json({ error: 'publicToken requis' }, { status: 400 });
    }

    try {
        const { account_token } = await MergePayrollClient.exchangeToken(publicToken);

        const path = Nexus.getTenantPath('settings/payroll');
        await Nexus.adapter.set(path, {
            provider: 'merge',
            mergeAccountToken: account_token,
            connectedAt: new Date().toISOString(),
        }, { merge: true });

        logger.info('[HR/Merge] Account token échangé et sauvegardé', {
            tenantId: caller.tenantId,
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        logger.error('[HR/Merge] Exchange failed', err);
        return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    }
}
