import { describe, it, expect } from 'vitest';
import { CashSessionSchema, fromLegacyCents } from '@nexus/contracts';

describe('CashSessionSchema', () => {
    it('validates a complete session', () => {
        const result = CashSessionSchema.safeParse({
            id: 'cds-001',
            openedAt: '2025-07-01T08:00:00Z',
            openingInMicrounits: 200_000_000,
            collectedInMicrounits: 85_500_000,
            changeGivenInMicrounits: 12_300_000,
            userId: 'u-1',
        });
        expect(result.success).toBe(true);
    });

    it('rejects negative microunits', () => {
        const result = CashSessionSchema.safeParse({
            id: 'cds-002',
            openedAt: '2025-07-01T08:00:00Z',
            openingInMicrounits: -1,
            collectedInMicrounits: 0,
            changeGivenInMicrounits: 0,
            userId: 'u-1',
        });
        expect(result.success).toBe(false);
    });

    it('allows optional closing fields', () => {
        const result = CashSessionSchema.safeParse({
            id: 'cds-003',
            openedAt: '2025-07-01T08:00:00Z',
            openingInMicrounits: 100_000_000,
            closedAt: '2025-07-01T22:00:00Z',
            closingInMicrounits: 273_200_000,
            collectedInMicrounits: 200_000_000,
            changeGivenInMicrounits: 26_800_000,
            userId: 'u-1',
        });
        expect(result.success).toBe(true);
    });
});

describe('fromLegacyCents', () => {
    it('converts cents to microunits (1 cent = 10 000 µ)', () => {
        const session = fromLegacyCents({
            id: 'cds-legacy',
            openedAt: '2025-06-01T08:00:00Z',
            openingAmountInCents: 20000,
            cashCollectedInCents: 8550,
            changeGivenInCents: 1230,
            userId: 'u-1',
        });
        expect(session.openingInMicrounits).toBe(200_000_000);
        expect(session.collectedInMicrounits).toBe(85_500_000);
        expect(session.changeGivenInMicrounits).toBe(12_300_000);
    });

    it('handles closing amount conversion', () => {
        const session = fromLegacyCents({
            id: 'cds-legacy-2',
            openedAt: '2025-06-01T08:00:00Z',
            openingAmountInCents: 20000,
            closedAt: '2025-06-01T22:00:00Z',
            closingAmountInCents: 27320,
            cashCollectedInCents: 10000,
            changeGivenInCents: 2680,
            userId: 'u-1',
        });
        expect(session.closingInMicrounits).toBe(273_200_000);
    });
});
