import { PurchaseOrder, DeliveryNote } from './types';
import { logger } from '@/lib/logger';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface SupplierInvoice {
    id: string;
    supplierId: string;
    purchaseOrderId?: string;
    deliveryNoteId?: string;
    lines: Array<{
        productId: string;
        quantityBilled: number;
        unitPriceInCents: number;
    }>;
    totalAmountInCents: number;
    issueDate: string;
    dueDate: string;
    status: 'draft' | 'pending_approval' | 'approved' | 'paid' | 'disputed';
}

export interface MatchResult {
    isValid: boolean;
    discrepancies: string[];
    matchType: '2-way' | '3-way';
}

/**
 * 🏛️ ThreeWayMatchEngine - Grade X
 * Réalise le contrôle anti-fraude entre la Commande (PO), la Réception (BL) et la Facture Fournisseur.
 */
export class ThreeWayMatchEngine {
    
    /**
     * Compare le Bon de Commande, le Bon de Livraison et la Facture.
     * Le seuil de tolérance (tolerancePercent) permet de laisser passer de petits écarts (ex: frais de port ajoutés).
     */
    static async performMatch(
        po: PurchaseOrder, 
        deliveryNote: DeliveryNote, 
        invoice: SupplierInvoice,
        tenantId: string,
        tolerancePercent: number = 0 // Tolérance par défaut 0%
    ): Promise<MatchResult> {
        const discrepancies: string[] = [];

        // 1. Contrôle des références croisées
        if (deliveryNote.purchaseOrderId !== po.id) {
            discrepancies.push(`BL ${deliveryNote.id} ne correspond pas au PO ${po.id}`);
        }
        if (invoice.purchaseOrderId && invoice.purchaseOrderId !== po.id) {
            discrepancies.push(`Facture réfère au PO ${invoice.purchaseOrderId} au lieu de ${po.id}`);
        }

        // 2. Contrôle du montant global (avec tolérance)
        const expectedAmount = po.totalAmountInCents ?? 0;
        const billedAmount = invoice.totalAmountInCents;
        const diff = Math.abs(billedAmount - expectedAmount);
        const maxDiff = expectedAmount * (tolerancePercent / 100);

        if (diff > maxDiff) {
            discrepancies.push(`Montant facturé (${billedAmount}) diffère du PO (${expectedAmount}) au-delà de la tolérance (${tolerancePercent}%)`);
        }

        // 3. Contrôle des quantités (Ligne à Ligne)
        const poItemsMap = new Map((po.items || []).map((item) => [item.productId, item]));
        const blItemsMap = new Map((deliveryNote.deliveredItems || []).map((item) => [item.productId, item]));

        for (const line of invoice.lines) {
            const poItem = poItemsMap.get(line.productId);
            const blItem = blItemsMap.get(line.productId);

            if (!poItem) {
                discrepancies.push(`Produit ${line.productId} facturé mais absent du PO`);
                continue;
            }

            if (!blItem) {
                discrepancies.push(`Produit ${line.productId} facturé mais non livré dans le BL`);
                continue;
            }

            // A. PO vs Facture (Prix)
            if (line.unitPriceInCents !== poItem.unitPriceInCents) {
                discrepancies.push(`Prix unitaire différent pour ${line.productId}: PO=${poItem.unitPriceInCents}, Facture=${line.unitPriceInCents}`);
            }

            // B. BL vs Facture (Quantité)
            if (line.quantityBilled > blItem.quantityDelivered) {
                discrepancies.push(`Quantité facturée supérieure à la livraison pour ${line.productId}: Livré=${blItem.quantityDelivered}, Facturé=${line.quantityBilled}`);
            }
        }

        const isValid = discrepancies.length === 0;

        if (!isValid) {
            logger.warn(`[ThreeWayMatch] Discrepancies detected for PO ${po.id}`, discrepancies);
            
            // Émission asynchrone d'un événement d'anomalie
            await NexusEventBus.emitDurable('procurement.mismatch_detected', {
                v: 1,
                tenantId,
                purchaseOrderId: po.id,
                invoiceId: invoice.id,
                discrepancies
            }).catch(e => logger.error('[ThreeWayMatch] Failed to emit mismatch event', e));
        }

        return {
            isValid,
            discrepancies,
            matchType: '3-way'
        };
    }
}
