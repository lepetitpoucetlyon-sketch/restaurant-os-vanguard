import type { IPaymentTerminalAdapter, TerminalDevice, PaymentRequest, PaymentResult, RefundRequest, RefundResult, TerminalStatus } from '../types';

/**
 * WorldlineAdapter (Ingenico / Atos Worldline)
 *
 * Couvre les terminaux Ingenico fournis par les banques françaises
 * (Crédit Agricole, BNP, Société Générale, LCL…).
 *
 * Protocole : TPAEXT (TPA Extended) over TCP/IP — terminal sur le même LAN.
 * Le serveur Next.js ouvre une socket TCP vers l'IP du terminal.
 *
 * Required env vars:
 *   WORLDLINE_TERMINAL_IP      — IP du terminal sur le LAN (ex: 192.168.1.50)
 *   WORLDLINE_TERMINAL_PORT    — port TPAEXT (défaut: 8888)
 *   WORLDLINE_MERCHANT_ID      — numéro commerçant
 *
 * Notre implémentation délègue la socket TCP au serveur Next.js
 * via une route API (le navigateur ne peut pas ouvrir des sockets TCP arbitraires).
 * Route backend : /api/terminal/worldline/charge
 */
export class WorldlineAdapter implements IPaymentTerminalAdapter {
  readonly type = 'worldline' as const;
  readonly label = 'Worldline / Ingenico (banque française — LAN)';
  readonly requiresConfig = true;

  private _status: TerminalStatus = 'disconnected';
  private _device: TerminalDevice | null = null;

  async connect(device: TerminalDevice): Promise<void> {
    this._device = device;
    // Ping via server-side socket
    const res = await fetch('/api/terminal/worldline/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip: device.address }),
    });
    if (!res.ok) throw new Error('Worldline: terminal inaccessible sur le réseau local');
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

      const res = await fetch('/api/terminal/worldline/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: this._device.address,
          merchantId: this._device.merchantRef,
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

      if (!data.approved) {
        return { status: 'declined', error: data.error ?? 'Terminal Worldline: refusé' };
      }

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
      return { status: 'error', error: err instanceof Error ? err.message : 'Erreur Worldline' };
    }
  }

  async refund(request: RefundRequest): Promise<RefundResult> {
    if (!this._device) return { status: 'error', error: 'Terminal non connecté' };
    try {
      const amountInCents = Math.round(request.amountInMicrounits / 10_000);
      const res = await fetch('/api/terminal/worldline/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: this._device.address,
          merchantId: this._device.merchantRef,
          originalTransactionId: request.originalTransactionId,
          amountInCents,
        }),
      });
      const data = await res.json() as { approved: boolean; transactionId?: string; error?: string };
      if (!data.approved) return { status: 'error', error: data.error };
      return { status: 'approved', refundTransactionId: data.transactionId };
    } catch (err) {
      return { status: 'error', error: err instanceof Error ? err.message : 'Erreur remboursement Worldline' };
    }
  }

  async cancelCurrent(): Promise<void> {
    if (!this._device) return;
    await fetch('/api/terminal/worldline/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip: this._device.address }),
    }).catch(() => {});
    this._status = 'connected';
  }
}
