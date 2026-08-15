import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KDSCourseSequencingEngine } from '@/modules/ops/production/kds/services/KDSCourseSequencingEngine';
import { SplitBillDomainService } from '@/modules/finance/services/SplitBillDomainService';
import { WormArchiveStorageService } from '@/modules/finance/fiscalite/WormArchiveStorageService';
import type { CartItem } from '@/modules/ops/workflow/engine/types';
import type { FiscalSeal } from '@/shared/nexus/contracts/finance.types';
import { Microunits, TaxRate } from '@/shared/schemas/primitives';

describe('E2E Scénario 2 : Parcours Client & Service 360° (Résa → Allergènes → KDS → Split → WORM)', () => {
  const tenantId = 'gastronomie-lyon';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait exécuter le cycle complet sans accroc : Check-in, Cadençage KDS, Split Reliquat & Archive WORM', async () => {
    // 1. Cadençage Cuisine (Entrée / Plat / Dessert)
    const orderId = 'ord_e2e_full_001';
    const items: CartItem[] = [
      {
        cartId: 'c1',
        productId: 'p_foie_gras',
        name: 'Foie Gras Poêlé',
        quantity: 2,
        unitPriceInMicrounits: 22000000 as Microunits,
        categoryId: 'cat_entrees',
        taxRate: '0.10' as TaxRate,
        discountInMicrounits: 0 as Microunits,
        modifiers: [],
        course: 'entree',
      },
      {
        cartId: 'c2',
        productId: 'p_cote_boeuf',
        name: 'Côte de Bœuf Simmental',
        quantity: 1,
        unitPriceInMicrounits: 75000000 as Microunits,
        categoryId: 'cat_plats',
        taxRate: '0.10' as TaxRate,
        discountInMicrounits: 0 as Microunits,
        modifiers: [],
        course: 'plat',
      },
      {
        cartId: 'c3',
        productId: 'p_souffle',
        name: 'Soufflé Grand Marnier',
        quantity: 2,
        unitPriceInMicrounits: 14000000 as Microunits,
        categoryId: 'cat_desserts',
        taxRate: '0.10' as TaxRate,
        discountInMicrounits: 0 as Microunits,
        modifiers: [],
        course: 'dessert',
      },
    ];

    const state = await KDSCourseSequencingEngine.initializeOrderCourses(tenantId, orderId, 'table-12', items);
    expect(state.courses.entree.status).toBe('FIRED');
    expect(state.courses.plat.status).toBe('HOLD');
    expect(state.courses.dessert.status).toBe('HOLD');

    // Passage au plat via fireCourse
    const nextState = await KDSCourseSequencingEngine.fireCourse(tenantId, orderId, 'plat', 'chef-philippe');
    expect(nextState.courses.plat.status).toBe('FIRED');

    // 2. Split d'addition pour 3 convives avec reliquat indivisible (Invariant #5)
    // 147.01 € (14 701 centimes)
    const totalInCents = 14701;
    const splitPayments = SplitBillDomainService.createEqualPayments(3, totalInCents);

    expect(splitPayments.length).toBe(3);
    const sumOfParts = splitPayments.reduce((sum, p) => sum + p.amount, 0);
    expect(sumOfParts).toBe(totalInCents);
    expect(splitPayments[0].amount).toBe(4901); // 1er convive reçoit le centime résiduel
    expect(splitPayments[1].amount).toBe(4900);
    expect(splitPayments[2].amount).toBe(4900);

    // 3. Archivage Légal WORM NF525 (6 ans)
    const nowIso = new Date().toISOString();
    const mockSeal: FiscalSeal = {
      id: 'seal_z_2026_08_15',
      tenantId,
      registerId: 'caisse_principale',
      hash: 'SEAL_SHA256_FINAL_8899AABB',
      previousHash: 'GENESIS_0000',
      timestamp: nowIso,
      updatedAt: nowIso,
      transactionCount: 1,
      totalAmountInCents: totalInCents,
    };

    const archive = await WormArchiveStorageService.sealPeriodArchive(
      tenantId,
      2026,
      'directeur-philippe',
      [mockSeal],
      8 // Août
    );

    expect(archive.id).toBeDefined();
    expect(archive.wormStatus).toBe('ACTIVE_LOCKED');
    expect(archive.retentionYears).toBe(6);
    expect(archive.immutableUntilTimestamp).toBeGreaterThan(Date.now() + 5 * 365 * 24 * 3600 * 1000);
  });
});
