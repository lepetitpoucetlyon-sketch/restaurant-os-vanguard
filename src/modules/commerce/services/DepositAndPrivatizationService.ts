import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

export type PreAuthStatus = 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'RELEASED';

export interface GroupReservationDeposit {
  id: string;
  tenantId: string;
  reservationId: string;
  customerId: string;
  customerName: string;
  partySize: number;
  depositPerCoverInMicrounits: number;
  totalDepositInMicrounits: number;
  stripePaymentIntentId: string;
  status: PreAuthStatus;
  createdAt: number;
  authorizedAt?: number;
  resolvedAt?: number;
  resolutionReason?: string;
}

/**
 * 💳 DepositAndPrivatizationService — Commerce & Réservations
 * Gestion des pré-autorisations bancaires, acomptes et pénalités No-Show pour grands groupes.
 */
export class DepositAndPrivatizationService {
  /**
   * Crée et initialise une demande d'empreinte bancaire / acompte pour une réservation de groupe.
   */
  static async createGroupDepositRequest(
    tenantId: string,
    reservationId: string,
    customerId: string,
    customerName: string,
    partySize: number,
    depositPerCoverInMicrounits: number = 20000000 // 20 € / couvert par défaut
  ): Promise<GroupReservationDeposit> {
    const depositId = `dep_${reservationId}_${Date.now()}`;
    const totalDepositInMicrounits = partySize * depositPerCoverInMicrounits;

    const deposit: GroupReservationDeposit = {
      id: depositId,
      tenantId,
      reservationId,
      customerId,
      customerName,
      partySize,
      depositPerCoverInMicrounits,
      totalDepositInMicrounits,
      stripePaymentIntentId: `pi_mock_${Date.now()}`,
      status: 'AUTHORIZED',
      createdAt: Date.now(),
      authorizedAt: Date.now(),
    };

    await Nexus.adapter.set(`tenants/${tenantId}/deposits/${depositId}`, deposit);

    empireAudit.log({
      module: 'commerce',
      action: 'GROUP_DEPOSIT_AUTHORIZED',
      details: {
        depositId,
        reservationId,
        partySize,
        totalDepositInMicrounits,
      },
      severity: 'low',
      timestamp: new Date(),
    });

    logger.info(`[Deposit] Caution autorisée pour résa ${reservationId} (${partySize} couverts = ${(totalDepositInMicrounits / 1000000).toFixed(2)}€)`);
    return deposit;
  }

  /**
   * Encaisse la caution en cas de No-Show non excusé.
   */
  static async captureDepositOnNoShow(
    tenantId: string,
    depositId: string,
    reason: string = 'client_no_show'
  ): Promise<GroupReservationDeposit> {
    const depositPath = `tenants/${tenantId}/deposits/${depositId}`;
    const deposit = await Nexus.adapter.get<GroupReservationDeposit>(depositPath);

    if (!deposit) {
      throw new Error(`Caution introuvable: ${depositId}`);
    }

    if (deposit.status !== 'AUTHORIZED') {
      throw new Error(`Impossible de capturer une caution en statut: ${deposit.status}`);
    }

    const updated: GroupReservationDeposit = {
      ...deposit,
      status: 'CAPTURED',
      resolvedAt: Date.now(),
      resolutionReason: reason,
    };

    await Nexus.adapter.set(depositPath, updated);

    // Émission de l'événement de recette exceptionnelle No-Show
    await NexusEventBus.emit('finance.refund_issued', {
      tenantId,
      referenceId: depositId,
      amountInMicrounits: deposit.totalDepositInMicrounits,
      reason: 'NO_SHOW_PENALTY_CAPTURED',
    });

    empireAudit.log({
      module: 'commerce',
      action: 'DEPOSIT_CAPTURED_NO_SHOW',
      details: { depositId, amount: deposit.totalDepositInMicrounits, reason },
      severity: 'medium',
      timestamp: new Date(),
    });

    logger.warn(`[Deposit] Caution ${depositId} capturée suite à No-Show (${reason})`);
    return updated;
  }

  /**
   * Libère l'empreinte bancaire lors de l'arrivée et installation des convives au restaurant.
   */
  static async releaseDepositOnArrival(
    tenantId: string,
    depositId: string
  ): Promise<GroupReservationDeposit> {
    const depositPath = `tenants/${tenantId}/deposits/${depositId}`;
    const deposit = await Nexus.adapter.get<GroupReservationDeposit>(depositPath);

    if (!deposit) {
      throw new Error(`Caution introuvable: ${depositId}`);
    }

    const updated: GroupReservationDeposit = {
      ...deposit,
      status: 'RELEASED',
      resolvedAt: Date.now(),
      resolutionReason: 'guest_checked_in',
    };

    await Nexus.adapter.set(depositPath, updated);

    logger.info(`[Deposit] Empreinte bancaire ${depositId} relâchée : convives installés à table.`);
    return updated;
  }
}
