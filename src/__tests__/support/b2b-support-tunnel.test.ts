import { describe, it, expect, beforeEach, vi } from "vitest";
import "@/e2e/vanguard/mocks";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { NexusEventBus } from "@/shared/eventBus/NexusEventBus";
import type { SupportTicket } from "@/shared/schemas";

describe("🛰️ B2B Support Tunnel & MCC Moderation Integration Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("1. Création & Stockage des Tickets B2B", () => {
        it("devrait enregistrer un ticket de support avec son tenantId et émettre l événement", async () => {
            const emittedEvents: Array<{ event: string; payload: unknown }> = [];
            NexusEventBus.on("support.ticket_submitted", (payload) => {
                emittedEvents.push({ event: "support.ticket_submitted", payload });
            });

            const ticketId = "tick_test_123";
            const ticket: SupportTicket = {
                id: ticketId,
                tenantId: "tenant-paris-01",
                source: "tenant_submission",
                description: "Problème d impression de ticket sur la station Bar",
                status: "new",
                createdAt: Date.now(),
                createdBy: "user_manager_01",
                escalated: false,
            };

            await Nexus.adapter.set("mcc/supportTickets/" + ticketId, ticket);
            NexusEventBus.emitDurable("support.ticket_submitted", { v: 1, ticketId, tenantId: "tenant-paris-01", description: "Problème d impression de ticket sur la station Bar", submittedBy: "user_manager_01" });

            const stored = await Nexus.adapter.get<SupportTicket>("mcc/supportTickets/" + ticketId);
            expect(stored).toBeDefined();
            expect(stored?.tenantId).toBe("tenant-paris-01");
            expect(stored?.status).toBe("new");
            expect(emittedEvents.length).toBe(1);
            expect((emittedEvents[0].payload as { ticketId: string }).ticketId).toBe(ticketId);
        });
    });

    describe("2. Isolation Multi-Tenant des Tickets", () => {
        it("ne doit jamais mélanger les tickets entre deux tenants distincts", async () => {
            const ticketA: SupportTicket = {
                id: "tick_A",
                tenantId: "tenant-A",
                source: "tenant_submission",
                description: "Panne KDS en cuisine A",
                status: "new",
                createdAt: Date.now(),
                createdBy: "user_A",
                escalated: false,
            };
            const ticketB: SupportTicket = {
                id: "tick_B",
                tenantId: "tenant-B",
                source: "tenant_submission",
                description: "Erreur clôture Z sur caisse B",
                status: "new",
                createdAt: Date.now(),
                createdBy: "user_B",
                escalated: false,
            };

            await Nexus.adapter.set("mcc/supportTickets/tick_A", ticketA);
            await Nexus.adapter.set("mcc/supportTickets/tick_B", ticketB);

            const allTickets = await Nexus.adapter.query<SupportTicket>("mcc/supportTickets", {
                where: [{ field: "tenantId", operator: "==", value: "tenant-A" }]
            });

            expect(allTickets.every(t => t.tenantId === "tenant-A")).toBe(true);
        });
    });
});
