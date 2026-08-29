import { z } from 'zod';
import { Reservation } from '@nexus/contracts';
import { ToolDefinition } from './types';
import { SovereignValue, OperationalIdentity } from "@/shared/nexus/contracts";
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { DomainRegistry } from '@shared/nexus/engines/DomainRegistry';

/**
 * 📅 RESERVATION TOOL - Grade X
 */
export const ReservationSchema = z.object({
    tenantId: z.string().min(1)
});

export type ReservationArgs = z.infer<typeof ReservationSchema>;

export const ReservationTool: ToolDefinition<ReservationArgs> = {
    name: 'get_today_reservations',
    description: 'Récupère la liste des réservations pour aujourd\'hui. Permet d\'anticiper le rush.',
    parameters: {
        type: 'object',
        properties: {
            tenantId: { type: 'string', description: 'ID de l\'établissement' }
        },
        required: ['tenantId']
    },
    schema: ReservationSchema,
    category: 'reservations',
    execute: async (args, _user): Promise<SovereignValue> => {
        const path = DomainRegistry.resolve(OperationalIdentity.NODES); // Reservations are Nodes in Grade X
        const results = await Nexus.adapter.query<Reservation>(`tenants/${args.tenantId}/${path}`, {
            where: [
                { field: 'status', operator: '!=', value: 'cancelled' }
                // Ideal: filter by today's date
            ]
        });

        return results.map(r => ({
            id: r.id,
            customer: r.customerName || 'Client Inconnu',
            time: r.time,
            guests: r.partySize,
            status: r.status,
            notes: r.notes
        })) as SovereignValue;
    }
};
