import { Nexus } from '@/lib/nexus/NexusAdapter';
import { COLLECTIONS } from '@nexus/constants/collections';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';
import type {
    SupplierDispute,
    SupplierDisputeReason,
    SupplierPriceEntry,
    SupplierRebateScheme,
    SupplierRebateTier,
    SupplierOrder,
} from '@nexus/contracts';

/**
 * 🤝 SupplierHubService
 *
 * Logique métier du hub fournisseurs : litiges de réception, mercuriales
 * comparées, remises de fin d'année, commandes.
 *
 * Ces quatre domaines n'avaient aucune couche de données : les onglets
 * affichaient des constantes (fournisseurs, litiges et prix inventés) et
 * leurs boutons ne menaient nulle part.
 *
 * Tous les montants sont en microunits (1 € = 1 000 000 µ), conformément à
 * la convention monétaire du socle.
 */

const MICROUNITS_PER_EUR = 1_000_000;

export const eurosToMicrounits = (euros: number): number => Math.round(euros * MICROUNITS_PER_EUR);

/** Séquence lisible par domaine et par mois : LIT-202608-0015. */
function buildReference(prefix: string, existingCount: number, at: Date): string {
    const stamp = `${at.getFullYear()}${String(at.getMonth() + 1).padStart(2, '0')}`;
    return `${prefix}-${stamp}-${String(existingCount + 1).padStart(4, '0')}`;
}

// ── Litiges & avoirs ────────────────────────────────────────────────────────

export interface DeclareDisputeInput {
    supplierId: string;
    supplierName: string;
    blNumber: string;
    reason: SupplierDisputeReason;
    details?: string;
    claimedAmountInMicrounits: number;
    declaredBy: string;
}

export interface SettleDisputeInput {
    disputeId: string;
    creditNoteNumber: string;
    creditedAmountInMicrounits: number;
    settlementReference?: string;
}

export interface IngredientComparison {
    ingredientName: string;
    unit: string;
    best: SupplierPriceEntry;
    others: SupplierPriceEntry[];
    spreadPercent: number;
}

function buildIngredientComparison(list: SupplierPriceEntry[]): IngredientComparison {
    const sorted = [...list].sort((a, b) => a.pricePerUnitInMicrounits - b.pricePerUnitInMicrounits);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    const spreadPercent = best.pricePerUnitInMicrounits > 0
        ? ((worst.pricePerUnitInMicrounits - best.pricePerUnitInMicrounits) / best.pricePerUnitInMicrounits) * 100
        : 0;

    return {
        ingredientName: best.ingredientName,
        unit: String(best.unit),
        best,
        others: sorted.slice(1),
        spreadPercent,
    };
}

export class SupplierHubService {

    static async listDisputes(): Promise<SupplierDispute[]> {
        try {
            const rows = await Nexus.adapter.query<SupplierDispute>(COLLECTIONS.supplierDisputes);
            return (rows ?? []).sort((a, b) => (b.declaredAt ?? '').localeCompare(a.declaredAt ?? ''));
        } catch (err) {
            logger.warn('[SupplierHub] Lecture des litiges impossible', { error: toError(err).message });
            throw err;
        }
    }

    /** Ouvre un litige sur un BL. Le litige naît « déclaré » puis suit son cycle. */
    static async declareDispute(input: DeclareDisputeInput): Promise<SupplierDispute> {
        if (!input.blNumber.trim()) throw new Error('Le numéro de bon de livraison est obligatoire.');
        if (input.claimedAmountInMicrounits <= 0) throw new Error('Le montant réclamé doit être supérieur à zéro.');

        const existing = await SupplierHubService.listDisputes();
        const now = new Date();
        const id = Nexus.adapter.generateId(COLLECTIONS.supplierDisputes);

        const dispute: SupplierDispute = {
            id,
            reference: buildReference('LIT', existing.length, now),
            supplierId: input.supplierId,
            supplierName: input.supplierName,
            blNumber: input.blNumber.trim(),
            reason: input.reason,
            details: input.details?.trim() || undefined,
            claimedAmountInMicrounits: input.claimedAmountInMicrounits,
            status: 'claimed',
            declaredBy: input.declaredBy,
            declaredAt: now.toISOString(),
        };

        await Nexus.adapter.set(`${COLLECTIONS.supplierDisputes}/${id}`, dispute);
        logger.info('[SupplierHub] Litige déclaré', { reference: dispute.reference, supplier: input.supplierName });
        return dispute;
    }

    /**
     * Rapproche l'avoir reçu du litige. Un avoir inférieur au montant réclamé
     * reste un règlement valide (geste commercial partiel) : on conserve les
     * deux montants pour que l'écart reste vérifiable.
     */
    static async settleDispute(input: SettleDisputeInput): Promise<void> {
        if (!input.creditNoteNumber.trim()) throw new Error('Le numéro d\'avoir est obligatoire.');
        if (input.creditedAmountInMicrounits <= 0) throw new Error('Le montant de l\'avoir doit être supérieur à zéro.');

        await Nexus.adapter.update(`${COLLECTIONS.supplierDisputes}/${input.disputeId}`, {
            status: 'settled',
            creditNoteNumber: input.creditNoteNumber.trim(),
            creditedAmountInMicrounits: input.creditedAmountInMicrounits,
            settlementReference: input.settlementReference?.trim() || undefined,
            settledAt: new Date().toISOString(),
        });
        logger.info('[SupplierHub] Avoir rapproché', { disputeId: input.disputeId, avoir: input.creditNoteNumber });
    }

