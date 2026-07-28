/**
 * GET /api/admin/hr/export/csv?periode=YYYY-MM
 * Exporte le pré-paie du mois en CSV compatible Excel FR (séparateur ;, BOM UTF-8).
 * Protégé : manager / directeur minimum.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { PrepaieBuilder } from '@/modules/human/payroll';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest): Promise<NextResponse> {
    const caller = await requireTenantAdmin(req);
    if (isDenied(caller)) return caller as NextResponse;

    const periode = req.nextUrl.searchParams.get('periode')
        ?? new Date().toISOString().slice(0, 7); // défaut : mois courant

    if (!/^\d{4}-\d{2}$/.test(periode)) {
        return NextResponse.json({ error: 'periode must be YYYY-MM' }, { status: 400 });
    }

    try {
        const summary = await PrepaieBuilder.build(caller.tenantId, periode);
        const csv = PrepaieBuilder.toCsv(summary);

        logger.info(`[HR/CSV] Export pré-paie ${periode} — ${summary.rows.length} salariés`, {
            tenantId: caller.tenantId,
        });

        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="prepaie_${caller.tenantId}_${periode}.csv"`,
                'Cache-Control': 'no-store',
            },
        });
    } catch (err) {
        logger.error('[HR/CSV] Export failed', err);
        return NextResponse.json({ error: 'Export failed' }, { status: 500 });
    }
}
