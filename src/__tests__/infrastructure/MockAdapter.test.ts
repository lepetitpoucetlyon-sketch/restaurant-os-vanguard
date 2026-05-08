import { describe, it, expect, beforeEach } from 'vitest';
import { MockAdapter } from '../../../infrastructure/adapters/MockAdapter';

describe('MockAdapter - Storage Strict Types & Batches', () => {
    let adapter: MockAdapter;

    beforeEach(() => {
        adapter = new MockAdapter();
    });

    it('should respect Record<string, unknown> strict typing in set and get', async () => {
        const path = 'finance/metrics/daily';
        const data: Record<string, unknown> = {
            totalInMicrounits: BigInt(5000000),
            transactionCount: 15,
            isClosed: false
        };

        await adapter.set(path, data);
        const retrieved = await adapter.get<Record<string, unknown>>(path);

        expect(retrieved).not.toBeNull();
        expect(retrieved?.transactionCount).toBe(15);
        expect(retrieved?.isClosed).toBe(false);
    });

    it('should handle partial updates without losing data', async () => {
        const path = 'users/admin';
        await adapter.set(path, { role: 'admin', isActive: true, permissions: ['READ', 'WRITE'] });

        // Partial update matching our strict unknown constraints
        await adapter.update(path, { isActive: false });

        const retrieved = await adapter.get<Record<string, unknown>>(path);
        expect(retrieved?.role).toBe('admin');
        expect(retrieved?.isActive).toBe(false);
        expect(Array.isArray(retrieved?.permissions)).toBe(true);
    });

    it('should successfully execute batched operations', async () => {
        const batch = adapter.batch();
        
        batch.set('batch/1', { value: 1 });
        batch.set('batch/2', { value: 2 });
        batch.update('batch/1', { updated: true });
        batch.delete('batch/2');
        batch.increment('batch/counter', 'count', 5);

        // Nothing should be in storage yet
        const beforeCommit = await adapter.get('batch/1');
        expect(beforeCommit).toBeNull();

        await batch.commit();

        const doc1 = await adapter.get<Record<string, unknown>>('batch/1');
        expect(doc1?.value).toBe(1);
        expect(doc1?.updated).toBe(true);

        const doc2 = await adapter.get('batch/2');
        expect(doc2).toBeNull();

        const counter = await adapter.get<Record<string, unknown>>('batch/counter');
        expect(counter?.count).toBe(5);
    });
});