    // ── Mercuriales ─────────────────────────────────────────────────────────

    static async listPrices(): Promise<SupplierPriceEntry[]> {
        const rows = await Nexus.adapter.query<SupplierPriceEntry>(COLLECTIONS.supplierPrices);
        return rows ?? [];
    }

    /** Remplace la mercuriale d'un fournisseur par le jeu de lignes importé. */
    static async importPrices(supplierId: string, supplierName: string, entries: Array<Omit<SupplierPriceEntry, 'id' | 'supplierId' | 'supplierName' | 'updatedAt'>>): Promise<number> {
        if (entries.length === 0) return 0;
        const now = new Date().toISOString();
        const batch = Nexus.adapter.batch();

        // Les lignes précédentes du même fournisseur sont retirées : une mercuriale
        // est un tarif à date, pas un historique cumulatif.
        const current = await SupplierHubService.listPrices();
        for (const stale of current.filter(p => p.supplierId === supplierId)) {
            batch.delete(`${COLLECTIONS.supplierPrices}/${stale.id}`);
        }

        for (const entry of entries) {
            const id = Nexus.adapter.generateId(COLLECTIONS.supplierPrices);
            batch.set(`${COLLECTIONS.supplierPrices}/${id}`, {
                ...entry,
                id,
                supplierId,
                supplierName,
                updatedAt: now,
            } satisfies SupplierPriceEntry);
        }

        await batch.commit();
        logger.info('[SupplierHub] Mercuriale importée', { supplierName, lignes: entries.length });
        return entries.length;
    }

    static compareByIngredient(prices: SupplierPriceEntry[]): IngredientComparison[] {
        const groups = new Map<string, SupplierPriceEntry[]>();
        for (const p of prices) {
            const key = (p.ingredientId ?? p.ingredientName).toLowerCase().trim();
            const list = groups.get(key) ?? [];
            list.push(p);
            groups.set(key, list);
        }

        const out = Array.from(groups.values()).map(buildIngredientComparison);
        return out.sort((a, b) => b.spreadPercent - a.spreadPercent);
    }

    // ── Remises de fin d'année ──────────────────────────────────────────────

    static async listRebates(): Promise<SupplierRebateScheme[]> {
        const rows = await Nexus.adapter.query<SupplierRebateScheme>(COLLECTIONS.supplierRebates);
        return rows ?? [];
    }

    /**
     * Calcule la RFA acquise à date. Barème par paliers : le taux du plus haut
     * seuil franchi s'applique à l'intégralité des achats de l'exercice.
     */
    static computeRebate(scheme: SupplierRebateScheme): {
        currentTier: SupplierRebateTier | null;
        nextTier: SupplierRebateTier | null;
        earnedInMicrounits: number;
        missingForNextInMicrounits: number;
    } {
        const tiers = [...scheme.tiers].sort((a, b) => a.thresholdInMicrounits - b.thresholdInMicrounits);
        const purchased = scheme.purchasedToDateInMicrounits;

        let currentTier: SupplierRebateTier | null = null;
        let nextTier: SupplierRebateTier | null = null;

        for (const tier of tiers) {
            if (purchased >= tier.thresholdInMicrounits) currentTier = tier;
            else { nextTier = tier; break; }
        }

        const earnedInMicrounits = currentTier
            ? Math.round(purchased * (currentTier.ratePercent / 100))
            : 0;

        return {
            currentTier,
            nextTier,
            earnedInMicrounits,
            missingForNextInMicrounits: nextTier ? Math.max(0, nextTier.thresholdInMicrounits - purchased) : 0,
        };
    }

    // ── Commandes ───────────────────────────────────────────────────────────

    static async listOrders(): Promise<SupplierOrder[]> {
        const rows = await Nexus.adapter.query<SupplierOrder>(COLLECTIONS.supplierOrders);
        return (rows ?? []).sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
    }

    /**
     * Met en forme le message de commande envoyé au fournisseur.
     * Extrait ici pour que WhatsApp, e-mail et impression partagent le même texte.
     */
    static formatOrderMessage(order: SupplierOrder): string {
        const lines = [
            `Bon de commande ${order.id}`,
            `Fournisseur : ${order.supplierName}`,
            '',
            ...order.items.map(i => `- ${i.quantity} ${i.unit} ${i.ingredientName}`),
            '',
            `Total HT : ${((order.totalCostInMicrounits ?? order.totalCostInCents * 10_000) / MICROUNITS_PER_EUR).toFixed(2)} €`,
        ];
        if (order.deliveryDate) lines.push(`Livraison souhaitée : ${new Date(order.deliveryDate).toLocaleDateString('fr-FR')}`);
        return lines.join('\n');
    }
}
