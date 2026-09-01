import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface BillDispatchPayload {
  tenantId: string;
  orderId: string;
  tableNumber: string;
  totalInMicrounits: number;
  channel: 'sms' | 'qr' | 'link';
  recipientPhone?: string;
  expiresInMinutes?: number;
}

export interface BillDispatchResult {
  orderId: string;
  channel: 'sms' | 'qr' | 'link';
  shareUrl: string;
  qrDataUri: string;
  token: string;
  expiresAt: number;
}

/**
 * SharedBillDispatchService — Angle mort A7.
 * Génère et diffuse l'addition digitale aux convives (QR Code de table, SMS ou lien Web éphémère) avant encaissement.
 */
export class SharedBillDispatchService {
  private static readonly DEFAULT_EXPIRY_MINUTES = 60;

  static async dispatchBill(payload: BillDispatchPayload): Promise<BillDispatchResult> {
    const expiryMinutes = payload.expiresInMinutes || this.DEFAULT_EXPIRY_MINUTES;
    const expiresAt = Date.now() + (expiryMinutes * 60 * 1000);
    const token = `BILL-${payload.tenantId}-${payload.orderId}-${Date.now().toString(36)}`;
    const shareUrl = `https://pay.restaurant-os.internal/b/${token}`;
    const qrDataUri = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><text>QR-${token}</text></svg>`;

    NexusEventBus.emit('pos.shared_bill_dispatched', {
      v: 1,
      tenantId: payload.tenantId,
      orderId: payload.orderId,
      channel: payload.channel,
      recipient: payload.recipientPhone,
      dispatchedAt: Date.now(),
    });

    return {
      orderId: payload.orderId,
      channel: payload.channel,
      shareUrl,
      qrDataUri,
      token,
      expiresAt,
    };
  }
}
