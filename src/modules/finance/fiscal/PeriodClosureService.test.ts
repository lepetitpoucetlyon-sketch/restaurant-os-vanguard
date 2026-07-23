import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PeriodClosureService } from './PeriodClosureService';

vi.mock('@/lib/nexus/NexusAdapter', () => ({
    Nexus: {
        adapter: {
            get: vi.fn(),
            set: vi.fn(),
            query: vi.fn(),
        },
    },
}));

vi.mock('@domain/services/CryptoService', () => ({
    CryptoService: {
        canonicalStringify: vi.fn((data: unknown) => JSON.stringify(data)),
        generateHash: vi.fn(async (data: string, prev: string) => `hash_${data.length}_${prev.slice(0, 4)}`),
    },
}));

vi.mock('@/lib/shared-kernel', () => ({
    SharedKernel: {
        generateId: vi.fn((prefix: string) => `${prefix}-test-001`),
    },
}));

const { Nexus } = await import('@/lib/nexus/NexusAdapter');
const mockGet = Nexus.adapter.get as ReturnType<typeof vi.fn>;
const mockSet = Nexus.adapter.set as ReturnType<typeof vi.fn>;
const mockQuery = Nexus.adapter.query as ReturnType<typeof vi.fn>;

describe('PeriodClosureService', () => {
    let service: PeriodClosureService;

    beforeEach(() => {
        service = new PeriodClosureService();
        vi.clearAllMocks();
        mockGet.mockResolvedValue(null);
        mockSet.mockResolvedValue(undefined);
        mockQuery.mockResolvedValue([]);
    });

    it('creates a monthly closure with hash chain', async () => {
        mockQuery.mockResolvedValueOnce([
            { type: 'revenue', amountInCents: 10000, date: '2026-01-15' },
            { type: 'revenue', amountInCents: 5000, date: '2026-01-20' },
        ]).mockResolvedValueOnce([]);

        const closure = await service.close(
            'resto-1', 'monthly', '2026-01',
            '2026-01-01', '2026-01-31', 'admin-1'
        );

        expect(closure.periodKey).toBe('2026-01');
        expect(closure.transactionCount).toBe(2);
        expect(closure.hash).toBeTruthy();
        expect(closure.previousHash).toBe('0'.repeat(64));
        expect(mockSet).toHaveBeenCalledWith(
            'tenants/resto-1/periodClosures/2026-01',
            expect.objectContaining({ periodType: 'monthly' })
        );
    });

    it('rejects duplicate closure', async () => {
        mockGet.mockResolvedValueOnce({ id: 'existing' });

        await expect(
            service.close('resto-1', 'monthly', '2026-01', '2026-01-01', '2026-01-31', 'admin-1')
        ).rejects.toThrow('déjà effectuée');
    });

    it('chains from previous closure hash', async () => {
        mockQuery
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([{ hash: 'prevhash' + '0'.repeat(56) }]);

        const closure = await service.close(
            'resto-1', 'monthly', '2026-02',
            '2026-02-01', '2026-02-28', 'admin-1'
        );

        expect(closure.previousHash).toBe('prevhash' + '0'.repeat(56));
    });

    it('computes grand total across monthly closures', async () => {
        mockQuery.mockResolvedValueOnce([
            { grandTotalInMicrounits: 100_000_000 },
            { grandTotalInMicrounits: 200_000_000 },
            { grandTotalInMicrounits: 150_000_000 },
        ]);

        const total = await service.getGrandTotal('resto-1');
        expect(total).toBe(450_000_000);
    });
});
