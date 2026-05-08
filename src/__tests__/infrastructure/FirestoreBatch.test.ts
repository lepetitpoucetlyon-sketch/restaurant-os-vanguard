import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FirestoreBatch } from '../../../infrastructure/adapters/FirestoreBatch';

// Mock Firebase Firestore functions
vi.mock('firebase/firestore', () => ({
    writeBatch: vi.fn().mockReturnValue({
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined)
    }),
    doc: vi.fn((db, path) => ({ _type: 'documentRef', db, path })),
    increment: vi.fn((amount) => ({ _type: 'increment', amount }))
}));

describe('FirestoreBatch - Grade X Strict Typing Audit', () => {
    let mockDb: any;
    let batchAdapter: FirestoreBatch;

    beforeEach(() => {
        mockDb = { _type: 'firestoreInstance' };
        batchAdapter = new FirestoreBatch(mockDb);
    });

    it('should use doc(db, path) and pass Record<string, unknown> correctly on set', () => {
        const path = 'tenants/t1/config/main';
        const data: Record<string, unknown> = {
            isActive: true,
            level: 5,
            features: { modules: ['finance', 'ops'] }
        };

        batchAdapter.set(path, data);

        // Access the mocked batch object returned inside the constructor
        const batchInstance = (batchAdapter as any).batch;
        
        expect(batchInstance.set).toHaveBeenCalledTimes(1);
        
        // Assert doc() mock usage
        const docArg = batchInstance.set.mock.calls[0][0];
        const dataArg = batchInstance.set.mock.calls[0][1];

        expect(docArg.path).toBe(path);
        expect(docArg.db).toBe(mockDb);
        expect(dataArg).toEqual(data); // Ensures typing matches the object
    });

    it('should securely handle update operations', () => {
        const path = 'orders/123';
        const data: Record<string, unknown> = { status: 'COMPLETED' };

        batchAdapter.update(path, data);

        const batchInstance = (batchAdapter as any).batch;
        expect(batchInstance.update).toHaveBeenCalledTimes(1);
        
        const docArg = batchInstance.update.mock.calls[0][0];
        const dataArg = batchInstance.update.mock.calls[0][1];

        expect(docArg.path).toBe(path);
        expect(dataArg).toEqual(data);
    });

    it('should safely construct increment fields', () => {
        batchAdapter.increment('stock/item1', 'quantity', -5);

        const batchInstance = (batchAdapter as any).batch;
        expect(batchInstance.update).toHaveBeenCalledTimes(1);

        const updateData = batchInstance.update.mock.calls[0][1];
        expect(updateData).toHaveProperty('quantity');
        expect(updateData.quantity._type).toBe('increment');
        expect(updateData.quantity.amount).toBe(-5);
    });
});
