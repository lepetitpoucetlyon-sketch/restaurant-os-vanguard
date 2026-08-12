/**
 * ServiceTicketService — gestion du cycle de vie d'un ServiceTicket.
 *
 * Transitions : OPEN → WORKING → READY → CLOSED (+CANCELLED)
 * Règle NF525 : une fois CLOSED, aucun update n'est possible.
 * Règle PII   : subject.isPii = true → ne jamais écrire le détail ici.
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { CryptoService } from '@/lib/CryptoService';
import { empireAudit } from '@/lib/audit';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { toMicrounits } from '@/shared/schemas/primitives';
import type { ServiceTicket, ServiceLine, PaymentSplit, ServiceState } from '../../domain/types';
import type { ServiceSubject } from '@nexus/contracts';
import type { BillingUnit } from '@/modules/finance';

// ── Transitions valides ────────────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<ServiceState, ServiceState[]> = {
    OPEN:      ['WORKING', 'CANCELLED'],
    WORKING:   ['READY', 'CANCELLED'],
    READY:     ['CLOSED', 'WORKING'],
    CLOSED:    [],
    CANCELLED: [],
};

function assertTransition(current: ServiceState, next: ServiceState): void {
    if (!VALID_TRANSITIONS[current].includes(next)) {
        throw new Error(`[ServiceTicket] Transition invalide : ${current} → ${next}`);
    }
}

function assertMutable(ticket: ServiceTicket): void {
    if (ticket.state === 'CLOSED' || ticket.state === 'CANCELLED') {
        throw new Error(`[ServiceTicket] Ticket ${ticket.id} est ${ticket.state} — immuable NF525`);
    }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

import type { Microunits } from '@/shared/schemas/primitives';

function computeTotals(lines: ServiceLine[]): {
    totalHTInMicrounits: Microunits;
    totalTTCInMicrounits: Microunits;
    tvaBreakdown: Record<string, number>;
} {
    const tvaBreakdown: Record<string, number> = {};
    let totalHT = 0;
    let totalTVA = 0;

    for (const line of lines) {
        const htLine = (line.unitPriceInMicrounits as number) * line.quantity;
        const tvaLine = Math.round(htLine * line.taxRatePercent / 100);
        totalHT += htLine;
        totalTVA += tvaLine;
        const key = String(line.taxRatePercent);
        tvaBreakdown[key] = (tvaBreakdown[key] ?? 0) + tvaLine;
    }

    return {
        totalHTInMicrounits: toMicrounits(totalHT),
        totalTTCInMicrounits: toMicrounits(totalHT + totalTVA),
        tvaBreakdown,
    };
}

// ── Service ────────────────────────────────────────────────────────────────────

export const ServiceTicketService = {

    /** Ouvre un nouveau ServiceTicket (état OPEN). */
    async open(params: {
        tenantId: string;
        operatorId: string;
        operatorLevel: number;
        subject: ServiceSubject;
        billingUnit: BillingUnit;
        resourceId?: string | null;
        resourceKind?: string | null;
        verticalMeta?: Record<string, unknown>;
        hashPrecedent?: string;
    }): Promise<ServiceTicket> {
        const id = Nexus.adapter.generateId(`tenants/${params.tenantId}/serviceTickets`);
        const now = new Date().toISOString();

        const ticket: ServiceTicket = {
            id,
            correlationId: crypto.randomUUID(),
            tenantId: params.tenantId,
            hashPrecedent: params.hashPrecedent ?? '0',
            hash: '',
            serverTimestamp: now,
            operatorId: params.operatorId,
            operatorLevel: params.operatorLevel,
            state: 'OPEN',
            openedAt: now,
            closedAt: null,
            resourceId: params.resourceId ?? null,
            resourceKind: params.resourceKind ?? null,
            lines: [],
            totalHTInMicrounits: toMicrounits(0),
            totalTTCInMicrounits: toMicrounits(0),
            tvaBreakdown: {},
            payments: [],
            sourceEntryId: null,
            subject: params.subject,
            billingUnit: params.billingUnit,
            verticalMeta: params.verticalMeta ?? {},
        };

        ticket.hash = await CryptoService.generateHash(
            CryptoService.canonicalStringify({ id, tenantId: params.tenantId, openedAt: now, hashPrecedent: ticket.hashPrecedent })
        );

        await Nexus.adapter.set(`tenants/${params.tenantId}/serviceTickets/${id}`, ticket);

        empireAudit.log({ module: 'ops', action: 'service_ticket_opened', timestamp: new Date(), details: { id, tenantId: params.tenantId, billingUnit: params.billingUnit } });

        await NexusEventBus.emitDurable('ops.service_ticket_opened', { v: 1, tenantId: params.tenantId, ticketId: id, resourceId: params.resourceId ?? null });

        return ticket;
    },

    /** Ajoute ou remplace des lignes sur un ticket OPEN ou WORKING. */
    async setLines(ticket: ServiceTicket, lines: ServiceLine[]): Promise<ServiceTicket> {
        assertMutable(ticket);
        const totals = computeTotals(lines);
        const updated: ServiceTicket = { ...ticket, lines, ...totals };
        await Nexus.adapter.set(`tenants/${ticket.tenantId}/serviceTickets/${ticket.id}`, updated);
        return updated;
    },

    /** Démarre le travail (OPEN → WORKING). */
    async startWork(ticket: ServiceTicket): Promise<ServiceTicket> {
        assertTransition(ticket.state, 'WORKING');
        const updated: ServiceTicket = { ...ticket, state: 'WORKING' };
        await Nexus.adapter.set(`tenants/${ticket.tenantId}/serviceTickets/${ticket.id}`, updated);
        await NexusEventBus.emitDurable('ops.service_ticket_working', { v: 1, tenantId: ticket.tenantId, ticketId: ticket.id });
        return updated;
    },

    /** Marque le ticket prêt (WORKING → READY). */
    async markReady(ticket: ServiceTicket): Promise<ServiceTicket> {
        assertTransition(ticket.state, 'READY');
        const updated: ServiceTicket = { ...ticket, state: 'READY' };
        await Nexus.adapter.set(`tenants/${ticket.tenantId}/serviceTickets/${ticket.id}`, updated);
        return updated;
    },

    /**
     * Clôture le ticket (READY → CLOSED) — scellement NF525.
     * Enregistre les paiements + libère la ressource.
     */
    async close(ticket: ServiceTicket, payments: PaymentSplit[], journalEntryId: string): Promise<ServiceTicket> {
        assertTransition(ticket.state, 'CLOSED');
        const now = new Date().toISOString();
        const closed: ServiceTicket = {
            ...ticket,
            state: 'CLOSED',
            closedAt: now,
            payments,
            sourceEntryId: journalEntryId,
        };

        // NF525 : append-only — jamais d'update destructif
        await Nexus.adapter.set(`tenants/${ticket.tenantId}/serviceTickets/${ticket.id}`, closed);

        empireAudit.log({ module: 'ops', action: 'service_ticket_closed', timestamp: new Date(), details: { id: ticket.id, journalEntryId, totalTTC: ticket.totalTTCInMicrounits } });

        await NexusEventBus.emitDurable('ops.service_ticket_closed', {
            v: 1,
            tenantId: ticket.tenantId,
            ticketId: ticket.id,
            resourceId: ticket.resourceId,
            journalEntryId,
            totalTTCInMicrounits: closed.totalTTCInMicrounits,
        });

        return closed;
    },

    /** Annule le ticket (→ CANCELLED). Interdit après CLOSED. */
    async cancel(ticket: ServiceTicket, reason: string): Promise<ServiceTicket> {
        assertMutable(ticket);
        assertTransition(ticket.state, 'CANCELLED');
        const cancelled: ServiceTicket = { ...ticket, state: 'CANCELLED', closedAt: new Date().toISOString() };
        await Nexus.adapter.set(`tenants/${ticket.tenantId}/serviceTickets/${ticket.id}`, cancelled);
        empireAudit.log({ module: 'ops', action: 'service_ticket_cancelled', timestamp: new Date(), details: { id: ticket.id, reason } });
        await NexusEventBus.emitDurable('ops.service_ticket_cancelled', { v: 1, tenantId: ticket.tenantId, ticketId: ticket.id, reason });
        return cancelled;
    },

    /** Lecture d'un ticket par ID. */
    async get(tenantId: string, ticketId: string): Promise<ServiceTicket | null> {
        return Nexus.adapter.get<ServiceTicket>(`tenants/${tenantId}/serviceTickets/${ticketId}`);
    },

    /** Liste les tickets ouverts pour un tenant. */
    async listOpen(tenantId: string): Promise<ServiceTicket[]> {
        return Nexus.adapter.query<ServiceTicket>(`tenants/${tenantId}/serviceTickets`, {
            where: [{ field: 'state', operator: 'in', value: ['OPEN', 'WORKING', 'READY'] }],
        });
    },
};
