import type { IPaymentTerminalAdapter, TerminalDevice, PaymentRequest, PaymentResult, RefundRequest, RefundResult, TerminalStatus } from '../types';

/**
 * ConecsAdapter
 *
 * CONECS — réseau d'interopérabilité des titres-restaurant dématérialisés français.
 * Accepte : Edenred (Ticket Restaurant), Swile, Sodexo, Natixis/Apetiz.
 * Peut être utilisé en complément d'un TPE CB (split paiement) ou seul.
 *
 * Flux :
 *   1. POST /api/terminal/conecs/payment → { transactionId, qrCodeData } ou paiement direct si terminal physique CONECS
 *   2. Poll GET /api/terminal/conecs/payment/:id → pending | approved | refused | cancelled
 *
 * Deux modes de connexion :
 *   - terminal.connection === 'qr_link' : le client paie depuis son app titres-restaurant
 *   - terminal.connection === 'lan'     : terminal physique CONECS sur le LAN (ex: PAX A920)
 *
 * Required env vars:
 *   CONECS_MERCHANT_ID     — numéro SIRET ou identifiant CONECS
 *   CONECS_API_KEY         — clé API CONECS partenaire
 *   CONECS_ENVIRONMENT     — 'test' | 'production'
 *
 * Routes backend : /api/terminal/conecs/payment | /api/terminal/conecs/payment/:id | /api/terminal/conecs/refund
 */
export class ConecsAdapter implements IPaymentTerminalAdapter {
  readonly type = 'conecs' as const;
  readonly label = 'CONECS — Titres-Restaurant (Edenred / Swile / Sodexo / Natixis)';
  readonly requiresConfig = true;

  private _status: TerminalStatus = 'disconnected';
  private _device: TerminalDevice | null = null;
  private _cancelRequested = false;
  private _currentTxId: string | null = null;

  async connect(device: TerminalDevice): Promise<void> {
    this._device = device;
    const res = await fetch('/api/terminal/conecs/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: device.connection }),
    });
    if (!res.ok) throw new Error('CONECS: identifiants invalides ou service inaccessible');
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
      const amountInCents = Math.round(request.amountInMicrounits / 10_000);

      const createRes = await fetch('/api/terminal/conecs/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountInCents,
          currency: 'EUR',
          orderId: request.orderId,
          mode: this._device.connection,
          terminalIp: this._device.address,
          // CONECS ne couvre que les repas — obligation légale de déclaration
          mealAmount: amountInCents,
        }),
      });

      const created = await createRes.json() as {
        transactionId: string;
        qrCodeData?: string;
        error?: string;
      };

      if (created.error || !created.transactionId) {
        return { status: 'error', error: created.error ?? 'CONECS: impossible de créer la transaction' };
      }

      this._currentTxId = created.transactionId;

      // Terminal physique : timeout plus court (client présent)
      // QR link : timeout plus long (client peut être à table)
      const maxSeconds = this._device.connection === 'qr_link' ? 300 : 120;
      const result = await this._poll(created.transactionId, maxSeconds);
      this._status = 'connected';
      return result;
    } catch (err) {
      this._status = 'error';
      return { status: 'error', error: err instanceof Error ? err.message : 'Erreur CONECS' };
    }
  }

  private async _poll(transactionId: string, maxSeconds: number): Promise<PaymentResult> {
    const deadline = Date.now() + maxSeconds * 1000;

    while (Date.now() < deadline) {
      if (this._cancelRequested) return { status: 'cancelled' };

      await delay(2500);

      const res = await fetch(`/api/terminal/conecs/payment/${transactionId}`);
      const data = await res.json() as {
        status: 'pending' | 'approved' | 'refused' | 'cancelled' | 'expired';
        issuer?: 'edenred' | 'swile' | 'sodexo' | 'natixis';
        amount?: number;
        error?: string;
      };

      if (data.status === 'approved') {
        const methodMap = {
          edenred: 'meal_voucher_edenred',
          sodexo:  'meal_voucher_sodexo',
          swile:   'meal_voucher_swile',
          natixis: 'meal_voucher_edenred', // Natixis/Apetiz → closest enum
        } as const;
        return {
          status: 'approved',
          terminalTransactionId: transactionId,
          method: data.issuer ? methodMap[data.issuer] : 'meal_voucher_edenred',
          amountInMicrounits: (data.amount ?? 0) * 10_000,
          receiptData: { merchantName: `CONECS — ${data.issuer ?? 'Titre-Restaurant'}` },
        };
      }
      if (data.status === 'refused')   return { status: 'declined', error: data.error ?? 'CONECS: titre refusé ou solde insuffisant' };
      if (data.status === 'cancelled') return { status: 'cancelled' };
      if (data.status === 'expired')   return { status: 'timeout', error: 'CONECS: session expirée' };
    }

    return { status: 'timeout', error: 'CONECS: délai d\'attente dépassé' };
  }

  async refund(request: RefundRequest): Promise<RefundResult> {
    try {
      const amountInCents = Math.round(request.amountInMicrounits / 10_000);
      const res = await fetch('/api/terminal/conecs/refund', {
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
      return { status: 'error', error: err instanceof Error ? err.message : 'Erreur remboursement CONECS' };
    }
  }

  async cancelCurrent(): Promise<void> {
    this._cancelRequested = true;
    if (this._currentTxId) {
      await fetch(`/api/terminal/conecs/payment/${this._currentTxId}/cancel`, { method: 'DELETE' }).catch(() => {});
      this._currentTxId = null;
    }
    this._status = 'connected';
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
