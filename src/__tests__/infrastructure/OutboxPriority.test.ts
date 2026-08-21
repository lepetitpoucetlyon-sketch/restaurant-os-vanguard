/**
 * OutboxService — Tests des tiers de priorité étendus (ADR-014 chantier 2).
 *
 * Vérifie que `resolvePriority()` classe correctement les collections en
 * NORMAL (0), FISCAL (1), SANITAIRE (2), LEGAL (3), et que l'ordre de drain
 * est bien décroissant.
 */

import { describe, it, expect } from 'vitest';
import { OutboxPriority, resolvePriority } from '@/lib/offline/OutboxService';

describe('OutboxPriority — resolvePriority()', () => {
    it('LEGAL (3) pour collections DGFiP / URSSAF / RPI', () => {
        expect(resolvePriority('tenants/x/legal/dgfip_archives')).toBe(OutboxPriority.LEGAL);
        expect(resolvePriority('tenants/x/urssaf/dpae')).toBe(OutboxPriority.LEGAL);
        expect(resolvePriority('tenants/x/personnelInstantane')).toBe(OutboxPriority.LEGAL);
        expect(resolvePriority('tenants/x/inspection/audit')).toBe(OutboxPriority.LEGAL);
    });

    it('SANITAIRE (2) pour HACCP / refroidissement / recall / TIAC', () => {
        expect(resolvePriority('tenants/x/haccpLogs')).toBe(OutboxPriority.SANITAIRE);
        expect(resolvePriority('tenants/x/chillingCycles')).toBe(OutboxPriority.SANITAIRE);
        expect(resolvePriority('tenants/x/recall/products')).toBe(OutboxPriority.SANITAIRE);
        expect(resolvePriority('tenants/x/tiacIncidents')).toBe(OutboxPriority.SANITAIRE);
        expect(resolvePriority('tenants/x/refroidissement')).toBe(OutboxPriority.SANITAIRE);
        expect(resolvePriority('tenants/x/rappelconso')).toBe(OutboxPriority.SANITAIRE);
        expect(resolvePriority('tenants/x/biohazard')).toBe(OutboxPriority.SANITAIRE);
    });

    it('FISCAL (1) pour journalEntries / fiscalSeals / ticket Z / FEC', () => {
        expect(resolvePriority('tenants/x/journalEntries')).toBe(OutboxPriority.FISCAL);
        expect(resolvePriority('tenants/x/fiscalSeals')).toBe(OutboxPriority.FISCAL);
        expect(resolvePriority('tenants/x/ticketZ')).toBe(OutboxPriority.FISCAL);
        expect(resolvePriority('tenants/x/grandTotals')).toBe(OutboxPriority.FISCAL);
        expect(resolvePriority('tenants/x/fec/exports')).toBe(OutboxPriority.FISCAL);
    });

    it('NORMAL (0) pour tout le reste', () => {
        expect(resolvePriority('tenants/x/orders')).toBe(OutboxPriority.NORMAL);
        expect(resolvePriority('tenants/x/customers')).toBe(OutboxPriority.NORMAL);
        expect(resolvePriority('tenants/x/stocks')).toBe(OutboxPriority.NORMAL);
        expect(resolvePriority('tenants/x/reservations')).toBe(OutboxPriority.NORMAL);
        expect(resolvePriority('tenants/x/expenseClaims')).toBe(OutboxPriority.NORMAL);
    });

    it("cas ambigus : LEGAL > SANITAIRE > FISCAL > NORMAL (le premier match l'emporte)", () => {
        // LEGAL doit gagner sur les autres (test l'ordre du switch)
        expect(resolvePriority('tenants/x/legal/haccp_registers')).toBe(OutboxPriority.LEGAL);
        // SANITAIRE gagne sur FISCAL
        expect(resolvePriority('tenants/x/haccp/journalCorrelation')).toBe(OutboxPriority.SANITAIRE);
    });

    it('mapping case-insensitive', () => {
        expect(resolvePriority('Tenants/X/HACCPLogs')).toBe(OutboxPriority.SANITAIRE);
        expect(resolvePriority('TENANTS/X/JOURNALENTRIES')).toBe(OutboxPriority.FISCAL);
    });
});

describe('OutboxPriority — constantes', () => {
    it('valeurs ordonnées correctement', () => {
        expect(OutboxPriority.NORMAL).toBe(0);
        expect(OutboxPriority.FISCAL).toBe(1);
        expect(OutboxPriority.SANITAIRE).toBe(2);
        expect(OutboxPriority.LEGAL).toBe(3);
        // Ordre strict croissant
        expect(OutboxPriority.LEGAL).toBeGreaterThan(OutboxPriority.SANITAIRE);
        expect(OutboxPriority.SANITAIRE).toBeGreaterThan(OutboxPriority.FISCAL);
        expect(OutboxPriority.FISCAL).toBeGreaterThan(OutboxPriority.NORMAL);
    });
});
