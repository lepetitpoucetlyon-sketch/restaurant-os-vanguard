import { describe, it, expect, vi, beforeEach } from 'vitest';

const store = new Map<string, unknown>();
const collections = new Map<string, unknown[]>();

vi.mock('@/lib/nexus/NexusAdapter', () => ({
  Nexus: {
    adapter: {
      get: vi.fn(async (path: string) => store.get(path) ?? null),
      query: vi.fn(async (path: string) => collections.get(path) ?? []),
      set: vi.fn(async (path: string, value: unknown) => {
        store.set(path, value);
      }),
    },
  },
}));

const emitted: Array<{ event: string; payload: Record<string, unknown> }> = [];
vi.mock('@/shared/eventBus/NexusEventBus', () => ({
  NexusEventBus: {
    emit: vi.fn((event: string, payload: Record<string, unknown>) => {
      emitted.push({ event, payload });
    }),
    emitDurable: vi.fn(),
  },
}));

vi.mock('@/lib/audit', () => ({ AuditLogger: { logAction: vi.fn(async () => undefined) } }));

const { SaaSBillingJob } = await import('@/lib/cron/SaaSBillingJob');

const TENANT = 'tenant-billing-test';
/** Le job facture le mois ÉCOULÉ : on ancre les données sur le mois précédent. */
const now = new Date();
const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 15));
const inPeriod = prev.getTime();
const label = `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, '0')}`;
const outOfPeriod = Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() - 2, 10);

function seed(overrides: { devices?: unknown[]; entries?: unknown[]; plan?: string; status?: string } = {}) {
  store.clear();
  collections.clear();
  emitted.length = 0;
  store.set(`tenants/${TENANT}`, {
    billing: { plan: overrides.plan ?? 'PREMIUM', status: overrides.status ?? 'active' },
  });
  collections.set(`tenants/${TENANT}/devices`, overrides.devices ?? []);
  collections.set(`tenants/${TENANT}/journalEntries`, overrides.entries ?? []);
}

describe('SaaSBillingJob — le déclencheur manquant de la facturation SaaS', () => {
  beforeEach(() => seed());

  it("agrège le volume depuis les seules écritures de recette de la période", async () => {
    seed({
      entries: [
        { type: 'revenue', amountInMicrounits: 100_000_000, serverTimestamp: inPeriod },
        { type: 'revenue', amountInMicrounits: 50_000_000, serverTimestamp: inPeriod },
        // exclus : mauvais type, hors période, annulée
        { type: 'expense', amountInMicrounits: 999_000_000, serverTimestamp: inPeriod },
        { type: 'revenue', amountInMicrounits: 999_000_000, serverTimestamp: outOfPeriod },
        { type: 'revenue', amountInMicrounits: 999_000_000, serverTimestamp: inPeriod, status: 'cancelled' },
      ],
    });

    await SaaSBillingJob.runForTenant(TENANT);

    // La persistance est le travail de SaaSInvoicePersistHandler (le bus est mocké
    // ici) : ce test porte sur ce que le job CALCULE et émet.
    // Premium 149 € + 0 terminal facturé + 0,50 % de 150 € = 149,75 € HT → 179,70 € TTC
    const expectedHt = 149_000_000 + 0 + Math.round((150_000_000 * 50) / 10_000);
    const expectedTtc = expectedHt + Math.round(expectedHt * 0.2);
    expect(emitted[0].event).toBe('fleet.saas_billing_invoiced');
    expect(emitted[0].payload.totalAmountInMicrounits).toBe(expectedTtc);
  });

  it('ne facture que les terminaux actifs au-delà du premier', async () => {
    seed({
      devices: [
        { deviceId: 'a', deviceType: 'pos_fixed', status: 'active', lastActiveAt: inPeriod },
        { deviceId: 'b', deviceType: 'pos_mobile', status: 'active', lastActiveAt: inPeriod },
        { deviceId: 'c', deviceType: 'pos_fixed', status: 'active', lastActiveAt: inPeriod },
        // exclus : révoqué, non-POS, inactif depuis trop longtemps
        { deviceId: 'd', deviceType: 'pos_fixed', status: 'revoked', lastActiveAt: inPeriod },
        { deviceId: 'e', deviceType: 'printer', status: 'active', lastActiveAt: inPeriod },
        { deviceId: 'f', deviceType: 'pos_fixed', status: 'active', lastActiveAt: outOfPeriod },
      ],
    });

    await SaaSBillingJob.runForTenant(TENANT);

    // 3 actifs → 2 facturés (le premier est dans le forfait) → 58 €
    const expectedHt = 149_000_000 + 2 * 29_000_000;
    const expectedTtc = expectedHt + Math.round(expectedHt * 0.2);
    expect(emitted[0].payload.totalAmountInMicrounits).toBe(expectedTtc);
  });

  it('est idempotent : une facture déjà émise court-circuite le calcul', async () => {
    await SaaSBillingJob.runForTenant(TENANT);
    expect(emitted).toHaveLength(1);

    // Simule ce que SaaSInvoicePersistHandler aurait écrit sur le premier passage.
    store.set(`tenants/${TENANT}/saasInvoices/INV-SAAS-${TENANT}-${label}`, { invoiceId: 'x' });

    await SaaSBillingJob.runForTenant(TENANT);
    expect(emitted, 'la facture existante doit court-circuiter le calcul').toHaveLength(1);
  });

  it('ne facture pas un tenant résilié ou suspendu', async () => {
    seed({ status: 'cancelled' });
    await SaaSBillingJob.runForTenant(TENANT);
    expect(emitted).toHaveLength(0);

    seed({ status: 'suspended' });
    await SaaSBillingJob.runForTenant(TENANT);
    expect(emitted).toHaveLength(0);
  });

  it('retombe sur le palier STANDARD si le plan du tenant est inconnu', async () => {
    seed({ plan: 'plan-qui-nexiste-pas' });
    await SaaSBillingJob.runForTenant(TENANT);

    const expectedTtc = 79_000_000 + Math.round(79_000_000 * 0.2);
    expect(emitted[0].payload.totalAmountInMicrounits).toBe(expectedTtc);
  });

  it('est enregistré dans le CronScheduler — sinon il ne tourne jamais', async () => {
    const { CronScheduler } = await import('@/lib/cron/CronScheduler');
    expect(CronScheduler.jobs.map(j => j.name)).toContain('SaaSBillingJob');
  });
});
