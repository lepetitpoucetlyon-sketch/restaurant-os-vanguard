/**
 * AUDIT HASHER SERVICE — Restaurant OS
 * Système d'intégrité cryptographique par chaînage de hashes.
 * 
 * Architecture:
 * - Chaque transaction génère un hash SHA-256
 * - Chaque hash inclut le hash précédent (chaînage)
 * - Les preuves sont stockées dans Firestore `auditProofs`
 * - Toute modification d'une transaction passée rompt la chaîne → fraude détectée
 * 
 * Phase 2: Migration vers Polygon pour notarisation on-chain.
 */

import { Nexus } from '@/lib/nexus/NexusAdapter';

export interface AuditProof {
    hash: string;
    previousHash: string | null;
    orderId: string;
    timestamp: string;
    sequenceNumber: number;
    status: 'confirmed' | 'chain_broken';
    data: string; // JSON stringified order data for verification
}

export const AuditHasher = {
    /**
     * Génère un hash SHA-256 d'une commande avec chaînage au hash précédent.
     */
    generateProof: async (orderData: import('@/types').Order): Promise<AuditProof> => {
        // 1. Récupérer le dernier hash pour le chaînage
        let previousHash: string | null = null;
        let sequenceNumber = 1;
        let chainBroken = false;

        try {
            const lastProofs = await Nexus.adapter.query<AuditProof>('auditProofs', {
                orderBy: { field: 'sequenceNumber', direction: 'desc' },
                limit: 1
            }) || [];
            
            if (lastProofs && lastProofs.length > 0) {
                const lastProof = lastProofs[0];
                previousHash = lastProof.hash;
                sequenceNumber = lastProof.sequenceNumber + 1;
            }
        } catch (err) {
            // Mode dégradé: chaîne rompue (offline ou erreur Firestore)
            console.warn('[AuditHasher] Impossible de lire le dernier hash. Mode dégradé activé.', err);
            chainBroken = true;
            previousHash = 'CHAIN_BREAK_' + new Date().toISOString();
        }

        // 2. Préparer les données à hasher
        const rawData = JSON.stringify({
            items: orderData.items,
            total: orderData.totalInCents || orderData.total,
            timestamp: orderData.timestamp,
            tableId: orderData.tableId,
            previousHash // Le chaînage est DANS le hash
        });

        // 3. Générer le SHA-256
        const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawData));
        const hashHex = Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0')).join('');

        const proof: AuditProof = {
            hash: hashHex,
            previousHash,
            orderId: orderData.id || `ORD_${Date.now()}`,
            timestamp: new Date().toISOString(),
            sequenceNumber,
            status: chainBroken ? 'chain_broken' : 'confirmed',
            data: rawData
        };

        return proof;
    },

    /**
     * Stocke la preuve dans Firestore `auditProofs`.
     * Retourne l'ID du document.
     */
    storeProof: async (proof: AuditProof): Promise<string> => {
        const proofId = `proof_${proof.sequenceNumber}_${Date.now()}`;
        await Nexus.adapter.set(`auditProofs/${proofId}`, {
            ...proof,
            id: proofId,
            storedAt: new Date().toISOString()
        });
        return proofId;
    },

    /**
     * Vérifie l'intégrité d'une chaîne de preuves.
     * Retourne true si la chaîne est intègre.
     */
    verifyChain: async (startSeq: number = 1, endSeq?: number): Promise<{
        valid: boolean;
        brokenAt?: number;
        totalVerified: number;
    }> => {
        const proofs = await Nexus.adapter.query<AuditProof>('auditProofs', {
            orderBy: { field: 'sequenceNumber', direction: 'asc' }
        });

        let prevHash: string | null = null;
        let verified = 0;

        for (const proof of proofs) {
            if (proof.sequenceNumber < startSeq) continue;
            if (endSeq && proof.sequenceNumber > endSeq) break;

            if (proof.previousHash !== prevHash) {
                return { valid: false, brokenAt: proof.sequenceNumber, totalVerified: verified };
            }

            // Recalculer le hash pour vérifier l'intégrité des données
            const recalcBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(proof.data));
            const recalcHash = Array.from(new Uint8Array(recalcBuffer))
                .map(b => b.toString(16).padStart(2, '0')).join('');

            if (recalcHash !== proof.hash) {
                return { valid: false, brokenAt: proof.sequenceNumber, totalVerified: verified };
            }

            prevHash = proof.hash;
            verified++;
        }

        return { valid: true, totalVerified: verified };
    }
};

// Backward compatibility alias
export const BlockchainLedger = {
    generateProof: AuditHasher.generateProof,
    notarizeToPolygon: async (proof: AuditProof): Promise<string> => {
        // Phase 1: Stockage Firestore (remplace le setTimeout simulé)
        const proofId = await AuditHasher.storeProof(proof);
        return proofId;
    }
};

