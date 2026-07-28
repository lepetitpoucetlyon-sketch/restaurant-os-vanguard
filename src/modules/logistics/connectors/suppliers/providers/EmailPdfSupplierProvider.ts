import type { ISupplierProvider, SupplierProduct, OrderItem, DeliveryNote } from '../types';
import { logger } from '@/lib/logger';

/**
 * Email PDF fournisseur — pipeline mutualisé avec InvoiceExtractionService.
 * Les bons de livraison arrivent par email → extraction Gemini Vision → DeliveryNote.
 * Pas de catalogue produit (saisie manuelle depuis l'app stock).
 */
export class EmailPdfSupplierProvider implements ISupplierProvider {
    readonly id = 'email_pdf';

    async fetchCatalog(_tenantId: string): Promise<SupplierProduct[]> {
        // Catalogue géré manuellement dans l'app stock — pas d'API fournisseur.
        return [];
    }

    async placeOrder(_items: OrderItem[]): Promise<string> {
        throw new Error('EmailPdfSupplierProvider ne supporte pas la commande automatique — utiliser le catalogue fournisseur natif');
    }

    async fetchDeliveryNotes(_since: Date): Promise<DeliveryNote[]> {
        // Traitées par InvoiceExtractionService via le pipeline email — retournées via Nexus
        logger.info('[EmailPdfSupplierProvider] fetchDeliveryNotes — traitement via InvoiceExtractionService');
        return [];
    }

    onWebhook(payload: unknown): DeliveryNote {
        return payload as DeliveryNote;
    }
}
