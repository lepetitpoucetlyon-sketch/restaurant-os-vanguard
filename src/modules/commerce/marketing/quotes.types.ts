/**
 * QUOTES (DEVIS) TYPES
 */

export type QuoteStatus =
    | 'draft'           // Brouillon
    | 'pending_approval' // En attente validation interne
    | 'approved'        // Validé interne
    | 'sent'            // Envoyé au client
    | 'viewed'          // Consulté par le client
    | 'accepted'        // Accepté
    | 'rejected'        // Refusé
    | 'expired'         // Expiré
    | 'converted';      // Converti en facture

export const QUOTE_STATUS_CONFIG: Record<QuoteStatus, { label: string; color: string; bgColor: string }> = {
    draft: { label: 'Brouillon', color: 'text-secondary', bgColor: 'bg-surface-tertiary' },
    pending_approval: { label: 'En validation', color: 'text-status-warning', bgColor: 'bg-status-warning' },
    approved: { label: 'Validé', color: 'text-brand', bgColor: 'bg-action-primary' },
    sent: { label: 'Envoyé', color: 'text-purple-600', bgColor: 'bg-purple-100' },
    viewed: { label: 'Consulté', color: 'text-brand', bgColor: 'bg-action-primary' },
    accepted: { label: 'Accepté', color: 'text-status-success', bgColor: 'bg-status-success' },
    rejected: { label: 'Refusé', color: 'text-status-danger', bgColor: 'bg-status-danger' },
    expired: { label: 'Expiré', color: 'text-secondary', bgColor: 'bg-surface-tertiary' },
    converted: { label: 'Facturé', color: 'text-status-success', bgColor: 'bg-status-success' }
};

export type QuoteLineType = 'product' | 'service' | 'package' | 'custom' | 'discount';

export interface QuoteLine {
    id: string;
    position: number;

    type: QuoteLineType;

    // Référence
    referenceId?: string;
    referenceName?: string;
    sku?: string;

    // Description
    designation: string;
    description?: string;

    // Quantités
    quantity: number;
    unit: string;

    // Prix
    unitPriceHTInCents: number;
    discountPercent?: number;
    discountAmountInCents?: number;
    totalHTInCents: number;

    // TVA
    vatRate: number;  // 5.5, 10, 20
    vatAmountInCents: number;
    totalTTCInCents: number;

    // Options
    isOptional: boolean;
    isSelected: boolean; // Si optional, est-il sélectionné ?

    // Notes
    notes?: string;
}

export interface QuoteSection {
    id: string;
    title: string;
    position: number;
    lines: QuoteLine[];
    subtotalHTInCents: number;
}

export interface Quote {
    id: string;
    quoteNumber: string;  // DEV-2026-00001

    establishmentId: string;
    customer: Quote['crm']; // Alias added for Phase 11 UI Suture

    // Client
    crmId?: string;
    crm: {
        type: 'individual' | 'company';
        name: string;
        companyName?: string;
        siret?: string;
        vatNumber?: string;
        email: string;
        phone?: string;
        address: {
            street: string;
            city: string;
            postalCode: string;
            country: string;
        };
    };

    // Dates
    issueDate: string;
    validUntil: string;

    // Objet
    subject: string;
    introduction?: string;

    // Contenu
    sections: QuoteSection[];

    // Calculs
    totals: {
        totalHTInCents: number;
        totalDiscountInCents: number;
        totalVATInCents: number;
        vatBreakdown: { rate: number; baseInCents: number; amountInCents: number }[];
        totalTTCInCents: number;

        // Optionnels
        optionalTotalHTInCents: number;
        optionalTotalTTCInCents: number;
    };

    // Conditions
    conditions: {
        paymentTerms: string;
        depositPercent?: number;
        depositAmountInCents?: number;
        deliveryTerms?: string;
        warranty?: string;
        customTerms?: string[];
    };

    // Notes
    footer?: string;
    internalNotes?: string;

    // Statut
    status: QuoteStatus;

    // Workflow
    sentAt?: string;
    sentTo?: string;
    viewedAt?: string;
    acceptedAt?: string;
    rejectedAt?: string;
    rejectionReason?: string;
    convertedAt?: string;
    invoiceId?: string;

    // Lien événement
    eventId?: string;
    eventName?: string;

    // PDF
    pdfUrl?: string;
    signedPdfUrl?: string;

    // Signature
    signature?: {
        signed: boolean;
        signedAt?: string;
        signerName?: string;
        signatureData?: string;
        ipAddress?: string;
    };

    // Relances
    reminders: {
        sentAt: string;
        type: 'email' | 'sms';
        template: string;
    }[];

    // Métadonnées
    createdAt: string;
    createdBy: string;
    updatedAt: string;
    updatedBy?: string;

    version: number;
    previousVersionId?: string;
}

export interface QuoteTemplate {
    id: string;
    name: string;
    description?: string;
    sections: Omit<QuoteSection, 'id'>[];
    conditions: Quote['conditions'];
    introduction?: string;
    footer?: string;
    isDefault: boolean;
}
