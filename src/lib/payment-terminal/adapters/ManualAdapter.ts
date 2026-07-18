import type { IPaymentTerminalAdapter, TerminalDevice, PaymentRequest, PaymentResult, RefundRequest, RefundResult, TerminalStatus } from '../types';

/**
 * ManualAdapter — fallback quand aucun terminal physique n'est configuré.
 * L'opérateur confirme le paiement manuellement (ex. terminal bancaire externe).
 * Le POS enregistre l'opération mais ne pilote pas le terminal.
 */
export class ManualAdapter implements IPaymentTerminalAdapter {
  readonly type = 'manual' as const;
  readonly label = 'Confirmation manuelle (sans TPE connecté)';
  readonly requiresConfig = false;

  private _status: TerminalStatus = 'connected';
  private _pendingResolve: ((result: PaymentResult) => void) | null = null;

  async connect(_device: TerminalDevice): Promise<void> {
    this._status = 'connected';
  }

  async disconnect(): Promise<void> {
    this._status = 'disconnected';
  }

  getStatus(): TerminalStatus { return this._status; }

  /**
   * Returns a promise that stays pending until confirmPayment() or cancelPayment() is called.
   * The PaymentDialog shows "En attente de confirmation opérateur..." with Confirmer/Annuler.
   */
  async charge(_request: PaymentRequest): Promise<PaymentResult> {
    this._status = 'busy';
    return new Promise<PaymentResult>(resolve => {
      this._pendingResolve = resolve;
    });
  }

  /** Called by the UI when the operator confirms payment was collected on the external terminal */
  confirmPayment(amountInMicrounits: number): void {
    if (!this._pendingResolve) return;
    const txId = `MANUAL_${Date.now()}`;
    this._pendingResolve({
      status: 'approved',
      terminalTransactionId: txId,
      method: 'card',
      amountInMicrounits,
    });
    this._pendingResolve = null;
    this._status = 'connected';
  }

  /** Called by the UI when the operator cancels */
  cancelPayment(): void {
    if (!this._pendingResolve) return;
    this._pendingResolve({ status: 'cancelled' });
    this._pendingResolve = null;
    this._status = 'connected';
  }

  async refund(request: RefundRequest): Promise<RefundResult> {
    // Manual refund — operator performs it on their terminal, we just record
    return {
      status: 'approved',
      refundTransactionId: `MANUAL_REFUND_${Date.now()}`,
    };
  }

  async cancelCurrent(): Promise<void> {
    this.cancelPayment();
  }
}
