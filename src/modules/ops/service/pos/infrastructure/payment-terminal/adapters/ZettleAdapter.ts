import type { IPaymentTerminalAdapter, TerminalDevice, PaymentRequest, PaymentResult, RefundRequest, RefundResult, TerminalStatus } from '../types';

/**
 * ZettleAdapter (PayPal Zettle)
 *
 * Lecteur de carte mobile Zettle (Bluetooth ou USB).
 * Flux : création d'un "payment" via l'API Zettle → polling jusqu'à complétion.
 * L'opérateur accepte le paiement sur l'app Zettle ou le lecteur autonome.
 *
 * Terminaux supportés : Zettle Reader 2, Zettle Terminal
 *
 * Required env vars:
 *   ZETTLE_API_KEY         — clé API (Zettle Developer Portal)
 *   ZETTLE_CLIENT_ID       — OAuth client ID
 *
 * Routes backend : /api/terminal/zettle/payment | /api/terminal/zettle/payment/:uuid | /api/terminal/zettle/refund
 */
export class ZettleAdapter implements IPaymentTerminalAdapter {
  readonly type = 'zettle' as const;
  readonly label = 'PayPal Zettle (Reader 2 / Terminal)';
  readonly requiresConfig = true;

  private _status: TerminalStatus = 'disconnected';
  private _cancelRequested = false;
  private _currentUuid: string | null = null;

  async connect(_device: TerminalDevice): Promise<void> {
    const res = await fetch('/api/terminal/zettle/ping');
    if (!res.ok) throw new Error('Zettle: clé API invalide ou service inaccessible');
    this._status = 'connected';
  }

  async disconnect(): Promise<void> {
    this._status = 'disconnected';
  }

  getStatus(): TerminalStatus { return this._status; }

  async charge(request: PaymentRequest): Promise<PaymentResult> {
    this._status = 'busy';
    this._cancelRequested = false;

    try {
      const amountInCents = Math.round(request.amountInMicrounits / 10_000);

      const createRes = await fetch('/api/terminal/zettle/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountInCents,
          currency: request.currency ?? 'EUR',
          orderId: request.orderId,
          description: request.description ?? `Commande ${request.orderId}`,
        }),
      });

      const created = await createRes.json() as { uuid: string; error?: string };
      if (created.error) return { status: 'error', error: created.error };

      this._currentUuid = created.uuid;
      const result = await this._poll(created.uuid, 180);
      this._status = 'connected';
      return result;
    } catch (err) {
      this._status = 'error';
      return { status: 'error', error: err instanceof Error ? err.message : 'Erreur Zettle' };
    }
  }

  private async _poll(uuid: string, maxSeconds: number): Promise<PaymentResult> {
    const deadline = Date.now() + maxSeconds * 1000;

    while (Date.now() < deadline) {
      if (this._cancelRequested) return { status: 'cancelled' };

      await delay(2500);

      const res = await fetch(`/api/terminal/zettle/payment/${uuid}`);
      const data = await res.json() as {
        state: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELED';
        uuid?: string;
        cardType?: string;
        maskedPan?: string;
        authorizationCode?: string;
      };

      if (data.state === 'COMPLETED') {
        return {
          status: 'approved',
          terminalTransactionId: uuid,
          method: 'card',
          receiptData: {
            cardBrand: data.cardType?.toUpperCase(),
            cardLast4: data.maskedPan?.slice(-4),
            authCode: data.authorizationCode,
          },
        };
      }
      if (data.state === 'FAILED')   return { status: 'declined', error: 'Zettle: paiement refusé' };
      if (data.state === 'CANCELED') return { status: 'cancelled' };
    }

    return { status: 'timeout', error: 'Zettle: délai d\'attente dépassé (3 min)' };
  }

  async refund(request: RefundRequest): Promise<RefundResult> {
    try {
      const amountInCents = Math.round(request.amountInMicrounits / 10_000);
      const res = await fetch(`/api/terminal/zettle/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalPaymentUuid: request.originalTransactionId,
          amount: amountInCents,
        }),
      });
      const data = await res.json() as { uuid?: string; error?: string };
      if (data.error) return { status: 'error', error: data.error };
      return { status: 'approved', refundTransactionId: data.uuid };
    } catch (err) {
      return { status: 'error', error: err instanceof Error ? err.message : 'Erreur remboursement Zettle' };
    }
  }

  async cancelCurrent(): Promise<void> {
    this._cancelRequested = true;
    if (this._currentUuid) {
      await fetch(`/api/terminal/zettle/payment/${this._currentUuid}/cancel`, { method: 'DELETE' }).catch(() => {});
      this._currentUuid = null;
    }
    this._status = 'connected';
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
