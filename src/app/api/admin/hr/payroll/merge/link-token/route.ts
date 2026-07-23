/**
 * POST /api/admin/hr/payroll/merge/link-token
 * Génère un link_token Merge.dev pour ouvrir Merge Link dans le navigateur.
 * Le client connecte son compte PayFit / BambooHR / ADP etc. via l'UI Merge.
 * Protégé : manager / directeur minimum.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { MergePayrollClient } from '@/lib/payroll/MergePayrollClient';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest): Promise<NextResponse> {
    const caller = await requireTenantAdmin(req);
    if (isDenied(caller)) return caller as NextResponse;

    try {
        const { link_token } = await MergePayrollClient.createLinkToken(caller.tenantId);
        logger.info('[HR/Merge] Link token créé', { tenantId: caller.tenantId });
        return NextResponse.json({ link_token });
    } catch (err) {
        logger.error('[HR/Merge] Link token failed', err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
