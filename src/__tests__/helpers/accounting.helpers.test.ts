import { describe, it, expect, vi } from 'vitest';

vi.mock('@/store/pillars/compliance', () => ({ fiscalLedgerAtom: {}, fiscalLedgerNodeAtom: {} }));
vi.mock('@/modules/finance/store/accountingAtoms', () => ({
    journalEntriesNodeAtom: {}, accountsAtom: {}, bankTransactionsAtom: {},
    expenseClaimsAtom: {}, accountingViewModeAtom: {},
}));
vi.mock('@shared/hooks/useNexusMutation', () => ({ useNexusMutation: vi.fn() }));

import { getAmountInMu, buildEntryAmountInCents } from '@/modules/finance';

const toCents = (µ: number) => Math.round(µ / 10_000);

describe('getAmountInMu', () => {
    it('utilise amountInMicrounits en priorité', () => {
        expect(getAmountInMu({ amountInMicrounits: 50_000_000 })).toBe(50_000_000);
    });

    it('convertit amountInCents × 10 000 quand pas de microunits', () => {
        expect(getAmountInMu({ amountInCents: 100 })).toBe(1_000_000);
    });

    it('amountInMicrounits = 0 est utilisé (pas sauté)', () => {
        expect(getAmountInMu({ amountInMicrounits: 0, amountInCents: 999 })).toBe(0);
    });

    it('fallback credit + debit × 10 000', () => {
        expect(getAmountInMu({ credit: 50, debit: 30 })).toBe(800_000);
    });

    it('credit seul', () => {
        expect(getAmountInMu({ credit: 20 })).toBe(200_000);
    });

    it('retourne 0 si aucun champ', () => {
        expect(getAmountInMu({})).toBe(0);
    });

    it('amountInMicrounits null → fallback amountInCents', () => {
        expect(getAmountInMu({ amountInMicrounits: null, amountInCents: 100 })).toBe(1_000_000);
    });
});

describe('buildEntryAmountInCents', () => {
    it('utilise amountInMicrounits direct si non null', () => {
        const e = { amountInMicrounits: 10_000_000, lines: [] };
        expect(buildEntryAmountInCents(e, 'credit', toCents)).toBe(1000);
    });

    it('agrège les lignes du bon side si amountInMicrounits est null', () => {
        const e = {
            amountInMicrounits: null as number | null,
            lines: [
                { side: 'credit', amountInMicrounits: 5_000_000 },
                { side: 'debit',  amountInMicrounits: 3_000_000 },
                { side: 'credit', amountInMicrounits: 2_000_000 },
            ],
        };
        expect(buildEntryAmountInCents(e, 'credit', toCents)).toBe(700);
    });

    it('retourne 0 si aucune ligne du bon side', () => {
        const e = {
            amountInMicrounits: null as number | null,
            lines: [{ side: 'debit', amountInMicrounits: 10_000_000 }],
        };
        expect(buildEntryAmountInCents(e, 'credit', toCents)).toBe(0);
    });

    it('ligne sans amountInMicrounits compte 0', () => {
        const e = {
            amountInMicrounits: null as number | null,
            lines: [{ side: 'credit' }],
        };
        expect(buildEntryAmountInCents(e, 'credit', toCents)).toBe(0);
    });
});
