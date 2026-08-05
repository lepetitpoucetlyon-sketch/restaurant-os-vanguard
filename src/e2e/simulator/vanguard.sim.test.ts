import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
// Firebase, logger, jotai, dexie offline-store mocks
import '../vanguard/mocks';

// ── SimulatorDB (Dexie → in-memory Map) ────────────────────────────────────
// SimulacraAdapter uses Dexie IndexedDB which doesn't exist in Node/jsdom.
// We replace it with a synchronous in-memory Map exposing the same API.
const { virtualMap } = vi.hoisted(() => ({
  virtualMap: new Map<string, { path: string; data: unknown; isDeleted: boolean; forkId: string; updatedAt: string }>(),
}));

vi.mock('@/modules/intelligence/ia/simulator/SimulatorDB', () => {
  const makeTable = () => ({
    get: async (path: string) => virtualMap.get(path) ?? undefined,
    put: async (doc: { path: string; data: unknown; isDeleted: boolean; forkId: string; updatedAt: string }) => {
      virtualMap.set(doc.path, doc);
    },
    where: (_field: string) => ({
      equals: (forkId: string) => ({
        filter: (fn: (d: { path: string; forkId: string }) => boolean) => ({
          toArray: async () =>
            Array.from(virtualMap.values())
              .filter(d => d.forkId === forkId)
              .filter(fn),
        }),
        delete: async () => {
          for (const [k, v] of virtualMap.entries()) {
            if (v.forkId === forkId) virtualMap.delete(k);
          }
        },
      }),
    }),
  });

  return {
    simulatorDb: {
      virtualStore: makeTable(),
      clearFork: async () => virtualMap.clear(),
    },
    SimulatorDB: class {},
  };
});

// Removed vi.mock for NexusEventBus and empireAudit in favor of spyOn

import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/infrastructure/adapters/MockAdapter';
import { FiscalKeyService } from '@/modules/finance';
import { NexusTelemetryService } from '@/shared/nexus/telemetry/NexusTelemetryService';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { simulatorDb } from '@/modules/intelligence/ia/simulator/SimulatorDB';

import { alicePersona } from './personas/alice';
import { bobPersona, BOB_CART_TOTAL_MICROUNITS, BOB_CART_TOTAL_CENTS } from './personas/bob';
import { carlPersona } from './personas/carl';
import { davePersona } from './personas/dave';
import { SimulatorRunner } from './engine/SimulatorRunner';
import { AssertionLayer } from './engine/AssertionLayer';

const TENANT_ID = 'chez-alice';

