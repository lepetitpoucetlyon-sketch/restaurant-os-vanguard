import { describe, it, expect } from 'vitest';
import { computeTreasury, type TreasuryEntryInput } from './TreasuryCalculator';

// Helper : fabrique une écriture minimale avec ses lignes PCG.
function entry(
    partial: {
        type?: string;
        date?: number | string | Date;
        amountInMicrounits?: number;
        lines?: { accountCode: string; debitInCents?: number; creditInCents?: number }[];
    },
): TreasuryEntryInput {
    return {
        amountInMicrounits: partial.amountInMicrounits ?? 0,
        type: partial.type ?? 'other',
        date: partial.date ?? 0,
        lines: partial.lines ?? [],
    };
}

const NOW = new Date('2026-07-21T12:00:00').getTime();
const DAY = 86_400_000;

describe('computeTreasury (moteur de trésorerie PCG)', () => {
    it('agrège caisse (53x) et banque (512x) comme des actifs à solde débiteur', () => {
        const entries = [
            entry({ lines: [{ accountCode: '531', debitInCents: 10_000 }] }),  // +100 € caisse
            entry({ lines: [{ accountCode: '531', creditInCents: 3_000 }] }),  // −30 € caisse
            entry({ lines: [{ accountCode: '512', debitInCents: 250_000 }] }), // +2500 € banque
        ];
        const t = computeTreasury(entries, NOW);
        // 100 € − 30 € = 70 € = 70 000 000 µ ; centimes→µ = ×10 000
        expect(t.cashOnHandInMicrounits).toBe(70 * 1_000_000);
        expect(t.bankBalanceInMicrounits).toBe(2500 * 1_000_000);
        expect(t.netCashPositionInMicrounits).toBe((70 + 2500) * 1_000_000);
    });

    it('traite 411x comme créance (débit) et 401x comme dette (crédit)', () => {
        const entries = [
            entry({ lines: [{ accountCode: '411000', debitInCents: 120_000 }] }),  // client doit 1200 €
            entry({ lines: [{ accountCode: '401000', creditInCents: 80_000 }] }),  // on doit 800 € au fournisseur
        ];
        const t = computeTreasury(entries, NOW);
        expect(t.pendingReceivablesInMicrounits).toBe(1200 * 1_000_000);
        expect(t.pendingPayablesInMicrounits).toBe(800 * 1_000_000);
    });

    it('construit une courbe de flux de 14 jours et signe produits/charges', () => {
        const entries = [
            entry({ type: 'revenue', amountInMicrounits: 500 * 1_000_000, date: NOW }),
            entry({ type: 'expense', amountInMicrounits: 200 * 1_000_000, date: NOW }),
            entry({ type: 'revenue', amountInMicrounits: 100 * 1_000_000, date: NOW - 3 * DAY }),
        ];
        const t = computeTreasury(entries, NOW);
        expect(t.cashFlowTrend).toHaveLength(14);
        // Dernier point = aujourd'hui : 500 − 200 = 300 €
        const today = t.cashFlowTrend[t.cashFlowTrend.length - 1];
        expect(today.netInMicrounits).toBe(300 * 1_000_000);
        // Point à J−3 = 100 €
        const j3 = t.cashFlowTrend[t.cashFlowTrend.length - 4];
        expect(j3.netInMicrounits).toBe(100 * 1_000_000);
        // La courbe est ordonnée du plus ancien au plus récent.
        expect(t.cashFlowTrend[0].date).toBeLessThan(today.date);
    });

    it('ignore les écritures hors fenêtre de 14 jours pour la courbe', () => {
        const entries = [
            entry({ type: 'revenue', amountInMicrounits: 999 * 1_000_000, date: NOW - 40 * DAY }),
        ];
        const t = computeTreasury(entries, NOW);
        const total = t.cashFlowTrend.reduce((s, p) => s + p.netInMicrounits, 0);
        expect(total).toBe(0);
    });

    it('projette la prévision 30j = position + flux journalier moyen × 30', () => {
        // 14 jours identiques à +10 €/jour → moyenne 10 €, prévision = position + 300 €.
        const entries = Array.from({ length: 14 }, (_, i) =>
            entry({ type: 'revenue', amountInMicrounits: 10 * 1_000_000, date: NOW - i * DAY }),
        );
        // + une position de caisse de 1000 €
        entries.push(entry({ lines: [{ accountCode: '531', debitInCents: 100_000 }] }));
        const t = computeTreasury(entries, NOW);
        expect(t.forecast30DaysInMicrounits).toBe((1000 + 300) * 1_000_000);
    });

    it('retourne tout à zéro sur un grand livre vide (pas de NaN)', () => {
        const t = computeTreasury([], NOW);
        expect(t.cashOnHandInMicrounits).toBe(0);
        expect(t.netCashPositionInMicrounits).toBe(0);
        expect(t.forecast30DaysInMicrounits).toBe(0);
        expect(t.cashFlowTrend).toHaveLength(14);
        expect(t.cashFlowTrend.every(p => p.netInMicrounits === 0)).toBe(true);
    });
});
