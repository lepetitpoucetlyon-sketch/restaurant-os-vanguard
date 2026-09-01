import type { IPaymentTerminalAdapter, TerminalDevice, PaymentRequest, PaymentResult, RefundRequest, RefundResult, TerminalStatus } from '../types';

/**
 * LyfPayAdapter
 *
 * Lyf Pay (ex-Lydia Pro) — solution de paiement QR de BNP Paribas.
 * Utilisé en restauration (QR sur addition, borne ou comptoir).
 * Le client scanne le QR avec l'app Lyf Pay ou tout wallet NFC compatible.
 *
 * Flux :
 *   1. POST /api/terminal/lyfpay/payment → { transactionId, qrCodeData, deepLink }
 *   2. Poll GET /api/terminal/lyfpay/payment/:id → WAITING | SUCCESS | FAILED | CANCELLED
 *
 * Required env vars:
 *   LYFPAY_API_KEY         — clé API partenaire Lyf Pay
 *   LYFPAY_MERCHANT_ID     — identifiant commerçant
 *   LYFPAY_ENVIRONMENT     — 'sandbox' | 'production'
 *
 * Routes backend : /api/terminal/lyfpay/payment | /api/terminal/lyfpay/payment/:id | /api/terminal/lyfpay/refund
 */
export class LyfPayAdapter implements IPaymentTerminalAdapter {
  readonly type = 'lyfpay' as const;
  readonly label = 'Lyf Pay / BNP Paribas (QR contactless)';
  readonly requiresConfig = true;

  private _status: TerminalStatus = 'disconnected';
  private _cancelRequested = false;
  private _currentTxId: string | null = null;

  async connect(_device: TerminalDevice): Promise<void> {
    const res = await fetch('/api/terminal/lyfpay/ping');
    if (!res.ok) throw new Error('Lyf Pay: clé API invalide ou service inaccessible');
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

      const createRes = await fetch('/api/terminal/lyfpay/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountInCents,
          currency: request.currency ?? 'EUR',
          orderId: request.orderId,
          label: request.description ?? `Commande ${request.orderId}`,
        }),
      });

      const created = await createRes.json() as {
        transactionId: string;
        qrCodeData?: string;
        deepLink?: string;
        error?: string;
      };

      if (created.error || !created.transactionId) {
        return { status: 'error', error: created.error ?? 'Lyf Pay: impossible de créer le paiement' };
      }

      this._currentTxId = created.transactionId;
      const result = await this._poll(created.transactionId, 300);
      this._status = 'connected';
      return result;
    } catch (err) {
      this._status = 'error';
      return { status: 'error', error: err instanceof Error ? err.message : 'Erreur Lyf Pay' };
    }
  }

  private async _poll(transactionId: string, maxSeconds: number): Promise<PaymentResult> {
    const deadline = Date.now() + maxSeconds * 1000;

    while (Date.now() < deadline) {
      if (this._cancelRequested) return { status: 'cancelled' };

      await delay(3000);

      const res = await fetch(`/api/terminal/lyfpay/payment/${transactionId}`);
      const data = await res.json() as {
        status: 'WAITING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
        lyf_transaction_id?: string;
        error?: string;
      };

      if (data.status === 'SUCCESS') {
        return {
          status: 'approved',
          terminalTransactionId: data.lyf_transaction_id ?? transactionId,
          method: 'contactless',
          receiptData: { merchantName: 'Lyf Pay' },
        };
      }
      if (data.status === 'FAILED')    return { status: 'declined', error: data.error ?? 'Lyf Pay: paiement refusé' };
      if (data.status === 'CANCELLED') return { status: 'cancelled' };
      if (data.status === 'EXPIRED')   return { status: 'timeout', error: 'Lyf Pay: QR expiré' };
    }

    return { status: 'timeout', error: 'Lyf Pay: délai d\'attente dépassé (5 min)' };
  }

  async refund(request: RefundRequest): Promise<RefundResult> {
    try {
      const amountInCents = Math.round(request.amountInMicrounits / 10_000);
      const res = await fetch('/api/terminal/lyfpay/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalTransactionId: request.originalTransactionId,
          amountInCents,
        }),
      });
      const data = await res.json() as { refundId?: string; error?: string };
      if (data.error) return { status: 'error', error: data.error };
      return { status: 'approved', refundTransactionId: data.refundId };
    } catch (err) {
      return { status: 'error', error: err instanceof Error ? err.message : 'Erreur remboursement Lyf Pay' };
    }
  }

  async cancelCurrent(): Promise<void> {
    this._cancelRequested = true;
    if (this._currentTxId) {
      await fetch(`/api/terminal/lyfpay/payment/${this._currentTxId}/cancel`, { method: 'DELETE' }).catch(() => {});
      this._currentTxId = null;
    }
    this._status = 'connected';
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
