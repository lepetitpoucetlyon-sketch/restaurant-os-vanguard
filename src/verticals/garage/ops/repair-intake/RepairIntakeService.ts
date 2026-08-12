/**
 * §8.8 — RepairIntakeService
 * Prise en charge véhicule garage, bâtie sur ServiceTicket.
 * <100 lignes = abstraction ServiceTicket validée.
 */
import { ServiceTicketService } from '@/modules/ops/service/core';
import { createSubject } from '@/kernel/nexus/contracts/ServiceSubject';
import { AutoOpsAdapter } from '../../adapters/AutoOpsAdapter';
import { toMicrounits } from '@/shared/schemas/primitives';
import type { PaymentSplit, ServiceLine } from '@/modules/ops/service/core';

interface CheckInParams {
    tenantId: string;
    vehicleId: string;
    vin: string;
    customerId: string;
    mileage: number;
    bayId: string;
    technicianId: string;
    operatorLevel: number;
}

interface CloseParams {
    ticketId: string;
    tenantId: string;
    parts: Array<{ name: string; qty: number; unitPriceHT: number }>;
    laborHours: number;
    laborHourlyRateHT: number;
    payments: PaymentSplit[];
    journalEntryId: string;
}

export const RepairIntakeService = {

    async checkIn(params: CheckInParams): Promise<string> {
        const subject = createSubject('vehicle', params.vehicleId, params.vin);
        const ticket = await ServiceTicketService.open({
            tenantId: params.tenantId,
            operatorId: params.technicianId,
            operatorLevel: params.operatorLevel,
            resourceId: params.bayId,
            resourceKind: 'bay',
            subject,
            billingUnit: 'parts_labor',
            verticalMeta: { vin: params.vin, customerId: params.customerId, mileage: params.mileage },
        });
        AutoOpsAdapter.emitVehicleCheckedIn({
            tenantId: params.tenantId, vehicleId: params.vehicleId,
            vin: params.vin, customerId: params.customerId,
            mileage: params.mileage, checkedInAt: ticket.openedAt,
        });
        return ticket.id;
    },

    async startRepair(tenantId: string, ticketId: string, technicianId: string): Promise<void> {
        const ticket = await ServiceTicketService.get(tenantId, ticketId);
        if (!ticket) throw new Error(`Ticket ${ticketId} introuvable`);
        await ServiceTicketService.startWork(ticket);
        AutoOpsAdapter.emitRepairStarted({
            tenantId, workOrderId: ticketId, technicianId,
            startedAt: new Date().toISOString(),
        });
    },

    async markVehicleReady(tenantId: string, ticketId: string): Promise<void> {
        const ticket = await ServiceTicketService.get(tenantId, ticketId);
        if (!ticket) throw new Error(`Ticket ${ticketId} introuvable`);
        await ServiceTicketService.markReady(ticket);
    },

    async closeAndInvoice(params: CloseParams): Promise<void> {
        const ticket = await ServiceTicketService.get(params.tenantId, params.ticketId);
        if (!ticket) throw new Error(`Ticket ${params.ticketId} introuvable`);

        const lines: ServiceLine[] = [
            ...params.parts.map((p, i) => ({
                lineId: `part-${i}`, productId: p.name, label: `Pièce : ${p.name}`,
                quantity: p.qty,
                unitPriceInMicrounits: toMicrounits(p.unitPriceHT),
                taxRatePercent: 20,
            })),
            ...(params.laborHours > 0 ? [{
                lineId: 'labor', productId: 'labor', label: "Main d'oeuvre",
                quantity: params.laborHours,
                unitPriceInMicrounits: toMicrounits(params.laborHourlyRateHT),
                taxRatePercent: 20,
            }] : []),
        ];

        const withLines = await ServiceTicketService.setLines(ticket, lines);
        await ServiceTicketService.close(withLines, params.payments, params.journalEntryId);

        AutoOpsAdapter.emitVehicleReleased({
            tenantId: params.tenantId, vehicleId: ticket.subject.ref,
            workOrderId: params.ticketId, customerId: String(ticket.verticalMeta['customerId'] ?? ''),
            releasedAt: new Date().toISOString(),
        });
    },
};
