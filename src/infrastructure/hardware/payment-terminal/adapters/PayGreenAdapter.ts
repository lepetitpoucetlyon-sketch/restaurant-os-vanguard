import type { IPaymentTerminalAdapter, TerminalDevice, PaymentRequest, PaymentResult, RefundRequest, RefundResult, TerminalStatus } from '../types';

/**
 * PayGreenAdapter
 *
 * PayGreen — solution française CB + titres-restaurant + éco-contribution.
 * Compatible terminaux physiques Pax (via PayGreen) et paiement lien/QR.
 * Spécificité : suivi de l'impact environnemental des transactions (opt-in).
 *
 * Flux :
 *   1. POST /api/terminal/paygreen/payment → { orderId, url, instructionId }
 *   2. Poll GET /api/terminal/paygreen/payment/:id → pending | authorized | refused | cancelled
 *
 * Required env vars:
 *   PAYGREEN_API_KEY       — clé API PayGreen
 *   PAYGREEN_PUBLIC_KEY    — clé publique (signature HMAC)
 *   PAYGREEN_SHOP_ID       — identifiant boutique PayGreen
 *   PAYGREEN_ENVIRONMENT   — 'sandbox' | 'production'
 *
 * Routes backend : /api/terminal/paygreen/payment | /api/terminal/paygreen/payment/:id | /api/terminal/paygreen/refund
 */
export class PayGreenAdapter implements IPaymentTerminalAdapter {
  readonly type = 'paygreen' as const;
  readonly label = 'PayGreen (CB + Titres-Restaurant + éco)';
  readonly requiresConfig = true;

  private _status: TerminalStatus = 'disconnected';
  private _cancelRequested = false;
  private _currentInstructionId: string | null = null;

  async connect(_device: TerminalDevice): Promise<void> {
    const res = await fetch('/api/terminal/paygreen/ping');
    if (!res.ok) throw new Error('PayGreen: clé API invalide ou service inaccessible');
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

      // PayGreen supporte les titres-restaurant via CONECS nativement
      const allowedInstruments = request.allowedMethods?.includes('meal_voucher_edenred') ||
        request.allowedMethods?.includes('meal_voucher_sodexo') ||
        request.allowedMethods?.includes('meal_voucher_swile')
          ? ['BANK_CARD', 'CONECS']
          : ['BANK_CARD'];

      const createRes = await fetch('/api/terminal/paygreen/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountInCents,
          currency: request.currency ?? 'EUR',
          orderId: request.orderId,
          description: request.description,
          allowedInstruments,
        }),
      });

      const created = await createRes.json() as {
        instructionId: string;
        url?: string;
        error?: string;
      };

      if (created.error || !created.instructionId) {
        return { status: 'error', error: created.error ?? 'PayGreen: impossible de créer le paiement' };
      }

      this._currentInstructionId = created.instructionId;
      const result = await this._poll(created.instructionId, 300);
      this._status = 'connected';
      return result;
    } catch (err) {
      this._status = 'error';
      return { status: 'error', error: err instanceof Error ? err.message : 'Erreur PayGreen' };
    }
  }

  private async _poll(instructionId: string, maxSeconds: number): Promise<PaymentResult> {
    const deadline = Date.now() + maxSeconds * 1000;

    while (Date.now() < deadline) {
      if (this._cancelRequested) return { status: 'cancelled' };

      await delay(3000);

      const res = await fetch(`/api/terminal/paygreen/payment/${instructionId}`);
      const data = await res.json() as {
        status: 'pending' | 'authorized' | 'refused' | 'cancelled' | 'expired';
        transactionId?: string;
        instrument?: string;
        error?: string;
      };

      if (data.status === 'authorized') {
        const isMealVoucher = data.instrument === 'CONECS';
        return {
          status: 'approved',
          terminalTransactionId: data.transactionId ?? instructionId,
          method: isMealVoucher ? 'meal_voucher_edenred' : 'card',
          receiptData: { merchantName: 'PayGreen' },
        };
      }
      if (data.status === 'refused')   return { status: 'declined', error: data.error ?? 'PayGreen: paiement refusé' };
      if (data.status === 'cancelled') return { status: 'cancelled' };
      if (data.status === 'expired')   return { status: 'timeout', error: 'PayGreen: session expirée' };
    }

    return { status: 'timeout', error: 'PayGreen: délai d\'attente dépassé (5 min)' };
  }

  async refund(request: RefundRequest): Promise<RefundResult> {
    try {
      const amountInCents = Math.round(request.amountInMicrounits / 10_000);
      const res = await fetch('/api/terminal/paygreen/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalTransactionId: request.originalTransactionId,
          amountInCents,
          reason: request.reason,
        }),
      });
      const data = await res.json() as { refundId?: string; error?: string };
      if (data.error) return { status: 'error', error: data.error };
      return { status: 'approved', refundTransactionId: data.refundId };
    } catch (err) {
      return { status: 'error', error: err instanceof Error ? err.message : 'Erreur remboursement PayGreen' };
    }
  }

  async cancelCurrent(): Promise<void> {
    this._cancelRequested = true;
    if (this._currentInstructionId) {
      await fetch(`/api/terminal/paygreen/payment/${this._currentInstructionId}/cancel`, { method: 'DELETE' }).catch(() => {});
      this._currentInstructionId = null;
    }
    this._status = 'connected';
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
