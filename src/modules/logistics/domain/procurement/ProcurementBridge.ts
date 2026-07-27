import { SovereignLedger } from '@/modules/finance/services/SovereignLedger';
import { QuantumCrypto } from '@/infrastructure/services/QuantumCrypto';
import { PurchaseOrder, DeliveryNote } from './types';
import { NexusTelemetryService } from '@/domain/services/NexusTelemetryService';
import { DocumentVault } from '@/domain/shared/DocumentVault';

/**
 * 🏛️ ProcurementBridge - Grade X+++
 * Suture Logistique <-> Finance (Double écriture d'engagement et de dette)
 */
export class ProcurementBridge {
    /**
     * Etape 1 : Création du Bon de Commande -> Engagement Hors-Bilan
     */
    static async engagePurchaseOrder(po: PurchaseOrder, tenantId: string = 'global'): Promise<void> {
        if (po.status !== 'submitted') {
            throw new Error('PROCUREMENT_001: Only submitted orders can be engaged.');
        }

        // Création de l'engagement hors-bilan
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
    static async signDeliveryNote(deliveryNote: DeliveryNote, tenantId: string = 'global'): Promise<string> {
        if (deliveryNote.status !== 'pending') {
            throw new Error('PROCUREMENT_002: BL is not pending signature.');
        }

        // 1. Signature cryptographique NF525
        const payload = JSON.stringify(deliveryNote);
        const signatureHash = await QuantumCrypto.sign(payload);
        
        // 2. Archivage WORM
        await DocumentVault.archive(`BL_${deliveryNote.id}.json`, payload, {
            tenantId,
            type: 'DELIVERY_NOTE',
            signatureHash
        });

        // 3. Réaction Automatique : Contre-passation de l'engagement et création de la dette réelle
        await SovereignLedger.getInstance(tenantId).convertEngagementToDebt(deliveryNote.id, deliveryNote.totalAmountInCents);

        NexusTelemetryService.emitAuditPulse('LOGISTICS', 'DELIVERY_NOTE_SIGNED', {
            deliveryNoteId: deliveryNote.id,
            signatureHash
        });

        return signatureHash;
    }
}
