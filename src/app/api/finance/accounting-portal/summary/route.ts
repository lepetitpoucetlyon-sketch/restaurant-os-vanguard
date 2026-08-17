import { NextRequest, NextResponse } from 'next/server';
import { MonthlyAccountingPackService } from '@/modules/finance/comptabilite/services/MonthlyAccountingPackService';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

/**
 * GET /api/finance/accounting-portal/summary?tenantId=xxx&period=YYYY-MM
 * Récupère le résumé financier, TVA, NF525 et anomalies pour l'Expert-Comptable
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'demo-restaurant';
    const now = new Date();
    const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const period = searchParams.get('period') || defaultPeriod;

    const summary = await MonthlyAccountingPackService.getMonthlySummary(tenantId, period);
    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    logger.error('[API accounting-portal/summary] error', toError(err).message);
    return NextResponse.json({ error: 'Erreur lors de la génération du résumé comptable.' }, { status: 500 });
  }
}