describe('🎭 Vanguard Simulator — 4 personas · Simulacra engine', () => {
  let currentForkId = 'simulator';

  beforeEach(async () => {
    currentForkId = `simulator-${Date.now()}-${Math.random()}`;
    process.env.STRICT_ISOLATION_TEST = 'true';
    virtualMap.clear();
    await simulatorDb.clearFork?.('simulator');
    vi.clearAllMocks();
    vi.spyOn(NexusTelemetryService, 'emit').mockResolvedValue(undefined);
    vi.spyOn(NexusEventBus, 'emit').mockResolvedValue(undefined);
    vi.spyOn(NexusEventBus, 'emitDurable').mockResolvedValue(undefined);
    vi.spyOn(empireAudit, 'log').mockImplementation(() => {});

    Nexus.deactivateSimulacraMode();
    Nexus.tenantOverride = null;
    Nexus.adapter = new MockAdapter();
    Nexus.tenantOverride = TENANT_ID;
    await Nexus.activateSimulacraMode(currentForkId);

    // Provision fiscal HMAC key — required by FiscalSealer.sealData()
    FiscalKeyService.provision(TENANT_ID, FiscalKeyService.generateKey());
  });

  afterEach(() => {
    delete process.env.STRICT_ISOLATION_TEST;
    FiscalKeyService.reset();
    Nexus.deactivateSimulacraMode();
    Nexus.tenantOverride = null;
  });

  // ─── Alice ─────────────────────────────────────────────────────────────────

  describe('Alice — restauratrice', () => {
    it('provisionne le tenant et active le billing', async () => {
      const result = await alicePersona({ tenantId: TENANT_ID, operatorId: 'alice-admin' });

      expect(result.success).toBe(true);
      expect(result.acts).toHaveLength(3);
      expect(result.acts.every(a => a.success)).toBe(true);

      const config = await Nexus.adapter.get(`tenants/${TENANT_ID}/tenantConfig`) as Record<string, unknown>;
      expect(config).toMatchObject({ id: TENANT_ID, billingStatus: 'ACTIVE' });
    });

    it('le heartbeat MCC est écrit', async () => {
      await alicePersona({ tenantId: TENANT_ID, operatorId: 'alice-admin' });
      const hb = await Nexus.adapter.get(`tenants/${TENANT_ID}/telemetry/heartbeat`) as Record<string, unknown>;
      expect(hb?.health).toBe(100);
      expect(hb?.billingStatus).toBe('ACTIVE');
    });
  });

  // ─── Bob ───────────────────────────────────────────────────────────────────

  describe('Bob — serveur POS', () => {
    it('checkout → JournalEntry + FiscalSeal chaîné depuis genesis', async () => {
      const result = await bobPersona({ tenantId: TENANT_ID, operatorId: 'bob-waiter' });

      expect(result.success).toBe(true);
      expect(result.acts.every(a => a.success)).toBe(true);

      const { seal, journalEntry } = result.payload as {
        seal: { hash: string; previousHash: string; id: string };
        journalEntry: { amountInCents: number; isSystemGenerated: boolean; isValidated: boolean };
      };

      // Chaîne NF525
      expect(seal.previousHash).toMatch(/^GENESIS_ROOT/);
      expect(seal.hash).toBeTruthy();
      expect(seal.hash.length).toBeGreaterThan(16);

      // JournalEntry NF525
      expect(journalEntry.isSystemGenerated).toBe(true);
      expect(journalEntry.isValidated).toBe(true);
      expect(journalEntry.amountInCents).toBe(BOB_CART_TOTAL_CENTS);
    });

    it('amountInCents cohérent avec les microunits du panier', async () => {
      const result = await bobPersona({ tenantId: TENANT_ID, operatorId: 'bob-waiter' });
      const { journalEntry } = result.payload as { journalEntry: { amountInCents: number } };

      AssertionLayer.assertMicrounitsConsistency(BOB_CART_TOTAL_MICROUNITS, journalEntry.amountInCents);
    });

    it('JournalEntry et FiscalSeal sont écrits dans Nexus (virtual store)', async () => {
      await bobPersona({ tenantId: TENANT_ID, operatorId: 'bob-waiter' });

      const seals = await Nexus.adapter.query(`tenants/${TENANT_ID}/fiscalSeals`);
      const entries = await Nexus.adapter.query(`tenants/${TENANT_ID}/journalEntries`);

      expect(seals).toHaveLength(1);
      expect(entries).toHaveLength(1);
    });

    it('deux checkouts → chaîne de 2 sceaux correctement liée', async () => {
      await bobPersona({ tenantId: TENANT_ID, operatorId: 'bob-waiter' });
      // Small delay so timestamps differ (chain sort is by timestamp)
      await new Promise(r => setTimeout(r, 10));
      await bobPersona({ tenantId: TENANT_ID, operatorId: 'bob-waiter' });

      const seals = await Nexus.adapter.query<{
        id: string; hash: string; previousHash: string; transactionId: string; timestamp: string;
      }>(`tenants/${TENANT_ID}/fiscalSeals`);

      expect(seals).toHaveLength(2);
      AssertionLayer.assertNF525Chain(seals);
    });
  });

  // ─── Carl ──────────────────────────────────────────────────────────────────

  describe('Carl — chef KDS', () => {
    it('reçoit le ticket de Bob, marque served', async () => {
      await bobPersona({ tenantId: TENANT_ID, operatorId: 'bob-waiter' });
      const result = await carlPersona({ tenantId: TENANT_ID, operatorId: 'carl-chef' });

      expect(result.success).toBe(true);

      const { finalOrder } = result.payload as { finalOrder: { status: string } };
      expect(finalOrder.status).toBe('served');
    });

    it('échoue proprement si aucune commande en attente', async () => {
      const result = await carlPersona({ tenantId: TENANT_ID, operatorId: 'carl-chef' });
      expect(result.success).toBe(false);
      expect(result.acts.some(a => !a.success)).toBe(true);
    });
  });

  // ─── Dave ──────────────────────────────────────────────────────────────────

  describe('Dave — MCC fleet admin', () => {
    it('vérifie la chaîne fiscale intègre et le billing ACTIVE', async () => {
      await alicePersona({ tenantId: TENANT_ID, operatorId: 'alice-admin' });
      await bobPersona({ tenantId: TENANT_ID, operatorId: 'bob-waiter' });

      const result = await davePersona({ tenantId: TENANT_ID, operatorId: 'dave-mcc' });
      expect(result.success).toBe(true);

      const { seals, violations } = result.payload as { seals: unknown[]; violations: string[] };
      expect(seals.length).toBeGreaterThan(0);
      expect(violations).toHaveLength(0);
    });

    it('détecte un tenant sans billing ACTIVE', async () => {
      // No Alice → no tenantConfig → billing=UNKNOWN
      await bobPersona({ tenantId: TENANT_ID, operatorId: 'bob-waiter' });
      const result = await davePersona({ tenantId: TENANT_ID, operatorId: 'dave-mcc' });

      const { violations } = result.payload as { violations: string[] };
      expect(violations.some(v => v.includes('BILLING'))).toBe(true);
    });
  });

  // ─── SovereignGuard ────────────────────────────────────────────────────────

  describe('SovereignGuard — isolation cross-tenant', () => {
    it("bloque l'accès aux données d'un autre tenant", async () => {
      await expect(
        Nexus.adapter.get('tenants/tenant-PIRATE/orders/123')
      ).rejects.toThrow(/ACCESS_DENIED/);
    });

    it('bloque le DELETE sur un FiscalSeal (NF525_VIOLATION)', async () => {
      await bobPersona({ tenantId: TENANT_ID, operatorId: 'bob-waiter' });
      const seals = await Nexus.adapter.query<{ id: string }>(`tenants/${TENANT_ID}/fiscalSeals`);
      expect(seals.length).toBeGreaterThan(0);

      await expect(
        Nexus.adapter.delete(`tenants/${TENANT_ID}/fiscalSeals/${seals[0].id}`)
      ).rejects.toThrow(/NF525_VIOLATION/);
    });
  });

  // ─── FULL RUN ──────────────────────────────────────────────────────────────

  describe('FULL RUN — 4 personas bout en bout', () => {
    it('0 violations, tous les invariants respectés', async () => {
      const runner = new SimulatorRunner();
      const report = await runner.runAll(TENANT_ID);

      AssertionLayer.assertNoViolations(report.violations);
      expect(report.alice.success).toBe(true);
      expect(report.bob.success).toBe(true);
      expect(report.carl.success).toBe(true);
      expect(report.dave.success).toBe(true);

      const { seals } = report.dave.payload as { seals: { id: string; hash: string; previousHash: string; transactionId: string; timestamp: string }[] };
      AssertionLayer.assertNF525Chain(seals);
    });

    it('durée totale < 5000ms (Simulacra pur — pas de réseau)', async () => {
      const runner = new SimulatorRunner();
      const report = await runner.runAll(TENANT_ID);
      expect(report.totalDurationMs).toBeLessThan(5000);
    });
  });
});
