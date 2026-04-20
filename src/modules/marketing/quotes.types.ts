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
    draft: { label: 'Brouillon', color: 'text-slate-600', bgColor: 'bg-slate-100' },
    pending_approval: { label: 'En validation', color: 'text-amber-600', bgColor: 'bg-amber-100' },
    approved: { label: 'Validé', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    sent: { label: 'Envoyé', color: 'text-purple-600', bgColor: 'bg-purple-100' },
    viewed: { label: 'Consulté', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
    accepted: { label: 'Accepté', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
    rejected: { label: 'Refusé', color: 'text-red-600', bgColor: 'bg-red-100' },
    expired: { label: 'Expiré', color: 'text-slate-500', bgColor: 'bg-slate-100' },
    converted: { label: 'Facturé', color: 'text-green-600', bgColor: 'bg-green-100' }
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
