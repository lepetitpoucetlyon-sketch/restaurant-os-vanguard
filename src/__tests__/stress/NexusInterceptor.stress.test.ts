import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NexusInterceptor } from '../../lib/nexus/NexusInterceptor';
import { SovereignGuard } from '../../shared/nexus/guards/SovereignGuard';

describe('NexusInterceptor - Stress & Race Condition Audit', () => {
    let mockAdapter: any;
    let interceptor: NexusInterceptor;
    const mockTenantId = 'test-vassal-01';

    beforeEach(() => {
        mockAdapter = {
            get: vi.fn().mockImplementation(async (path) => ({ id: path.split('/').pop(), value: 'safe' })),
            set: vi.fn().mockImplementation(async () => {}),
            query: vi.fn().mockImplementation(async () => []),
            update: vi.fn().mockImplementation(async () => {}),
            onSnapshot: vi.fn().mockImplementation((_path, cb, _opts) => {
                // Simulate Firestore: call callback immediately with data
                setTimeout(() => cb([{ id: 'doc1', value: 'snapshot-data' }]), 0);
                return () => {}; // unsubscribe
            }),
            delete: vi.fn().mockImplementation(async () => {}),
            create: vi.fn().mockImplementation(async () => {}),
            increment: vi.fn().mockImplementation(async () => {}),
            batch: vi.fn().mockReturnValue({ set: vi.fn(), update: vi.fn(), delete: vi.fn(), increment: vi.fn(), commit: vi.fn() }),
            generateId: vi.fn().mockReturnValue('generated-id'),
        };

        // Mock SovereignGuard to simulate slight latency
        vi.spyOn(SovereignGuard, 'validateAccessGradeX').mockImplementation(async () => {
            await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
            return { granted: true };
        });

        vi.spyOn(SovereignGuard, 'protectWrite').mockImplementation(async (path, data) => {
            await new Promise(resolve => setTimeout(resolve, Math.random() * 5));
            return data;
        });

        interceptor = new NexusInterceptor(
            mockAdapter,
            SovereignGuard as any,
            () => mockTenantId
        );
    });

    it('handles 50 concurrent transactions without data corruption or cross-tenant leakage', async () => {
        const transactions = Array.from({ length: 50 }, (_, i) => ({
            path: `orders/ORD-${i}`,
            data: { amountInMicrounits: BigInt(i * 1_000_000) }
        }));

        // Execution massive
        const results = await Promise.all(
            transactions.map(tx => interceptor.set(tx.path, tx.data))
        );

        expect(results).toHaveLength(50);
        
        // Verifier que chaque appel à l'adapter a reçu le bon chemin scopé
        transactions.forEach((tx, i) => {
            const expectedPath = `tenants/${mockTenantId}/${tx.path}`;
            expect(mockAdapter.set).toHaveBeenCalledWith(
                expectedPath,
                tx.data,
                undefined
            );
        });
    });

    it('preserves Microunits precision under high concurrency', async () => {
        const largeAmount = BigInt("9007199254740991000"); // Very large microunits
        const tasks = Array.from({ length: 20 }, (_, i) => ({
            path: `finance/LEDGER-${i}`,
            data: { total: largeAmount + BigInt(i) }
        }));

        await Promise.all(tasks.map(t => interceptor.set(t.path, t.data)));

        tasks.forEach((t, i) => {
            expect(mockAdapter.set).toHaveBeenCalledWith(
                `tenants/${mockTenantId}/${t.path}`,
                t.data,
                undefined
            );
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // RACE CONDITION — Guard-First Listener Validation
    // ═══════════════════════════════════════════════════════════════

    it('never calls callback before access validation completes', async () => {
        const callbackOrder: string[] = [];
        let resolveValidation!: () => void;

        const validationPromise = new Promise<void>(resolve => {
            resolveValidation = resolve;
        });

        vi.spyOn(SovereignGuard, 'validateAccessGradeX').mockImplementation(async () => {
            callbackOrder.push('validation_started');
            await validationPromise;
            callbackOrder.push('validation_completed');
            return { granted: true };
        });

        const mockCallback = vi.fn(() => {
            callbackOrder.push('callback_called');
        });

        interceptor.onSnapshot('test/path', mockCallback);

        // Data arrives from Firestore while validation is still pending
        await new Promise(r => setTimeout(r, 50));
        expect(callbackOrder).not.toContain('callback_called');
        expect(mockCallback).not.toHaveBeenCalled();

        // Now resolve validation — callback should fire after
        resolveValidation();
        await new Promise(r => setTimeout(r, 50));

        expect(callbackOrder).toEqual([
            'validation_started',
            'validation_completed',
            'callback_called'
        ]);
    });

    it('emits denial and does not call callback when access is denied', async () => {
        vi.spyOn(SovereignGuard, 'validateAccessGradeX').mockResolvedValue({ granted: false, reason: 'TENANT_MISMATCH' });
        const mockCallback = vi.fn();
        const mockOnError = vi.fn();

        interceptor.onSnapshot('restricted/path', mockCallback, { onError: mockOnError });
        await new Promise(r => setTimeout(r, 50));

        expect(mockCallback).not.toHaveBeenCalled();
        expect(mockOnError).toHaveBeenCalled();
        expect(mockAdapter.onSnapshot).not.toHaveBeenCalled(); // Listener was never started
    });

    it('emits denial and does not call callback when validation throws', async () => {
        vi.spyOn(SovereignGuard, 'validateAccessGradeX').mockRejectedValue(new Error('Auth service unavailable'));
        const mockCallback = vi.fn();
        const mockOnError = vi.fn();

        interceptor.onSnapshot('sensitive/path', mockCallback, { onError: mockOnError });
        await new Promise(r => setTimeout(r, 50));

        expect(mockCallback).not.toHaveBeenCalled();
        expect(mockOnError).toHaveBeenCalled();
        expect(mockAdapter.onSnapshot).not.toHaveBeenCalled(); // Listener was never started
    });
});
