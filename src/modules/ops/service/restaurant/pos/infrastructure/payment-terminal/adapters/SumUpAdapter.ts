import type { IPaymentTerminalAdapter, TerminalDevice, PaymentRequest, PaymentResult, RefundRequest, RefundResult, TerminalStatus } from '../types';

/**
 * SumUpAdapter
 *
 * SumUp Air (BLE) + SumUp Solo (3G standalone).
 * Uses SumUp REST API — no native SDK, fully server-side token exchange.
 *
 * Required env vars:
 *   SUMUP_AFFILIATE_KEY    — from SumUp developer portal
 *   SUMUP_API_KEY          — OAuth access token (refreshed server-side)
 *
 * Flow:
 *   POST /api/terminal/sumup/checkout → creates checkout
 *   Poll GET /api/terminal/sumup/checkout/{id} → until PAID or FAILED
 *
 * The terminal itself handles card interaction via BLE with the SumUp app,
 * or standalone for Solo. We just track the transaction state.
 */
export class SumUpAdapter implements IPaymentTerminalAdapter {
  readonly type = 'sumup' as const;
  readonly label = 'SumUp (Air BLE / Solo 3G)';
  readonly requiresConfig = true;

  private _status: TerminalStatus = 'disconnected';
  private _currentCheckoutId: string | null = null;
  private _cancelRequested = false;

  async connect(_device: TerminalDevice): Promise<void> {
    // SumUp Air: BLE pairing is done in the SumUp app, not via web API.
    // We verify the affiliate key is valid by pinging the merchant endpoint.
    const res = await fetch('/api/terminal/sumup/ping');
    if (!res.ok) throw new Error('SumUp: clé API invalide ou réseau inaccessible');
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
      const amountInEuros = request.amountInMicrounits / 1_000_000;

      // 1. Create checkout
      const checkoutRes = await fetch('/api/terminal/sumup/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountInEuros,
          currency: request.currency ?? 'EUR',
          orderId: request.orderId,
          description: request.description ?? `Commande ${request.orderId}`,
        }),
      });

      const checkout = await checkoutRes.json() as { id: string; error?: string };
      if (checkout.error) return { status: 'error', error: checkout.error };

      this._currentCheckoutId = checkout.id;

      // 2. Poll until terminal completes (max 3 minutes)
      const result = await this._pollCheckout(checkout.id, 180);
      this._status = 'connected';
      return result;
    } catch (err) {
      this._status = 'error';
      return { status: 'error', error: err instanceof Error ? err.message : 'Erreur SumUp' };
    }
  }

  private async _pollCheckout(checkoutId: string, maxSeconds: number): Promise<PaymentResult> {
    const deadline = Date.now() + maxSeconds * 1000;

    while (Date.now() < deadline) {
      if (this._cancelRequested) return { status: 'cancelled' };

      await delay(2000);

      const res = await fetch(`/api/terminal/sumup/checkout/${checkoutId}`);
      const data = await res.json() as { status: string; transaction_code?: string; card?: { last_4_digits: string; type: string } };

      if (data.status === 'PAID') {
        return {
          status: 'approved',
          terminalTransactionId: data.transaction_code,
          method: 'card',
          receiptData: {
            cardBrand: data.card?.type?.toUpperCase(),
            cardLast4: data.card?.last_4_digits,
          },
        };
      }

      if (data.status === 'FAILED') return { status: 'declined', error: 'SumUp: paiement refusé' };
      if (data.status === 'CANCELLED') return { status: 'cancelled' };
    }

    return { status: 'timeout', error: 'SumUp: délai d\'attente dépassé (3 min)' };
  }

  async refund(request: RefundRequest): Promise<RefundResult> {
    try {
      const res = await fetch(`/api/terminal/sumup/refund/${request.originalTransactionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: request.amountInMicrounits / 1_000_000 }),
      });
      const data = await res.json() as { status?: string; error?: string };
      if (data.error) return { status: 'error', error: data.error };
      return { status: 'approved', refundTransactionId: `SUMUP_REFUND_${Date.now()}` };
    } catch (err) {
      return { status: 'error', error: err instanceof Error ? err.message : 'Erreur remboursement SumUp' };
    }
  }

  async cancelCurrent(): Promise<void> {
    this._cancelRequested = true;
    if (this._currentCheckoutId) {
      await fetch(`/api/terminal/sumup/checkout/${this._currentCheckoutId}/cancel`, { method: 'DELETE' }).catch(() => {});
      this._currentCheckoutId = null;
    }
    this._status = 'connected';
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
