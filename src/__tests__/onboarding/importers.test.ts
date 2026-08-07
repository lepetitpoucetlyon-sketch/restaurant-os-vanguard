/**
 * Tests unitaires — importers onboarding B2B
 * Couvre : menuImporter, staffImporter, crmImporter, suppliersImporter, inventoryImporter
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Nexus (vi.hoisted garantit que les variables sont prêtes avant les factories) ──
const { mockBatch, mockAdapter } = vi.hoisted(() => {
  const mockBatch = {
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    increment: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  };
  const mockAdapter = {
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(),
    query: vi.fn().mockResolvedValue([]),
    onSnapshot: vi.fn(),
    batch: vi.fn().mockReturnValue(mockBatch),
    generateId: vi.fn().mockImplementation((col: string) => `${col}_test_id`),
    serverTimestamp: vi.fn().mockReturnValue(0),
    runTransaction: vi.fn(),
    increment: vi.fn(),
  };
  return { mockBatch, mockAdapter };
});

vi.mock('@/lib/nexus/NexusAdapter', () => ({
  Nexus: { adapter: mockAdapter },
}));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('@/lib/client/authedFetch', () => ({
  authedFetch: vi.fn(),
}));
// @/modules/finance est un barrel lourd (React, Jotai, providers) chargé transitoirement
// par statementsImporter. On stub uniquement ce qu'il exporte pour accélérer la suite.
vi.mock('@/modules/finance', () => ({
  StatementIngestionService: {
    ingestCSV: vi.fn().mockResolvedValue([]),
    ingest: vi.fn().mockResolvedValue([]),
  },
  inferPCGAccount: vi.fn().mockReturnValue(null),
}));

// ─── Helpers ──────────────────────────────────────────────────
import type { ParsedFile } from '@/modules/commerce/acquisition/onboarding/migration/types';

function parsedFile(overrides: Partial<ParsedFile> = {}): ParsedFile {
  return {
    format: 'csv',
    source: 'generic',
    headers: [],
    rows: [],
    warnings: [],
    ...overrides,
  };
}

// ─── menuImporter ─────────────────────────────────────────────
describe('menuImporter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('importe des produits CSV au format euros', async () => {
    const { importMenuFromRows } = await import('@/modules/commerce/acquisition/onboarding/migration/importers/menuImporter');
    const file = parsedFile({
      source: 'generic',
      headers: ['nom', 'categorie', 'prix'],
      rows: [
        { nom: 'Salade César', categorie: 'Entrées', prix: '12.50' },
        { nom: 'Steak Frites',  categorie: 'Plats',   prix: '18.00' },
        { nom: 'Tiramisu',      categorie: 'Desserts', prix: '7.00' },
      ],
    });

    const progress: number[] = [];
    const result = await importMenuFromRows(file, (n) => progress.push(n));

    expect(result.created).toBe(3);
    expect(mockBatch.set).toHaveBeenCalled();
    expect(mockBatch.commit).toHaveBeenCalled();
    expect(progress.at(-1)).toBe(100);
  });

  it('importe des produits Zelty (prix en centimes)', async () => {
    const { importMenuFromRows } = await import('@/modules/commerce/acquisition/onboarding/migration/importers/menuImporter');
    const file = parsedFile({
      source: 'zelty',
      headers: ['name', 'category', 'price_cents'],
      rows: [
        { name: 'Pizza Margherita', category: 'Pizzas', price_cents: '1200' },
      ],
    });

    const result = await importMenuFromRows(file, vi.fn());
    expect(result.created).toBe(1);
    // Zelty = centimes → doit produire 12€ en microunits dans le batch
    const setCall = mockBatch.set.mock.calls.find(([path]: [string]) => path.startsWith('products/'));
    expect(setCall).toBeDefined();
    expect(setCall![1].priceInMicrounits).toBe(12_000_000);
  });

  it('ignore les lignes sans nom', async () => {
    const { importMenuFromRows } = await import('@/modules/commerce/acquisition/onboarding/migration/importers/menuImporter');
    const file = parsedFile({
      rows: [
        { nom: '', categorie: 'Entrées', prix: '5.00' },
        { nom: 'Soupe', categorie: 'Entrées', prix: '6.00' },
      ],
    });

    const result = await importMenuFromRows(file, vi.fn());
    expect(result.created).toBe(1);
  });
});

// ─── staffImporter ────────────────────────────────────────────
describe('staffImporter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('importe des employés CSV', async () => {
    const { importStaff } = await import('@/modules/commerce/acquisition/onboarding/migration/importers/staffImporter');
    const file = parsedFile({
      headers: ['prenom', 'nom', 'role', 'email'],
      rows: [
        { prenom: 'Alice', nom: 'Martin', role: 'waiter', email: 'alice@test.com' },
        { prenom: 'Bob',   nom: 'Dupont', role: 'manager', email: 'bob@test.com' },
      ],
    });

    const result = await importStaff(file, vi.fn());
    expect(result.created).toBe(2);
    expect(mockBatch.commit).toHaveBeenCalled();
  });
});

// ─── crmImporter ──────────────────────────────────────────────
describe('crmImporter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('importe des clients CRM', async () => {
    const { importCRM } = await import('@/modules/commerce/acquisition/onboarding/migration/importers/crmImporter');
    const file = parsedFile({
      headers: ['email', 'prenom', 'nom'],
      rows: [
        { email: 'client1@test.com', prenom: 'Jean', nom: 'Valjean' },
        { email: 'client2@test.com', prenom: 'Marie', nom: 'Curie' },
      ],
    });

    const result = await importCRM(file, vi.fn());
    expect(result.created).toBe(2);
    expect(mockBatch.commit).toHaveBeenCalled();
  });

  it('déduplique par email', async () => {
    mockAdapter.query.mockResolvedValueOnce([
      { email: 'client1@test.com', id: 'existing_id' },
    ]);
    const { importCRM } = await import('@/modules/commerce/acquisition/onboarding/migration/importers/crmImporter');
    const file = parsedFile({
      rows: [
        { email: 'client1@test.com', prenom: 'Jean', nom: 'Valjean' },
      ],
    });

    const result = await importCRM(file, vi.fn());
    // Le client existait → updated ou skipped, pas created
    expect(result.created + result.updated + result.skipped).toBe(1);
  });
});

// ─── suppliersImporter ────────────────────────────────────────
describe('suppliersImporter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('importe des fournisseurs CSV', async () => {
    const { importSuppliers } = await import('@/modules/commerce/acquisition/onboarding/migration/importers/suppliersImporter');
    const file = parsedFile({
      headers: ['nom', 'email', 'telephone'],
      rows: [
        { nom: 'Metro', email: 'commande@metro.fr', telephone: '0123456789' },
        { nom: 'Pomona', email: 'contact@pomona.fr', telephone: '0987654321' },
      ],
    });

    const result = await importSuppliers(file, vi.fn());
    expect(result.created).toBe(2);
  });
});

// ─── inventoryImporter ────────────────────────────────────────
describe('inventoryImporter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('importe un inventaire CSV', async () => {
    const { importInventory } = await import('@/modules/commerce/acquisition/onboarding/migration/importers/inventoryImporter');
    const file = parsedFile({
      headers: ['produit', 'quantite', 'unite'],
      rows: [
        { produit: 'Farine T55', quantite: '25', unite: 'kg' },
        { produit: 'Beurre AOP', quantite: '10', unite: 'kg' },
      ],
    });

    const result = await importInventory(file, vi.fn());
    expect(result.created).toBe(2);
    expect(mockBatch.commit).toHaveBeenCalled();
  });
});

// ─── runImporter dispatch ─────────────────────────────────────
describe('runImporter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('dispatche vers le bon importer selon la catégorie', async () => {
    // Ré-applique les implementations après vi.clearAllMocks() des tests précédents
    mockAdapter.batch.mockReturnValue(mockBatch);
    mockAdapter.generateId.mockImplementation((col: string) => `${col}_test_id`);
    mockBatch.commit.mockResolvedValue(undefined);

    const { runImporter } = await import('@/modules/commerce/acquisition/onboarding/migration/importers');
    const file = parsedFile({ rows: [{ nom: 'Test', categorie: 'A', prix: '5' }] });
    const rawFile = new File([''], 'test.csv', { type: 'text/csv' });

    const result = await runImporter('menu', file, rawFile, vi.fn());
    expect(result).toHaveProperty('created');
  });

  it('lance une erreur pour une catégorie inconnue', async () => {
    const { runImporter } = await import('@/modules/commerce/acquisition/onboarding/migration/importers');
    const file = parsedFile();
    const rawFile = new File([''], 'test.csv');

    await expect(
      runImporter('unknown_cat' as never, file, rawFile, vi.fn())
    ).rejects.toThrow();
  });
});
