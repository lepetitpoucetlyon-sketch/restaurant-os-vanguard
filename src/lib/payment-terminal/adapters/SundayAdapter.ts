import type { IPaymentTerminalAdapter, TerminalDevice, PaymentRequest, PaymentResult, RefundRequest, RefundResult, TerminalStatus } from '../types';

/**
 * SundayAdapter
 *
 * Sunday — paiement QR table, très répandu en restauration française.
 * Le client scanne un QR sur la table → paie sur son téléphone → restaurant reçoit confirmation.
 *
 * Flux :
 *   1. POST /api/terminal/sunday/payment → { paymentId, qrUrl }
 *   2. Le caissier affiche le QR (géré par le composant appelant via PaymentResult.qrUrl)
 *   3. Poll GET /api/terminal/sunday/payment/:id → PENDING | COMPLETED | CANCELLED | EXPIRED
 *   4. On reçoit confirmation sans intervention physique sur un terminal
 *
 * Connection type : qr_link (pas de hardware)
 *
 * Required env vars:
 *   SUNDAY_API_KEY         — clé API Sunday (espace partenaires Sunday)
 *   SUNDAY_RESTAURANT_ID   — identifiant restaurant Sunday
 *
 * Routes backend : /api/terminal/sunday/payment | /api/terminal/sunday/payment/:id | /api/terminal/sunday/payment/:id/cancel | /api/terminal/sunday/refund
 */
export class SundayAdapter implements IPaymentTerminalAdapter {
  readonly type = 'sunday' as const;
  readonly label = 'Sunday (QR table — paiement sur mobile)';
  readonly requiresConfig = true;

  private _status: TerminalStatus = 'disconnected';
  private _cancelRequested = false;
  private _currentPaymentId: string | null = null;

  async connect(_device: TerminalDevice): Promise<void> {
    const res = await fetch('/api/terminal/sunday/ping');
    if (!res.ok) throw new Error('Sunday: clé API invalide ou service inaccessible');
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

      const createRes = await fetch('/api/terminal/sunday/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountInCents,
          currency: request.currency ?? 'EUR',
          orderId: request.orderId,
          tableRef: request.description,
          tipEnabled: !!request.tipOnTerminal,
        }),
      });

      const created = await createRes.json() as {
        paymentId: string;
        qrUrl?: string;
        deepLink?: string;
        error?: string;
      };

      if (created.error || !created.paymentId) {
        return { status: 'error', error: created.error ?? 'Sunday: impossible de créer le paiement' };
      }

      this._currentPaymentId = created.paymentId;

      // Poll jusqu'à 5 minutes (client peut mettre du temps à scanner + payer)
      const result = await this._poll(created.paymentId, 300);
      this._status = 'connected';
      return result;
    } catch (err) {
      this._status = 'error';
      return { status: 'error', error: err instanceof Error ? err.message : 'Erreur Sunday' };
    }
  }

  private async _poll(paymentId: string, maxSeconds: number): Promise<PaymentResult> {
    const deadline = Date.now() + maxSeconds * 1000;

    while (Date.now() < deadline) {
      if (this._cancelRequested) return { status: 'cancelled' };

      await delay(3000);

      const res = await fetch(`/api/terminal/sunday/payment/${paymentId}`);
      const data = await res.json() as {
        status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED' | 'FAILED';
        transactionId?: string;
        paidAmountInCents?: number;
        tipInCents?: number;
        paymentMethod?: string;
        error?: string;
      };

      if (data.status === 'COMPLETED') {
        return {
          status: 'approved',
          terminalTransactionId: data.transactionId ?? paymentId,
          method: 'card',
          amountInMicrounits: (data.paidAmountInCents ?? 0) * 10_000,
          tipInMicrounits: (data.tipInCents ?? 0) * 10_000,
          receiptData: { merchantName: 'Sunday' },
        };
      }
      if (data.status === 'CANCELLED') return { status: 'cancelled' };
      if (data.status === 'EXPIRED')   return { status: 'timeout', error: 'Sunday: QR expiré (5 min)' };
      if (data.status === 'FAILED')    return { status: 'declined', error: data.error ?? 'Sunday: paiement refusé' };
    }

    return { status: 'timeout', error: 'Sunday: délai d\'attente dépassé (5 min)' };
  }

  async refund(request: RefundRequest): Promise<RefundResult> {
    try {
      const amountInCents = Math.round(request.amountInMicrounits / 10_000);
      const res = await fetch('/api/terminal/sunday/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalPaymentId: request.originalTransactionId,
          amountInCents,
          reason: request.reason,
        }),
      });
      const data = await res.json() as { refundId?: string; error?: string };
      if (data.error) return { status: 'error', error: data.error };
      return { status: 'approved', refundTransactionId: data.refundId };
    } catch (err) {
      return { status: 'error', error: err instanceof Error ? err.message : 'Erreur remboursement Sunday' };
    }
  }

  async cancelCurrent(): Promise<void> {
    this._cancelRequested = true;
    if (this._currentPaymentId) {
      await fetch(`/api/terminal/sunday/payment/${this._currentPaymentId}/cancel`, { method: 'DELETE' }).catch(() => {});
      this._currentPaymentId = null;
    }
    this._status = 'connected';
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
