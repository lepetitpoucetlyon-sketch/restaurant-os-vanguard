import { QuantumCrypto } from '@/lib/QuantumCrypto';
import type { PurchaseOrder, DeliveryNote } from './types';
import { NexusTelemetryService } from '@/lib/NexusTelemetryService';
import { DocumentVault } from '@/lib/vault';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

/**
 * 🏛️ ProcurementBridge - Grade X+++
 * Suture Logistique <-> Finance (Double écriture d'engagement et de dette)
 */
export class ProcurementBridge {
    /**
     * Etape 1 : Création du Bon de Commande -> Engagement Hors-Bilan
     */
    static async engagePurchaseOrder(po: PurchaseOrder, tenantId: string): Promise<void> {
        if (!tenantId || tenantId === 'global') {
            throw new Error('PROCUREMENT_000: Valid tenantId is required for procurement operations.');
        }
        if (po.status !== 'submitted') {
            throw new Error('PROCUREMENT_001: Only submitted orders can be engaged.');
        }

        // Création de l'engagement hors-bilan
        const { SovereignLedger } = await import('@/modules/finance');
        await SovereignLedger.getInstance(tenantId).recordTransfer({
            debitAccount: 'ENGAGEMENT_DEBIT_800',
            creditAccount: 'ENGAGEMENT_CREDIT_801',
            amountInCents: po.totalAmountInCents,
            referenceId: `PO-${po.id}`,
            description: `Engagement pour BC #${po.id}`
        });

        NexusTelemetryService.emitAuditPulse('LOGISTICS', 'PO_ENGAGED', {
            poId: po.id,
            amountInCents: po.totalAmountInCents,
            tenantId
        });
    }

    /**
     * Etape 2 & 3 : Signature du BL -> Suture Financière Automatique
     */
    static async signDeliveryNote(deliveryNote: DeliveryNote, tenantId: string): Promise<string> {
        if (!tenantId || tenantId === 'global') {
            throw new Error('PROCUREMENT_000: Valid tenantId is required for procurement operations.');
        }
        if (deliveryNote.status !== 'pending') {
            throw new Error('PROCUREMENT_002: BL is not pending signature.');
        }

        // 1. Signature cryptographique NF525 déterministe
        const { CryptoService } = await import('@/lib/CryptoService');
        const payload = CryptoService.canonicalStringify(deliveryNote as unknown as import('@/shared/nexus-contract').SovereignData);
        const signatureHash = await QuantumCrypto.sign(payload);
        
        // 2. Archivage WORM
        await DocumentVault.archive(`BL_${deliveryNote.id}.json`, payload, {
            tenantId,
            type: 'DELIVERY_NOTE',
            signatureHash,
            sealAlgo: 'canonical-v1'
        });

        // 3. Réaction Automatique : Contre-passation de l'engagement et création de la dette réelle
        const { SovereignLedger } = await import('@/modules/finance');
        await SovereignLedger.getInstance(tenantId).convertEngagementToDebt(deliveryNote.id, deliveryNote.totalAmountInCents);

        // 4. Mise à jour du stock physique déléguée à l'événement stock.received (P1)
        await NexusEventBus.emitDurable('stock.received', {
            v: 1,
            tenantId,
            deliveryId: deliveryNote.id,
            items: (deliveryNote.deliveredItems || []).map((item: { productId: string; quantityDelivered: number }) => ({
                itemId: item.productId,
                quantity: item.quantityDelivered,
            })),
        });

        NexusTelemetryService.emitAuditPulse('LOGISTICS', 'DELIVERY_NOTE_SIGNED', {
            deliveryNoteId: deliveryNote.id,
            signatureHash
        });

        return signatureHash;
    }
}
