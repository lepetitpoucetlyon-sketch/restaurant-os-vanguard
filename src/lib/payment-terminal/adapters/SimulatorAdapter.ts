import type { IPaymentTerminalAdapter, TerminalDevice, PaymentRequest, PaymentResult, RefundRequest, RefundResult, TerminalStatus } from '../types';

export class SimulatorAdapter implements IPaymentTerminalAdapter {
  readonly type = 'simulator' as const;
  readonly label = 'Simulateur (dev/démo)';
  readonly requiresConfig = false;

  private _status: TerminalStatus = 'disconnected';
  /** Set to true in tests to simulate decline */
  static forceDecline = false;

  async connect(_device: TerminalDevice): Promise<void> {
    await delay(200);
    this._status = 'connected';
  }

  async disconnect(): Promise<void> {
    this._status = 'disconnected';
  }

  getStatus(): TerminalStatus { return this._status; }

  async charge(request: PaymentRequest): Promise<PaymentResult> {
    this._status = 'busy';
    await delay(1800); // simulate terminal interaction time

    if (SimulatorAdapter.forceDecline) {
      this._status = 'connected';
      return { status: 'declined', error: 'Simulation: carte refusée' };
    }

    const txId = `SIM_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    this._status = 'connected';
    return {
      status: 'approved',
      terminalTransactionId: txId,
      method: 'card',
      amountInMicrounits: request.amountInMicrounits,
      tipInMicrounits: request.tipInMicrounits ?? 0,
      receiptData: {
        cardBrand: 'VISA',
        cardLast4: '4242',
        authCode: 'SIM' + Math.floor(Math.random() * 900000 + 100000),
        merchantName: 'Restaurant OS Demo',
      },
    };
  }

  async refund(request: RefundRequest): Promise<RefundResult> {
    await delay(1000);
    return {
      status: 'approved',
      refundTransactionId: `SIM_REFUND_${Date.now()}`,
    };
  }

  async cancelCurrent(): Promise<void> {
    this._status = 'connected';
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
