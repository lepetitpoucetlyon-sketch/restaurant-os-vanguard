import { NextRequest, NextResponse } from 'next/server';
import { MonthlyAccountingPackService } from '@/modules/finance/comptabilite/services/MonthlyAccountingPackService';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

/**
 * GET /api/finance/accounting-portal/pack?tenantId=xxx&period=YYYY-MM
 * Génère et retourne l'ensemble des fichiers du pack comptable mensuel
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'demo-restaurant';
    const now = new Date();
    const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const period = searchParams.get('period') || defaultPeriod;

    const pack = await MonthlyAccountingPackService.generatePackFiles(tenantId, period);
    return NextResponse.json({ ok: true, pack });
  } catch (err) {
    logger.error('[API accounting-portal/pack] error', toError(err).message);
    return NextResponse.json({ error: 'Erreur lors de la génération des fichiers comptables.' }, { status: 500 });
  }
}
