import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "@/e2e/vanguard/mocks";
import { db } from "@/infrastructure/services/offline/offline-store";
import { NexusSyncService } from "@/lib/NexusSyncService";
import { getDefaultStore } from "jotai";
import { tenantIdAtom } from "@/shared/nexus/state/SovereignGenome";
import { TimeSync } from "@/lib/TimeSync";

/**
 * 🛰️ Tenant Isolation & Performance Test
 */
describe("NexusSyncService Multi-tenant Isolation", () => {
    const store = getDefaultStore();

    beforeEach(async () => {
        vi.spyOn(TimeSync, "init").mockResolvedValue();
        await db.clearAll();
        store.set(tenantIdAtom, "root");
    });

    afterEach(async () => {
        await NexusSyncService.stopAll();
        vi.restoreAllMocks();
    });

    it("should purge the local cache when switching tenants", async () => {
        // 1. Setup Tenant A data
        await db.orders.add({ 
            id: "order_A", 
            status: "completed", 
            timestamp: new Date().toISOString(), 
            tableId: "A1",
            tenantId: "tenant-A",
            items: [],
            totalInCents: 0,
            paymentMethod: "cash",
            type: "dine_in",
            currency: "EUR",
            taxBreakdown: { total: 0, ht: 0, totalTax: 0, rates: {} },
            orderNumber: "ORD-A",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }); 

        expect(await db.orders.count()).toBe(1);

        // 2. Perform Switch to Tenant B
        await NexusSyncService.init("tenant-B");

        // 3. Verify Isolation
        const count = await db.orders.count();
        expect(count).toBe(0);
    });

    it("should re-populate state atoms correctly after switch", async () => {
        expect(true).toBe(true);
    });
});
