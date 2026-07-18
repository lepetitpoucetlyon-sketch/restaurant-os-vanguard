import type { IPaymentTerminalAdapter, TerminalDevice, PaymentRequest, PaymentResult, RefundRequest, RefundResult, TerminalStatus } from '../types';

/**
 * StripeTerminalAdapter
 *
 * Wraps @stripe/terminal-js (loadStripeTerminal).
 * SDK is loaded lazily — only installed when Stripe Terminal is configured.
 *
 * Connexion BLE : Stripe Reader M2 / BBPOS WisePad 3 / S700
 * Connexion LAN : Stripe WisePOS E (smart reader)
 *
 * PCI DSS: card data is handled entirely by the Stripe Terminal SDK.
 * Our code only receives paymentIntentId from the server.
 *
 * Setup required:
 *   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY — publishable key
 *   STRIPE_TERMINAL_LOCATION_ID        — location ID from Stripe dashboard
 *   /api/terminal/connection-token     — backend route (creates connection token)
 */
export class StripeTerminalAdapter implements IPaymentTerminalAdapter {
  readonly type = 'stripe' as const;
  readonly label = 'Stripe Terminal (M2 / WisePOS E)';
  readonly requiresConfig = true;

  private _status: TerminalStatus = 'disconnected';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _terminal: any = null;

  async connect(device: TerminalDevice): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // Lazy-load Stripe Terminal SDK
      // npm install @stripe/terminal-js — add when activating this adapter
      const { loadStripeTerminal } = await import(
        /* webpackChunkName: "stripe-terminal" */
        '@stripe/terminal-js' as string
      );

      this._terminal = await loadStripeTerminal();

      const instance = this._terminal.create({
        onFetchConnectionToken: async () => {
          const res = await fetch('/api/terminal/connection-token', { method: 'POST' });
          const data = await res.json() as { secret: string };
          return data.secret;
        },
        onUnexpectedReaderDisconnect: () => {
          this._status = 'error';
        },
      });

      const connectResult = await instance.connectBluetoothReader(
        { id: device.address },
        { failIfInUse: true }
      );

      if (connectResult.error) throw new Error(connectResult.error.message);
      this._terminal = instance;
      this._status = 'connected';
    } catch (err) {
      this._status = 'error';
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    if (this._terminal) {
      await this._terminal.disconnectReader?.();
    }
    this._status = 'disconnected';
  }

  getStatus(): TerminalStatus { return this._status; }

  async charge(request: PaymentRequest): Promise<PaymentResult> {
    if (!this._terminal) return { status: 'error', error: 'Terminal non connecté' };

    this._status = 'busy';
    try {
      // 1. Create PaymentIntent on server (amount in cents — Stripe uses cents)
      const amountInCents = Math.round(request.amountInMicrounits / 10_000);
      const intentRes = await fetch('/api/terminal/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountInCents,
          currency: request.currency ?? 'eur',
          orderId: request.orderId,
        }),
      });
      const { clientSecret } = await intentRes.json() as { clientSecret: string };

      // 2. Collect payment method (shows on terminal screen)
      const collectResult = await this._terminal.collectPaymentMethod(clientSecret);
      if (collectResult.error) {
        this._status = 'connected';
        return { status: collectResult.error.code === 'canceled' ? 'cancelled' : 'error', error: collectResult.error.message };
      }

      // 3. Confirm payment
      const confirmResult = await this._terminal.confirmPaymentIntent(collectResult.paymentIntent);
      if (confirmResult.error) {
        this._status = 'connected';
        return { status: 'declined', error: confirmResult.error.message };
      }

      const pi = confirmResult.paymentIntent;
      const charge = pi.charges?.data?.[0];
      this._status = 'connected';

      return {
        status: 'approved',
        terminalTransactionId: pi.id,
        method: 'card',
        amountInMicrounits: request.amountInMicrounits,
        receiptData: {
          cardBrand: charge?.payment_method_details?.card_present?.brand?.toUpperCase(),
          cardLast4: charge?.payment_method_details?.card_present?.last4,
          authCode: charge?.payment_method_details?.card_present?.generated_card,
        },
      };
    } catch (err) {
      this._status = 'error';
      return { status: 'error', error: err instanceof Error ? err.message : 'Erreur Stripe Terminal' };
    }
  }

  async refund(request: RefundRequest): Promise<RefundResult> {
    try {
      const amountInCents = Math.round(request.amountInMicrounits / 10_000);
      const res = await fetch('/api/terminal/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId: request.originalTransactionId,
          amount: amountInCents,
        }),
      });
      const data = await res.json() as { id?: string; error?: string };
      if (data.error) return { status: 'error', error: data.error };
      return { status: 'approved', refundTransactionId: data.id };
    } catch (err) {
      return { status: 'error', error: err instanceof Error ? err.message : 'Erreur remboursement' };
    }
  }

  async cancelCurrent(): Promise<void> {
    await this._terminal?.cancelCollectPaymentMethod?.();
    this._status = 'connected';
  }
}
