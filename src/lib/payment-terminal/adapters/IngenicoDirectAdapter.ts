import type { IPaymentTerminalAdapter, TerminalDevice, PaymentRequest, PaymentResult, RefundRequest, RefundResult, TerminalStatus } from '../types';

/**
 * IngenicoDirectAdapter
 *
 * Ingenico Connect / PAYONE — accès direct hors intermédiation bancaire.
 * Distinct de WorldlineAdapter qui passe par la banque (TPAEXT LAN).
 *
 * Terminaux supportés : Ingenico Lane 3000/5000/7000, Move 5000, Desk 3500/5000
 * Protocol : NEXO Retailer Protocol over cloud (JSON/REST) via PAYONE
 *
 * Required env vars:
 *   INGENICO_MERCHANT_ID       — merchant ID (PAYONE)
 *   INGENICO_API_KEY           — API key
 *   INGENICO_TERMINAL_ID       — terminal logique (TID)
 *   INGENICO_ENVIRONMENT       — 'test' | 'live'
 *
 * Routes backend : /api/terminal/ingenico/charge | /api/terminal/ingenico/refund | /api/terminal/ingenico/cancel
 */
export class IngenicoDirectAdapter implements IPaymentTerminalAdapter {
  readonly type = 'ingenico' as const;
  readonly label = 'Ingenico Direct / PAYONE (Lane 3000-7000, Move 5000)';
  readonly requiresConfig = true;

  private _status: TerminalStatus = 'disconnected';
  private _device: TerminalDevice | null = null;
  private _currentTxRef: string | null = null;

  async connect(device: TerminalDevice): Promise<void> {
    this._device = device;
    const res = await fetch('/api/terminal/ingenico/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tid: device.merchantRef }),
    });
    if (!res.ok) throw new Error('Ingenico: TID invalide ou PAYONE inaccessible');
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

    const txRef = `ROS${request.orderId}${Date.now()}`;
    this._currentTxRef = txRef;

    try {
      const amountInCents = Math.round(request.amountInMicrounits / 10_000);

      const res = await fetch('/api/terminal/ingenico/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tid: this._device.merchantRef,
          txRef,
          amountInCents,
          currency: request.currency ?? 'EUR',
          orderId: request.orderId,
        }),
      });

      const data = await res.json() as {
        approved: boolean;
        transactionId?: string;
        cardBrand?: string;
        cardLast4?: string;
        authCode?: string;
        error?: string;
      };

      this._status = 'connected';
      this._currentTxRef = null;

      if (!data.approved) return { status: 'declined', error: data.error ?? 'Ingenico: refusé' };

      return {
        status: 'approved',
        terminalTransactionId: data.transactionId,
        method: 'card',
        amountInMicrounits: request.amountInMicrounits,
        receiptData: {
          cardBrand: data.cardBrand,
          cardLast4: data.cardLast4,
          authCode: data.authCode,
        },
      };
    } catch (err) {
      this._status = 'error';
      return { status: 'error', error: err instanceof Error ? err.message : 'Erreur Ingenico' };
    }
  }

  async refund(request: RefundRequest): Promise<RefundResult> {
    if (!this._device) return { status: 'error', error: 'Terminal non connecté' };
    try {
      const amountInCents = Math.round(request.amountInMicrounits / 10_000);
      const res = await fetch('/api/terminal/ingenico/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tid: this._device.merchantRef,
          originalTransactionId: request.originalTransactionId,
          amountInCents,
        }),
      });
      const data = await res.json() as { approved: boolean; transactionId?: string; error?: string };
      if (!data.approved) return { status: 'error', error: data.error };
      return { status: 'approved', refundTransactionId: data.transactionId };
    } catch (err) {
      return { status: 'error', error: err instanceof Error ? err.message : 'Erreur remboursement Ingenico' };
    }
  }

  async cancelCurrent(): Promise<void> {
    if (!this._device || !this._currentTxRef) return;
    await fetch('/api/terminal/ingenico/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tid: this._device.merchantRef, txRef: this._currentTxRef }),
    }).catch(() => {});
    this._currentTxRef = null;
    this._status = 'connected';
  }
}
