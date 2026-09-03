import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  RetroactiveActionGuard,
  UnauthorizedRetroactiveActionError,
} from '@/shared/security/RetroactiveActionGuard';

describe('Lot 6 — RBAC & Traçabilité des Actions Rétroactives (M6/M7)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lag <= 2h : autorisé pour tout rôle opérationnel (SERVEUR)', () => {
    const now = new Date();
    const fortyFiveMinutesAgo = new Date(now.getTime() - 45 * 60 * 1000).toISOString();

    const marker = RetroactiveActionGuard.evaluate({
      tenantId: 'bistro-1',
      operatorId: 'op-serveur-1',
      operatorRole: 'SERVEUR',
      occurredAt: fortyFiveMinutesAgo,
      actionType: 'SPLIT_BILL_ADJUSTMENT',
    });

    expect(marker.isRetroactive).toBe(false);
    expect(marker.authorizedBy).toBe('op-serveur-1');
  });

  it('2h < lag <= 48h : refuse sans motif ou avec rôle insuffisant (SERVEUR), accepte MANAGER avec motif', () => {
    const now = new Date();
    const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString();

    // 1. Refusé sans motif
    expect(() =>
      RetroactiveActionGuard.evaluate({
        tenantId: 'bistro-1',
        operatorId: 'op-manager-1',
        operatorRole: 'MANAGER',
        occurredAt: twentyHoursAgo,
        actionType: 'STOCK_ADJUSTMENT',
        reason: '', // Vide !
      })
    ).toThrow(UnauthorizedRetroactiveActionError);

    // 2. Refusé pour un rôle non habilité (SERVEUR)
    expect(() =>
      RetroactiveActionGuard.evaluate({
        tenantId: 'bistro-1',
        operatorId: 'op-serveur-1',
        operatorRole: 'SERVEUR',
        occurredAt: twentyHoursAgo,
        actionType: 'STOCK_ADJUSTMENT',
        reason: 'Rattrapage du shift d hier soir',
      })
    ).toThrow(UnauthorizedRetroactiveActionError);

    // 3. Autorisé pour un MANAGER avec motif valide
    const marker = RetroactiveActionGuard.evaluate({
      tenantId: 'bistro-1',
      operatorId: 'op-manager-1',
      operatorRole: 'MANAGER',
      occurredAt: twentyHoursAgo,
      actionType: 'STOCK_ADJUSTMENT',
      reason: 'Régularisation casse bouteille de vin constatée après clôture',
    });

    expect(marker.isRetroactive).toBe(true);
    expect(marker.authorizedRole).toBe('MANAGER');
  });

  it('lag > 48h : exige impérativement le rôle DIRECTION ou ADMIN', () => {
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Refusé même pour un MANAGER
    expect(() =>
      RetroactiveActionGuard.evaluate({
        tenantId: 'bistro-1',
        operatorId: 'op-manager-1',
        operatorRole: 'MANAGER',
        occurredAt: fiveDaysAgo,
        actionType: 'INVOICE_VARIANCE_OVERRIDE',
        reason: 'Facture poisson reçue avec 5 jours de retard',
      })
    ).toThrow(UnauthorizedRetroactiveActionError);

    // 2. Autorisé pour un ADMIN
    const marker = RetroactiveActionGuard.evaluate({
      tenantId: 'bistro-1',
      operatorId: 'op-admin-1',
      operatorRole: 'ADMIN',
      occurredAt: fiveDaysAgo,
      actionType: 'INVOICE_VARIANCE_OVERRIDE',
      reason: 'Validation de l écart de coût validée en réunion de direction',
    });

    expect(marker.isRetroactive).toBe(true);
    expect(marker.authorizedRole).toBe('ADMIN');
  });
});
