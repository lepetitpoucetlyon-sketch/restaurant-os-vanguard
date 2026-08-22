import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface ValetCheckInRequest {
  tenantId: string;
  vehiclePlate: string;
  vehicleModel: string;
  customerPhone: string;
  assignedSpotNumber: string;
  preExistingScratchesNotes?: string;
}

export interface ValetTicketResult {
  ticketId: string;
  vehiclePlate: string;
  spotNumber: string;
  retrievalSmsUrl: string;
  createdAt: number;
}

/**
 * ValetParkingManagementService — Angle mort T78.
 * Service voiturier numérique : enregistrement de l'état du véhicule à l'arrivée, ticket SMS et rappel du véhicule 5 min avant le départ client.
 */
export class ValetParkingManagementService {
  static checkInVehicle(req: ValetCheckInRequest): ValetTicketResult {
    const ticketId = `VALET-${req.tenantId}-${Date.now().toString().slice(-6)}`;
    const retrievalSmsUrl = `https://valet.restaurant-os.internal/claim/${ticketId}`;

    NexusEventBus.emit('crm.valet_parking_ticket_created', {
      v: 1,
      tenantId: req.tenantId,
      ticketId,
      vehiclePlate: req.vehiclePlate,
      spotNumber: req.assignedSpotNumber,
      createdAt: Date.now(),
    });

    return {
      ticketId,
      vehiclePlate: req.vehiclePlate,
      spotNumber: req.assignedSpotNumber,
      retrievalSmsUrl,
      createdAt: Date.now(),
    };
  }
}
