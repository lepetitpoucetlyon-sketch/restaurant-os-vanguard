import { z } from 'zod';

// ─── Enums ──────────────────────────────────────────────────────────────────────

export const KnownSupplierIdEnum = z.enum([
    'TRANSGOURMET', 'METRO', 'POMONA', 'PASSIONFROID',
    'BRAKE', 'PROMOCASH', 'MAYRAND', 'EPISAVEURS',
    'THIRIET', 'DAVIGEL', 'ALFECA', 'OTHER'
]);

export const DocumentTypeEnum = z.enum([
    'INVOICE', 'CREDIT_NOTE', 'DELIVERY_NOTE', 'PRO_FORMA'
]);

export const MeasureUnitEnum = z.enum(['KG', 'L', 'UNIT', 'PACK']);

export const ProductCategoryEnum = z.enum([
    'BOISSON_ALCOOLISEE', 'BOISSON_NON_ALCOOLISEE',
    'ALIMENTAIRE_BASE', 'TRAITEUR_RESTAURATION',
    'EMBALLAGE', 'MATERIEL', 'PRODUIT_ENTRETIEN', 'OTHER'
]);

export const TvaRateEnum = z.union([z.literal(5.5), z.literal(10), z.literal(20)]);

export const ConfidenceLevelEnum = z.enum(['HIGH', 'MEDIUM', 'LOW']);
export const ImageQualityEnum = z.enum(['CLEAR', 'DEGRADED', 'ILLEGIBLE']);

export const InvoiceFlagEnum = z.enum([
    'PRICE_ANOMALY',
    'AMBIGUOUS_LABEL',
    'TAX_RATE_INFERRED',
    'ILLEGIBLE_FIELD',
    'MISSING_DATA',
    'TAX_MISMATCH',
    'CREDIT_NOTE_DETECTED',
    'MULTIPAGE_DOCUMENT',
    'GLOBAL_DISCOUNT_APPLIED'
]);

// ─── Sub-schemas ────────────────────────────────────────────────────────────────

export const SupplierSchema = z.object({
    name: z.string(),
    siret: z.string().nullable(),
    tva_intracom: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    known_supplier_id: KnownSupplierIdEnum.nullable().optional(),
});

export const BuyerSchema = z.object({
    name: z.string().nullable(),
    siret: z.string().nullable().optional(),
    client_account_number: z.string().nullable().optional(),
});

export const InvoiceMetadataSchema = z.object({
    invoice_number: z.string().nullable(),
    date: z.string().nullable(),  // YYYY-MM-DD
    due_date: z.string().nullable().optional(),
    delivery_date: z.string().nullable().optional(),
    purchase_order_ref: z.string().nullable().optional(),
    supplier: SupplierSchema,
    buyer: BuyerSchema.optional(),
    currency: z.literal('EUR'),
    document_type: DocumentTypeEnum,
    payment_terms: z.string().nullable().optional(),
    multipage_complete: z.boolean().optional().default(true),
    notes: z.string().nullable().optional(),
});

export const InvoiceLineItemSchema = z.object({
    line_number: z.number().int(),
    raw_label: z.string(),
    canonical_name: z.string().nullable(),
    product_category: ProductCategoryEnum.optional().default('OTHER'),
    supplier_product_code: z.string().nullable().optional(),
    quantity: z.number(),
    unit: MeasureUnitEnum,
    unit_price_cents: z.number().int(),
    original_unit_price_cents: z.number().int().nullable().optional(),
    discount_percent: z.number().nullable().optional(),
    tax_rate_percent: TvaRateEnum,
    tax_rate_inferred: z.boolean(),
    line_total_excl_tax_cents: z.number().int(),
    line_tax_cents: z.number().int(),
    line_total_incl_tax_cents: z.number().int(),
    price_anomaly: z.boolean().optional().default(false),
});

export const TaxBreakdownItemSchema = z.object({
    rate_percent: TvaRateEnum,
    base_cents: z.number().int(),
    tax_cents: z.number().int(),
});

export const InvoiceTotalsSchema = z.object({
    subtotal_excl_tax_cents: z.number().int(),
    total_discount_cents: z.number().int().nullable().optional(),
    total_tax_cents: z.number().int(),
    total_incl_tax_cents: z.number().int(),
    tax_breakdown: z.array(TaxBreakdownItemSchema),
});

