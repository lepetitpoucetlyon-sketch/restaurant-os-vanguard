import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface CoatCheckIssueRequest {
  tenantId: string;
  tagNumber: string; // ex: 'VEST-042'
  customerPhone: string;
  garmentDescription: string; // ex: 'Manteau laine noir trench'
}

export interface CoatCheckTagResult {
  tagNumber: string;
  digitalClaimQrUrl: string;
  smsClaimToken: string;
  issuedAt: number;
}

/**
 * DigitalCoatCheckTagService — Angle mort T77.
 * Vestiaire numérique par SMS & QR code : remplace les tickets papier égarés et sécurise la restitution des vêtements.
 */
export class DigitalCoatCheckTagService {
  static issueDigitalTag(req: CoatCheckIssueRequest): CoatCheckTagResult {
    const smsClaimToken = `CLAIM-${req.tagNumber}-${Date.now().toString().slice(-4)}`;
    const digitalClaimQrUrl = `https://qr.restaurant-os.internal/vestiaire/${req.tagNumber}`;

    NexusEventBus.emit('crm.digital_coat_check_issued', {
      v: 1,
      tenantId: req.tenantId,
      tagNumber: req.tagNumber,
      customerPhone: req.customerPhone,
      issuedAt: Date.now(),
    });

    return {
      tagNumber: req.tagNumber,
      digitalClaimQrUrl,
      smsClaimToken,
      issuedAt: Date.now(),
    };
  }
}
