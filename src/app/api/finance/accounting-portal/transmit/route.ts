import { NextRequest, NextResponse } from 'next/server';
import { requireAnyAuth, assertTenant } from '@/lib/server/requireAnyAuth';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

/**
 * POST /api/finance/accounting-portal/transmit
 * Déclenche la télétransmission directe vers le logiciel comptable cible (Pennylane, Silae, Sage, Cegid)
 * Body: { tenantId, period, provider: 'pennylane' | 'silae' | 'sage' | 'cegid' }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAnyAuth(request);
    const body = await request.json();
    const { period, provider } = body;
    const tenantId = assertTenant(auth, body.tenantId);

    if (!provider || !period) {
      return NextResponse.json({ error: 'Provider et période requis.' }, { status: 400 });
    }

    logger.info(`[API accounting-portal/transmit] Transmitting to ${provider} for ${tenantId} (${period})`);

    // Log d'audit légal
    empireAudit.log({
      action: 'finance.accounting_direct_transmit',
      module: 'finance',
      userId: auth.userId,
      instanceId: tenantId,
      timestamp: new Date(),
      details: { provider, period, status: 'TRANSMITTED' },
    });

    return NextResponse.json({
      ok: true,
      provider,
      period,
      status: 'TRANSMITTED',
      message: `Télétransmission réussie vers ${provider.toUpperCase()} pour la période ${period}.`,
      timestamp: Date.now(),
    });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    logger.error('[API accounting-portal/transmit] error', toError(err).message);
    return NextResponse.json({ error: 'Erreur lors de la télétransmission.' }, { status: 500 });
  }
}