export const InvoiceValidationSchema = z.object({
    passed: z.boolean(),
    lines_total_matches_subtotal: z.boolean(),
    tax_calculation_consistent: z.boolean(),
});

export const InvoiceConfidenceSchema = z.object({
    overall: ConfidenceLevelEnum,
    image_quality: ImageQualityEnum,
    extraction_coverage_percent: z.number().int().min(0).max(100).optional(),
});

// ─── Top-level schemas ──────────────────────────────────────────────────────────

export const ExtractedSupplierInvoiceSchema = z.object({
    invoice_metadata: InvoiceMetadataSchema,
    line_items: z.array(InvoiceLineItemSchema),
    totals: InvoiceTotalsSchema,
    validation: InvoiceValidationSchema.optional(),
    confidence: InvoiceConfidenceSchema,
    flags: z.array(InvoiceFlagEnum),
});

export const InvoiceExtractionErrorSchema = z.object({
    error: z.literal('NON_PROCESSABLE'),
    reason: z.string(),
    flags: z.array(InvoiceFlagEnum),
});

// ─── Inferred Types ─────────────────────────────────────────────────────────────

export type KnownSupplierId = z.infer<typeof KnownSupplierIdEnum>;
export type DocumentType = z.infer<typeof DocumentTypeEnum>;
export type MeasureUnit = z.infer<typeof MeasureUnitEnum>;
export type ProductCategory = z.infer<typeof ProductCategoryEnum>;
export type TvaRate = z.infer<typeof TvaRateEnum>;
export type InvoiceFlag = z.infer<typeof InvoiceFlagEnum>;

export type SupplierInfo = z.infer<typeof SupplierSchema>;
export type BuyerInfo = z.infer<typeof BuyerSchema>;
export type InvoiceMetadata = z.infer<typeof InvoiceMetadataSchema>;
export type InvoiceLineItem = z.infer<typeof InvoiceLineItemSchema>;
export type TaxBreakdownItem = z.infer<typeof TaxBreakdownItemSchema>;
export type InvoiceTotals = z.infer<typeof InvoiceTotalsSchema>;
export type InvoiceValidation = z.infer<typeof InvoiceValidationSchema>;
export type InvoiceConfidence = z.infer<typeof InvoiceConfidenceSchema>;

export type ExtractedSupplierInvoice = z.infer<typeof ExtractedSupplierInvoiceSchema>;
export type InvoiceExtractionError = z.infer<typeof InvoiceExtractionErrorSchema>;

// ─── Legacy Aliases (backward compat with VisionService) ────────────────────────

/** @deprecated Use InvoiceLineItem instead */
export type ExtractedInvoiceItem = {
    name: string;
    quantity: number;
    unit: string;
    unitPriceHT: number;
    totalHT: number;
    taxRate?: number;
    expirationDate?: string;
    batchNumber?: string;
};

/** @deprecated Use ExtractedSupplierInvoice instead */
export type ExtractedInvoiceLegacy = {
    supplierName: string;
    invoiceNumber: string;
    date: string;
    currency: string;
    totalHT: number;
    totalTTC: number;
    items: ExtractedInvoiceItem[];
};

/**
 * Converts the new schema output to the legacy format used by
 * InvoiceReviewModal and InventoryVisionService.
 */
export function toLegacyInvoice(invoice: ExtractedSupplierInvoice): ExtractedInvoiceLegacy {
    return {
        supplierName: invoice.invoice_metadata.supplier.name,
        invoiceNumber: invoice.invoice_metadata.invoice_number ?? `EXT-${Date.now()}`,
        date: invoice.invoice_metadata.date ?? new Date().toISOString().split('T')[0],
        currency: invoice.invoice_metadata.currency,
        totalHT: invoice.totals.subtotal_excl_tax_cents / 100,
        totalTTC: invoice.totals.total_incl_tax_cents / 100,
        items: invoice.line_items.map(line => ({
            name: line.canonical_name ?? line.raw_label,
            quantity: line.quantity,
            unit: line.unit,
            unitPriceHT: line.unit_price_cents / 100,
            totalHT: line.line_total_excl_tax_cents / 100,
            taxRate: line.tax_rate_percent,
        })),
    };
}
