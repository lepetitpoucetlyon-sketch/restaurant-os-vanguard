import type { IPaymentTerminalAdapter, TerminalDevice, PaymentRequest, PaymentResult, RefundRequest, RefundResult, TerminalStatus } from '../types';

/**
 * SquareAdapter
 *
 * Square Terminal API — terminaux Square Terminal, Square Reader.
 * Flux : POST /v2/terminals/checkouts → polling GET jusqu'à COMPLETED.
 *
 * Required env vars:
 *   SQUARE_ACCESS_TOKEN    — access token (Square Developer Dashboard)
 *   SQUARE_LOCATION_ID     — location ID
 *   SQUARE_ENVIRONMENT     — 'sandbox' | 'production'
 *
 * Routes backend : /api/terminal/square/checkout | /api/terminal/square/checkout/:id | /api/terminal/square/checkout/:id/cancel | /api/terminal/square/refund
 */
export class SquareAdapter implements IPaymentTerminalAdapter {
  readonly type = 'square' as const;
  readonly label = 'Square Terminal / Reader';
  readonly requiresConfig = true;

  private _status: TerminalStatus = 'disconnected';
  private _device: TerminalDevice | null = null;
  private _cancelRequested = false;
  private _currentCheckoutId: string | null = null;

  async connect(device: TerminalDevice): Promise<void> {
    this._device = device;
    const res = await fetch('/api/terminal/square/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: device.address }),
    });
    if (!res.ok) throw new Error('Square: device ID invalide ou accès Square refusé');
    this._status = 'connected';
  }

  async disconnect(): Promise<void> {
    this._status = 'disconnected';
    this._device = null;
  }

  getStatus(): TerminalStatus { return this._status; }

  async charge(request: PaymentRequest): Promise<PaymentResult> {
    if (!this._device) return { status: 'error', error: 'Terminal non connecté' };
    this._status = 'busy';
    this._cancelRequested = false;

    try {
      // Square uses cents (EUR = minor unit = cent)
      const amountInCents = Math.round(request.amountInMicrounits / 10_000);

      const createRes = await fetch('/api/terminal/square/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: this._device.address,
          amountInCents,
          currency: request.currency ?? 'EUR',
          orderId: request.orderId,
          note: request.description ?? `Commande ${request.orderId}`,
        }),
      });

      const created = await createRes.json() as { checkout?: { id: string }; error?: string };
      if (created.error || !created.checkout) return { status: 'error', error: created.error ?? 'Square: checkout non créé' };

      this._currentCheckoutId = created.checkout.id;
      const result = await this._poll(created.checkout.id, 180);
      this._status = 'connected';
      return result;
    } catch (err) {
      this._status = 'error';
      return { status: 'error', error: err instanceof Error ? err.message : 'Erreur Square Terminal' };
    }
  }

  private async _poll(checkoutId: string, maxSeconds: number): Promise<PaymentResult> {
    const deadline = Date.now() + maxSeconds * 1000;

    while (Date.now() < deadline) {
      if (this._cancelRequested) return { status: 'cancelled' };

      await delay(2500);

      const res = await fetch(`/api/terminal/square/checkout/${checkoutId}`);
      const data = await res.json() as {
        status: 'PENDING' | 'IN_PROGRESS' | 'CANCEL_REQUESTED' | 'CANCELED' | 'COMPLETED';
        payment_ids?: string[];
        card?: { card_brand: string; last_4: string };
      };

      if (data.status === 'COMPLETED') {
        return {
          status: 'approved',
          terminalTransactionId: data.payment_ids?.[0],
          method: 'card',
          receiptData: {
            cardBrand: data.card?.card_brand,
            cardLast4: data.card?.last_4,
          },
        };
      }
      if (data.status === 'CANCELED' || data.status === 'CANCEL_REQUESTED') return { status: 'cancelled' };
    }

    return { status: 'timeout', error: 'Square: délai d\'attente dépassé (3 min)' };
  }

  async refund(request: RefundRequest): Promise<RefundResult> {
    try {
      const amountInCents = Math.round(request.amountInMicrounits / 10_000);
      const res = await fetch('/api/terminal/square/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: request.originalTransactionId,
          amountInCents,
          reason: request.reason,
        }),
      });
      const data = await res.json() as { refund?: { id: string }; error?: string };
      if (data.error) return { status: 'error', error: data.error };
      return { status: 'approved', refundTransactionId: data.refund?.id };
    } catch (err) {
      return { status: 'error', error: err instanceof Error ? err.message : 'Erreur remboursement Square' };
    }
  }

  async cancelCurrent(): Promise<void> {
    this._cancelRequested = true;
    if (this._currentCheckoutId) {
      await fetch(`/api/terminal/square/checkout/${this._currentCheckoutId}/cancel`, { method: 'POST' }).catch(() => {});
      this._currentCheckoutId = null;
    }
    this._status = 'connected';
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
