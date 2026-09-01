import type { IPaymentTerminalAdapter, TerminalDevice, PaymentRequest, PaymentResult, RefundRequest, RefundResult, TerminalStatus } from '../types';

/**
 * VerifoneAdapter
 *
 * Verifone Cloud Connect — terminaux Carbon 10 / P400 / e285.
 * API REST Verifone Cloud (différent du protocole VIPA local).
 *
 * Required env vars:
 *   VERIFONE_API_KEY       — clé API Verifone Cloud
 *   VERIFONE_ENTITY_ID     — entity (merchant) ID
 *   VERIFONE_ENVIRONMENT   — 'sandbox' | 'production'
 *
 * Routes backend : /api/terminal/verifone/charge | /api/terminal/verifone/refund | /api/terminal/verifone/cancel
 */
export class VerifoneAdapter implements IPaymentTerminalAdapter {
  readonly type = 'verifone' as const;
  readonly label = 'Verifone Cloud (Carbon 10 / P400 / e285)';
  readonly requiresConfig = true;

  private _status: TerminalStatus = 'disconnected';
  private _device: TerminalDevice | null = null;
  private _currentTxId: string | null = null;

  async connect(device: TerminalDevice): Promise<void> {
    this._device = device;
    const res = await fetch('/api/terminal/verifone/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ terminalId: device.address }),
    });
    if (!res.ok) throw new Error('Verifone: terminal introuvable ou Cloud Connect inaccessible');
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

    try {
      const amountInCents = Math.round(request.amountInMicrounits / 10_000);

      const res = await fetch('/api/terminal/verifone/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          terminalId: this._device.address,
          amountInCents,
          currency: request.currency ?? 'EUR',
          orderId: request.orderId,
          description: request.description,
        }),
      });

      const data = await res.json() as {
        approved: boolean;
        transactionId?: string;
        cardBrand?: string;
        maskedPan?: string;
        authCode?: string;
        error?: string;
      };

      this._status = 'connected';
      this._currentTxId = null;

      if (!data.approved) return { status: 'declined', error: data.error ?? 'Verifone: paiement refusé' };

      return {
        status: 'approved',
        terminalTransactionId: data.transactionId,
        method: 'card',
        amountInMicrounits: request.amountInMicrounits,
        receiptData: {
          cardBrand: data.cardBrand,
          cardLast4: data.maskedPan?.slice(-4),
          authCode: data.authCode,
        },
      };
    } catch (err) {
      this._status = 'error';
      return { status: 'error', error: err instanceof Error ? err.message : 'Erreur Verifone' };
    }
  }

  async refund(request: RefundRequest): Promise<RefundResult> {
    try {
      const amountInCents = Math.round(request.amountInMicrounits / 10_000);
      const res = await fetch('/api/terminal/verifone/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalTransactionId: request.originalTransactionId,
          amountInCents,
        }),
      });
      const data = await res.json() as { approved: boolean; transactionId?: string; error?: string };
      if (!data.approved) return { status: 'error', error: data.error };
      return { status: 'approved', refundTransactionId: data.transactionId };
    } catch (err) {
      return { status: 'error', error: err instanceof Error ? err.message : 'Erreur remboursement Verifone' };
    }
  }

  async cancelCurrent(): Promise<void> {
    if (!this._device) return;
    await fetch('/api/terminal/verifone/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ terminalId: this._device.address }),
    }).catch(() => {});
    this._currentTxId = null;
    this._status = 'connected';
  }
}
