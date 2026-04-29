import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditHasher } from '@/infrastructure/adapters/LedgerAdapter';
import { Nexus } from '@/lib/nexus/NexusAdapter';

// Mock Nexus Adapter
vi.mock('@/lib/nexus/NexusAdapter', () => ({
    Nexus: {
        adapter: {
            query: vi.fn(async () => []),
            set: vi.fn(),
            get: vi.fn()
        }
    }
}));

describe('🏛️ FALANGE - COHORTE FISCAL (10 TESTS)', () => {
    
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockOrder = {
        id: 'ORD_001',
        items: [{ id: 'itm_1', name: 'Pizza', price: 1200 }],
        total: 1200,
        totalInCents: 1200,
        timestamp: new Date().toISOString(),
        tableId: 'T1'
    };

    it('1. Hash SHA-256 valide', async () => {
        const proof = await AuditHasher.generateProof(mockOrder as any);
        expect(proof.hash).toHaveLength(64);
    });

    it('2. Chaînage hash précédent', async () => {
        const previousProof = { hash: 'PREVIOUS_HASH_123', sequenceNumber: 1 };
        vi.mocked(Nexus.adapter.query).mockResolvedValueOnce([previousProof]);
        
        const proof = await AuditHasher.generateProof(mockOrder as any);
        expect(proof.previousHash).toBe('PREVIOUS_HASH_123');
        expect(proof.sequenceNumber).toBe(2);
    });

    it('3. Incrémentation séquence', async () => {
        vi.mocked(Nexus.adapter.query).mockResolvedValueOnce([{ hash: 'abc', sequenceNumber: 49 }]);
        const proof = await AuditHasher.generateProof(mockOrder as any);
        expect(proof.sequenceNumber).toBe(50);
    });

    it('4. Détection échec Firebase', async () => {
        vi.mocked(Nexus.adapter.query).mockRejectedValueOnce(new Error('Down'));
        const proof = await AuditHasher.generateProof(mockOrder as any);
        expect(proof.status).toBe('chain_broken');
    });

    it('5. Validation chaîne intègre', async () => {
        vi.mocked(Nexus.adapter.query).mockResolvedValueOnce([]); // empty for first proof
        const proof = await AuditHasher.generateProof(mockOrder as any);
        
        vi.mocked(Nexus.adapter.query).mockResolvedValueOnce([proof]); // return proof for verification
        const result = await AuditHasher.verifyChain();
        expect(result.valid).toBe(true);
    });

    it('6. Détection hash altéré', async () => {
        vi.mocked(Nexus.adapter.query).mockResolvedValueOnce([]); // initial
        const proof = await AuditHasher.generateProof(mockOrder as any);
        
        vi.mocked(Nexus.adapter.query).mockResolvedValueOnce([{ ...proof, hash: 'TAMPERED' }]);
        const result = await AuditHasher.verifyChain();
        expect(result.valid).toBe(false);
    });

    it('7. Stockage Firestore', async () => {
        vi.mocked(Nexus.adapter.query).mockResolvedValueOnce([]);
        const proof = await AuditHasher.generateProof(mockOrder as any);
        await AuditHasher.storeProof(proof);
        expect(Nexus.adapter.set).toHaveBeenCalled();
    });

    it('8. Métadonnées orderId', async () => {
        vi.mocked(Nexus.adapter.query).mockResolvedValueOnce([]);
        const proof = await AuditHasher.generateProof(mockOrder as any);
        expect(proof.orderId).toBe(mockOrder.id);
    });

    it('9. Détection previousHash incorrect', async () => {
        vi.mocked(Nexus.adapter.query).mockResolvedValueOnce([]);
        const firstProof = await AuditHasher.generateProof(mockOrder as any);

        const proofs = [
            firstProof,
            { sequenceNumber: 2, hash: 'h2', previousHash: 'WRONG_HASH', data: 'somedata' }
        ];
        vi.mocked(Nexus.adapter.query).mockResolvedValueOnce(proofs);
        const result = await AuditHasher.verifyChain();
        expect(result.valid).toBe(false);
        expect(result.brokenAt).toBe(2);
    });

    it('10. Performance < 50ms', async () => {
        vi.mocked(Nexus.adapter.query).mockResolvedValueOnce([]);
        const start = performance.now();
        await AuditHasher.generateProof(mockOrder as any);
        expect(performance.now() - start).toBeLessThan(50);
    });
});
