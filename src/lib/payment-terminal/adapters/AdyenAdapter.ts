import type { IPaymentTerminalAdapter, TerminalDevice, PaymentRequest, PaymentResult, RefundRequest, RefundResult, TerminalStatus } from '../types';

/**
 * AdyenAdapter
 *
 * Adyen Terminal API — protocole NEXO Retailer over cloud ou LAN.
 *
 * Terminaux supportés : Adyen V400m, S1F2, UX300, AMS1
 * Connexion : cloud (POIID via Adyen) ou LAN direct (certificat requis)
 *
 * Required env vars:
 *   ADYEN_TERMINAL_API_KEY     — API key (Customer Area → Developers)
 *   ADYEN_MERCHANT_ACCOUNT     — merchant account name
 *   ADYEN_TERMINAL_POIID       — terminal serial (ex: V400m-123456789)
 *   ADYEN_ENVIRONMENT          — 'test' | 'live'
 *
 * Routes backend : /api/terminal/adyen/charge | /api/terminal/adyen/status | /api/terminal/adyen/abort | /api/terminal/adyen/refund
 */
export class AdyenAdapter implements IPaymentTerminalAdapter {
  readonly type = 'adyen' as const;
  readonly label = 'Adyen Terminal (V400m / S1F2 / UX300)';
  readonly requiresConfig = true;

  private _status: TerminalStatus = 'disconnected';
  private _device: TerminalDevice | null = null;
  private _currentServiceId: string | null = null;

  async connect(device: TerminalDevice): Promise<void> {
    this._device = device;
    const res = await fetch('/api/terminal/adyen/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ poiId: device.address ?? device.merchantRef }),
    });
    if (!res.ok) throw new Error('Adyen: terminal inaccessible ou POIID invalide');
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

    const serviceId = `ROS_${request.orderId}_${Date.now()}`;
    this._currentServiceId = serviceId;

    try {
      const amountInCents = Math.round(request.amountInMicrounits / 10_000);

      const res = await fetch('/api/terminal/adyen/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poiId: this._device.address ?? this._device.merchantRef,
          serviceId,
          amountInCents,
          currency: request.currency ?? 'EUR',
          orderId: request.orderId,
        }),
      });

      const data = await res.json() as {
        approved: boolean;
        pspReference?: string;
        cardBrand?: string;
        cardLast4?: string;
        authCode?: string;
        error?: string;
      };

      this._status = 'connected';
      this._currentServiceId = null;

      if (!data.approved) return { status: 'declined', error: data.error ?? 'Adyen: paiement refusé' };

      return {
        status: 'approved',
        terminalTransactionId: data.pspReference,
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
      return { status: 'error', error: err instanceof Error ? err.message : 'Erreur Adyen Terminal' };
    }
  }

  async refund(request: RefundRequest): Promise<RefundResult> {
    try {
      const amountInCents = Math.round(request.amountInMicrounits / 10_000);
      const res = await fetch('/api/terminal/adyen/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalPspReference: request.originalTransactionId,
          amountInCents,
          reason: request.reason,
        }),
      });
      const data = await res.json() as { pspReference?: string; error?: string };
      if (data.error) return { status: 'error', error: data.error };
      return { status: 'approved', refundTransactionId: data.pspReference };
    } catch (err) {
      return { status: 'error', error: err instanceof Error ? err.message : 'Erreur remboursement Adyen' };
    }
  }

  async cancelCurrent(): Promise<void> {
    if (!this._device || !this._currentServiceId) return;
    await fetch('/api/terminal/adyen/abort', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        poiId: this._device.address ?? this._device.merchantRef,
        serviceId: this._currentServiceId,
      }),
    }).catch(() => {});
    this._currentServiceId = null;
    this._status = 'connected';
  }
}
