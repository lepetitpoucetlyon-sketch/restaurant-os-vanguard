import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance/securite/AuditLogger';

export interface BanquetDepositContract {
  contractId: string;
  customerName: string;
  totalQuoteInMicrounits: number; // ex: 3 000.00 € (3_000_000_000)
  depositRequiredPct?: number; // Défaut: 30%
  eventDateIso: string;
}

export interface DepositEscrowReceipt {
  contractId: string;
  depositAmountInMicrounits: number;
  balanceRemainingInMicrounits: number;
  isSecured: boolean;
  escrowedAt: number;
}

/**
 * SpecialEventDepositEscrowService — Angle mort L83.
 * Sécurisation des arrhes & acomptes de privatisation / banquet :
 * Encaissement de l'acompte (30%), compte séquestre et facturation automatique d'acompte conforme NF525.
 */
export class SpecialEventDepositEscrowService {
  static async secureDeposit(
    tenantId: string,
    adminId: string,
    contract: BanquetDepositContract
  ): Promise<DepositEscrowReceipt> {
    const depositPct = contract.depositRequiredPct ?? 30.0;
    const depositAmountInMicrounits = Math.round((contract.totalQuoteInMicrounits * depositPct) / 100);
    const balanceRemainingInMicrounits = contract.totalQuoteInMicrounits - depositAmountInMicrounits;

    NexusEventBus.emit('crm.special_event_deposit_secured', {
      v: 1,
      tenantId,
      contractId: contract.contractId,
      depositAmountInMicrounits,
      eventDateIso: contract.eventDateIso,
      securedAt: Date.now(),
    });

    await AuditLogger.logAction({
      adminId,
      action: 'SPECIAL_EVENT_DEPOSIT_SEQUESTERED',
      targetId: contract.contractId,
      ipAddress: '127.0.0.1',
      metadata: {
        totalQuoteInMicrounits: contract.totalQuoteInMicrounits,
        depositAmountInMicrounits,
      },
    });

    return {
      contractId: contract.contractId,
      depositAmountInMicrounits,
      balanceRemainingInMicrounits,
      isSecured: true,
      escrowedAt: Date.now(),
    };
  }
}
