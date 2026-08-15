/**
 * 🖨️ HardwareMocks — Émulateurs Haute Fidélité pour Tests E2E et Terrain
 * Simule les périphériques physiques (Imprimantes ESC/POS, TPE Stripe Terminal, Sondes HACCP).
 */

export interface PrintedReceipt {
  id: string;
  type: 'CUSTOMER_RECEIPT' | 'KITCHEN_TICKET' | 'Z_REPORT';
  content: string;
  drawerKicked: boolean;
  cutTriggered: boolean;
  timestamp: number;
}

export class MockEscPosPrinter {
  private static receipts: PrintedReceipt[] = [];

  static printReceipt(
    type: PrintedReceipt['type'],
    lines: string[],
    kickDrawer: boolean = false
  ): PrintedReceipt {
    const id = `rec_${Date.now()}_${Math.random().toString(36).substring(4)}`;
    const receipt: PrintedReceipt = {
      id,
      type,
      content: lines.join('\n'),
      drawerKicked: kickDrawer,
      cutTriggered: true,
      timestamp: Date.now(),
    };

    this.receipts.push(receipt);
    return receipt;
  }

  static getHistory(): PrintedReceipt[] {
    return [...this.receipts];
  }

  static clearHistory(): void {
    this.receipts = [];
  }
}

export interface EmvTransactionResult {
  transactionId: string;
  amountInCents: number;
  cardBrand: 'VISA' | 'MASTERCARD' | 'CB' | 'AMEX';
  last4: string;
  authCode: string;
  status: 'SUCCESS' | 'DECLINED' | 'TIMEOUT';
  timestamp: number;
}

export class MockStripeTerminalReader {
  static async processCardPayment(
    amountInCents: number,
    options?: { shouldDecline?: boolean; cardBrand?: EmvTransactionResult['cardBrand'] }
  ): Promise<EmvTransactionResult> {
    const isSuccess = !options?.shouldDecline;
    const now = Date.now();

    return {
      transactionId: `txn_stripe_${now}`,
      amountInCents,
      cardBrand: options?.cardBrand || 'CB',
      last4: '4242',
      authCode: isSuccess ? `AUTH-${Math.random().toString(36).substring(4).toUpperCase()}` : '',
      status: isSuccess ? 'SUCCESS' : 'DECLINED',
      timestamp: now,
    };
  }
}

export class MockIotTempSensor {
  static getReading(sensorId: 'cold_pos' | 'cold_neg'): {
    sensorId: string;
    temperatureCelsius: number;
    isCompliant: boolean;
    batteryLevel: number;
  } {
    if (sensorId === 'cold_pos') {
      return {
        sensorId,
        temperatureCelsius: 2.8,
        isCompliant: true,
        batteryLevel: 94,
      };
    }

    return {
      sensorId,
      temperatureCelsius: -19.2,
      isCompliant: true,
      batteryLevel: 88,
    };
  }
}
