import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface InterStationTransferRequest {
  tenantId: string;
  transferredByStaffId: string;
  fromStation: 'bar' | 'chaud' | 'patisserie' | 'cave_a_vin';
  toStation: 'chaud' | 'bar' | 'patisserie' | 'cave_a_vin';
  sku: string;
  productName: string;
  quantity: number; // ex: 1 bouteille de Cognac pour flambage cuisine
  costInMicrounits: number;
}

export interface InterStationTransferReceipt {
  transferId: string;
  fromStation: string;
  toStation: string;
  costInMicrounits: number;
  transferredAt: number;
}

/**
 * InterStationTransferTrackerService — Angle mort T60.
 * Traçabilité des transferts inter-postes internes (ex: bouteille de vin/alcool prélevée du bar par la cuisine pour une sauce ou flambage) avec réimputation analytique.
 */
export class InterStationTransferTrackerService {
  static recordTransfer(req: InterStationTransferRequest): InterStationTransferReceipt {
    const transferId = `TRANSFER-${req.tenantId}-${Date.now()}`;

    NexusEventBus.emit('stock.inter_station_transfer_recorded', {
      v: 1,
      tenantId: req.tenantId,
      fromStation: req.fromStation,
      toStation: req.toStation,
      sku: req.sku,
      quantity: req.quantity,
      costInMicrounits: req.costInMicrounits,
      transferredAt: Date.now(),
    });

    return {
      transferId,
      fromStation: req.fromStation,
      toStation: req.toStation,
      costInMicrounits: req.costInMicrounits,
      transferredAt: Date.now(),
    };
  }
}
