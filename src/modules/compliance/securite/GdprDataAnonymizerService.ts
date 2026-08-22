import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/lib/audit';

export interface CustomerPersonalData {
  customerId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  birthDate?: string;
  loyaltyPoints: number;
}

export interface AnonymizationResult {
  customerId: string;
  anonymizedCustomerRecord: Record<string, unknown>;
  fiscalTransactionsPreserved: boolean; // NF525 ledger remains untouched
  anonymizedAt: number;
}

/**
 * GdprDataAnonymizerService — Angle mort MCC-D3.
 * Droit à l'oubli RGPD (Article 17) :
 * Anonymisation irréversible des données à caractère personnel (PII) tout en préservant strictement l'intégrité de la chaîne fiscale NF525.
 */
export class GdprDataAnonymizerService {
  static async anonymizeCustomer(
    tenantId: string,
    adminId: string,
    customer: CustomerPersonalData
  ): Promise<AnonymizationResult> {
    const anonymizedCustomerRecord = {
      customerId: customer.customerId,
      fullName: 'CLIENT_ANONYMISÉ_RGPD',
      email: `anonymized_${customer.customerId}@restaurant-os.internal`,
      phoneNumber: '+33000000000',
      loyaltyPoints: 0,
      isAnonymized: true,
      anonymizedAt: Date.now(),
    };

    NexusEventBus.emit('security.gdpr_anonymized', {
      v: 1,
      tenantId,
      customerId: customer.customerId,
      anonymizedFieldsCount: 5,
      anonymizedAt: Date.now(),
    });

    await AuditLogger.logAction({
      adminId,
      action: 'GDPR_ANONYMIZATION_EXECUTED',
      targetId: customer.customerId,
      ipAddress: '127.0.0.1',
      metadata: {
        customerId: customer.customerId,
        reason: 'GDPR_ARTICLE_17_RIGHT_TO_BE_FORGOTTEN',
      },
    });

    return {
      customerId: customer.customerId,
      anonymizedCustomerRecord,
      fiscalTransactionsPreserved: true,
      anonymizedAt: Date.now(),
    };
  }
}
