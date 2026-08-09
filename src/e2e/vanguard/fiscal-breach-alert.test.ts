/**
 * 🚨 NF525 — Alerte de rupture de chaîne (Grade X)
 *
 * `CryptoIntegrityHandler` écoute `crypto.integrity_failed` pour persister la
 * preuve légale (fiscalIntegrityBreaches + mccFiscalBreaches). Avant ce lot,
 * AUCUN code n'émettait cet événement : une chaîne rompue était détectée par
 * `runAudit` puis oubliée silencieusement.
 *
 * Ces tests verrouillent le contrat d'émission. S'ils échouent, une altération
 * fiscale redevient invisible pour l'administration.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FiscalEngine, FISCAL_CONSTANTS } from '@/modules/finance/fiscalite/FiscalAdapter';
import { FiscalKeyService } from '@/modules/finance/services/FiscalKeyService';
import { CryptoService } from '@/lib/CryptoService';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import type { FiscalSeal } from '@nexus/contracts';

vi.mock('@/lib/audit', () => ({ empireAudit: { log: vi.fn() } }));

const emitDurable = vi.fn().mockResolvedValue(undefined);
vi.mock('@/shared/eventBus/NexusEventBus', () => ({
  NexusEventBus: {
    emitDurable: (...args: unknown[]) => emitDurable(...args),
    emit: vi.fn(),
    on: vi.fn(() => () => {}),
  },
}));

const TENANT = 'tenant-breach-test';
const TEST_KEY = 'test-fiscal-signing-key-must-be-32chars!!';

/** Construit une chaîne valide de `count` sceaux réellement hashés en SHA-256. */
async function buildValidChain(count: number): Promise<FiscalSeal[]> {
  const seals: FiscalSeal[] = [];
  let previousHash: string = FISCAL_CONSTANTS.GENESIS_ROOT;

  for (let i = 0; i < count; i++) {
    const dataSnapshot = JSON.stringify({ ticket: i, amountInMicrounits: 1_000_000 * (i + 1) });
    const hash = await CryptoService.generateHash(dataSnapshot, previousHash);
    seals.push({
      id: `seal-${i}`,
      transactionId: `txn-${i}`,
      previousHash,
      hash,
      dataSnapshot,
      timestamp: new Date(2026, 0, i + 1).toISOString(),
      signature: `sig-${i}`,
      updatedAt: new Date(2026, 0, i + 1).toISOString(),
    } as FiscalSeal);
    previousHash = hash;
  }
  return seals;
}

describe('🚨 NF525 — Alerte de rupture de chaîne', () => {
  beforeEach(() => {
    Nexus.adapter = new MockAdapter();
    FiscalKeyService.provision(TENANT, TEST_KEY);
    emitDurable.mockClear();
  });

  afterEach(() => {
    FiscalKeyService.reset();
  });

  // ── Chaîne saine : aucun bruit ─────────────────────────────────────────────

  it("n'émet AUCUNE alerte quand la chaîne est intègre", async () => {
    const seals = await buildValidChain(4);

    const result = await FiscalEngine.runAudit(seals, TENANT);

    expect(result.integrity).toBe(true);
    expect(result.sealedCount).toBe(4);
    expect(emitDurable).not.toHaveBeenCalled();
  });

  it('inspectChain retourne null sur une chaîne intègre', async () => {
    const seals = await buildValidChain(3);
    await expect(FiscalEngine.inspectChain(seals)).resolves.toBeNull();
  });

  // ── Altération de contenu ──────────────────────────────────────────────────

  it('émet crypto.integrity_failed quand un dataSnapshot est altéré', async () => {
    const seals = await buildValidChain(3);
    // Falsification du montant sur le 2ᵉ sceau — le hash scellé ne correspond plus.
    seals[1].dataSnapshot = JSON.stringify({ ticket: 1, amountInMicrounits: 999_999_999 });

    const result = await FiscalEngine.runAudit(seals, TENANT);

    expect(result.integrity).toBe(false);
    expect(emitDurable).toHaveBeenCalledTimes(1);

    const [eventName, payload] = emitDurable.mock.calls[0] as [string, Record<string, unknown>];
    expect(eventName).toBe('crypto.integrity_failed');
    expect(payload.tenantId).toBe(TENANT);
    expect(payload.journalId).toBe('txn-1');
    expect(payload.expectedHash).toBe(seals[1].hash);
    expect(payload.actualHash).not.toBe(seals[1].hash);
    expect(typeof payload.detectedAt).toBe('number');
  });

  // ── Rupture de continuité ──────────────────────────────────────────────────

  it('émet crypto.integrity_failed quand un maillon est détaché', async () => {
    const seals = await buildValidChain(3);
    // Le 3ᵉ sceau ne référence plus le hash de son prédécesseur.
    seals[2].previousHash = 'HASH_ORPHELIN_0000000000000000';

    const result = await FiscalEngine.runAudit(seals, TENANT);

    expect(result.integrity).toBe(false);
    expect(emitDurable).toHaveBeenCalledTimes(1);

    const [, payload] = emitDurable.mock.calls[0] as [string, Record<string, unknown>];
    expect(payload.journalId).toBe('txn-2');
    expect(payload.expectedHash).toBe(seals[1].hash);
    expect(payload.actualHash).toBe('HASH_ORPHELIN_0000000000000000');
  });

  it('inspectChain qualifie le type de rupture', async () => {
    const detached = await buildValidChain(2);
    detached[1].previousHash = 'AUTRE';
    await expect(FiscalEngine.inspectChain(detached)).resolves.toMatchObject({ kind: 'continuity' });

    const tampered = await buildValidChain(2);
    tampered[1].dataSnapshot = 'contenu-falsifié';
    await expect(FiscalEngine.inspectChain(tampered)).resolves.toMatchObject({ kind: 'content' });
  });

  // ── Robustesse ─────────────────────────────────────────────────────────────

  it('signale la PREMIÈRE rupture, une seule alerte par audit', async () => {
    const seals = await buildValidChain(5);
    seals[1].dataSnapshot = 'falsifié-1';
    seals[3].dataSnapshot = 'falsifié-3';

    await FiscalEngine.runAudit(seals, TENANT);

    expect(emitDurable).toHaveBeenCalledTimes(1);
    const [, payload] = emitDurable.mock.calls[0] as [string, Record<string, unknown>];
    expect(payload.journalId).toBe('txn-1');
  });

  it("retourne le verdict d'intégrité même si l'émission de l'alerte échoue", async () => {
    emitDurable.mockRejectedValueOnce(new Error('bus indisponible'));
    const seals = await buildValidChain(2);
    seals[1].dataSnapshot = 'falsifié';

    const result = await FiscalEngine.runAudit(seals, TENANT);

    expect(result.integrity).toBe(false);
    expect(result.success).toBe(false);
  });

  it('une chaîne vide est intègre et silencieuse', async () => {
    const result = await FiscalEngine.runAudit([], TENANT);

    expect(result.integrity).toBe(true);
    expect(result.sealedCount).toBe(0);
    expect(emitDurable).not.toHaveBeenCalled();
  });
});
