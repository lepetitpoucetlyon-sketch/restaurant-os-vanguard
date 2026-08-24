import { NextRequest, NextResponse } from 'next/server';
import { MonthlyAccountingPackService } from '@/modules/finance';
import { requireAnyAuth } from '@/lib/server/requireAnyAuth';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

/**
 * GET /api/finance/accounting-portal/summary?tenantId=xxx&period=YYYY-MM
 * Récupère le résumé financier, TVA, NF525 et anomalies pour l'Expert-Comptable
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAnyAuth(request);
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || auth.tenantId;
    const now = new Date();
    const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const period = searchParams.get('period') || defaultPeriod;

    const summary = await MonthlyAccountingPackService.getMonthlySummary(tenantId, period);
    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    logger.error('[API accounting-portal/summary] error', toError(err).message);
    return NextResponse.json({ error: 'Erreur lors de la génération du résumé comptable.' }, { status: 500 });
  }
}
