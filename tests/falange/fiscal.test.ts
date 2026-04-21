import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditHasher } from '@/lib/blockchain-ledger';
import { getDocs, setDoc, QuerySnapshot, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

describe('🏛️ FALANGE - COHORTE FISCAL (10 TESTS)', () => {
    
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockOrder = {
        id: 'ORD_001',
        items: [{ id: 'itm_1', name: 'Pizza', price: 1200 }],
        total: 1200,
        timestamp: new Date().toISOString(),
        tableId: 'T1'
    };

    it('1. Hash SHA-256 valide', async () => {
        const proof = await AuditHasher.generateProof(mockOrder);
        expect(proof.hash).toHaveLength(64);
    });

    it('2. Chaînage hash précédent', async () => {
        const previousProof = { hash: 'PREVIOUS_HASH_123', sequenceNumber: 1 };
        vi.mocked(getDocs).mockResolvedValueOnce({
            empty: false,
            docs: [{ data: () => previousProof } as QueryDocumentSnapshot<DocumentData>]
        } as QuerySnapshot<DocumentData>);
        const proof = await AuditHasher.generateProof(mockOrder);
        expect(proof.previousHash).toBe('PREVIOUS_HASH_123');
        expect(proof.sequenceNumber).toBe(2);
    });

    it('3. Incrémentation séquence', async () => {
        vi.mocked(getDocs).mockResolvedValueOnce({
            empty: false,
            docs: [{ data: () => ({ hash: 'abc', sequenceNumber: 49 }) } as QueryDocumentSnapshot<DocumentData>]
        } as QuerySnapshot<DocumentData>);
        const proof = await AuditHasher.generateProof(mockOrder);
        expect(proof.sequenceNumber).toBe(50);
    });

    it('4. Détection échec Firebase', async () => {
        vi.mocked(getDocs).mockRejectedValueOnce(new Error('Down'));
        const proof = await AuditHasher.generateProof(mockOrder);
        expect(proof.status).toBe('chain_broken');
    });

    it('5. Validation chaîne intègre', async () => {
        vi.mocked(getDocs).mockResolvedValueOnce({ empty: true, docs: [] } as QuerySnapshot<DocumentData>);
        const proof = await AuditHasher.generateProof(mockOrder);
        
        vi.mocked(getDocs).mockResolvedValueOnce({
            docs: [{ data: () => proof } as QueryDocumentSnapshot<DocumentData>]
        } as QuerySnapshot<DocumentData>);
        const result = await AuditHasher.verifyChain();
        expect(result.valid).toBe(true);
    });

    it('6. Détection hash altéré', async () => {
        const proof = await AuditHasher.generateProof(mockOrder);
        vi.mocked(getDocs).mockResolvedValueOnce({
            docs: [{ data: () => ({ ...proof, hash: 'TAMPERED' }) } as QueryDocumentSnapshot<DocumentData>]
        } as QuerySnapshot<DocumentData>);
        const result = await AuditHasher.verifyChain();
        expect(result.valid).toBe(false);
    });

    it('7. Stockage Firestore', async () => {
        const proof = await AuditHasher.generateProof(mockOrder);
        await AuditHasher.storeProof(proof);
        expect(setDoc).toHaveBeenCalled();
    });

    it('8. Métadonnées orderId', async () => {
        const proof = await AuditHasher.generateProof(mockOrder);
        expect(proof.orderId).toBe(mockOrder.id);
    });

    it('9. Détection previousHash incorrect', async () => {
        // Générer un premier proof correct (sequence 1, previousHash: null)
        vi.mocked(getDocs).mockResolvedValueOnce({ empty: true, docs: [] } as QuerySnapshot<DocumentData>);
        const firstProof = await AuditHasher.generateProof(mockOrder);

        // Mock verifyChain avec deux noeuds: le 2e a un previousHash incorrect
        const proofs = [
            firstProof, // valide (seq 1)
            { sequenceNumber: 2, hash: 'h2', previousHash: 'WRONG_HASH', data: 'somedata' }
        ];
        vi.mocked(getDocs).mockResolvedValueOnce({
            docs: proofs.map(p => ({ data: () => p }) as QueryDocumentSnapshot<DocumentData>)
        } as QuerySnapshot<DocumentData>);
        const result = await AuditHasher.verifyChain();
        expect(result.valid).toBe(false);
        expect(result.brokenAt).toBe(2);
    });

    it('10. Performance < 50ms', async () => {
        const start = performance.now();
        await AuditHasher.generateProof(mockOrder);
        expect(performance.now() - start).toBeLessThan(50);
    });
});
