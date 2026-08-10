import { describe, it, expect } from 'vitest';
import {
    ExtractedSupplierInvoiceSchema,
    InvoiceExtractionErrorSchema,
    InvoiceLineItemSchema,
    toLegacyInvoice,
    type ExtractedSupplierInvoice,
} from '@/modules/finance';
import { InvoiceExtractionService } from '@/src/modules/logistics/services/InvoiceExtractionService';;

// ─── Fixtures ───────────────────────────────────────────────────────────────────

const VALID_LINE_ITEM = {
    line_number: 1,
    raw_label: 'ENT. BŒF CHAR.',
    canonical_name: 'ENTRECOTE_BOEUF_CHAROLAIS',
    product_category: 'ALIMENTAIRE_BASE' as const,
    supplier_product_code: 'ART-12345',
    quantity: 5.2,
    unit: 'KG' as const,
    unit_price_cents: 2800,
    original_unit_price_cents: null,
    discount_percent: null,
    tax_rate_percent: 5.5 as const,
    tax_rate_inferred: false,
    line_total_excl_tax_cents: 14560,
    line_tax_cents: 801,
    line_total_incl_tax_cents: 15361,
    price_anomaly: false,
};

const VALID_LINE_ITEM_2 = {
    line_number: 2,
    raw_label: 'HUILE OLIVE V.E.',
    canonical_name: 'HUILE_OLIVE_VIERGE_EXTRA',
    product_category: 'ALIMENTAIRE_BASE' as const,
    supplier_product_code: null,
    quantity: 3,
    unit: 'L' as const,
    unit_price_cents: 890,
    original_unit_price_cents: null,
    discount_percent: null,
    tax_rate_percent: 5.5 as const,
    tax_rate_inferred: true,
    line_total_excl_tax_cents: 2670,
    line_tax_cents: 147,
    line_total_incl_tax_cents: 2817,
    price_anomaly: false,
};

const VALID_INVOICE: ExtractedSupplierInvoice = {
    invoice_metadata: {
        invoice_number: 'FAC-2026-001234',
        date: '2026-05-06',
        due_date: '2026-06-06',
        delivery_date: '2026-05-05',
        purchase_order_ref: 'BC-2026-089',
        supplier: {
            name: 'Metro Lyon Corbas',
            siret: '39939392200045',
            tva_intracom: 'FR12399393922',
            address: '2 Rue du Commerce, 69960 Corbas',
            known_supplier_id: 'METRO',
        },
        buyer: {
            name: 'Le Petit Poucet',
            siret: '12345678900012',
            client_account_number: 'CLI-9876',
        },
        currency: 'EUR',
        document_type: 'INVOICE',
        payment_terms: '30 jours net',
        multipage_complete: true,
        notes: null,
    },
    line_items: [VALID_LINE_ITEM, VALID_LINE_ITEM_2],
    totals: {
        subtotal_excl_tax_cents: 17230,
        total_discount_cents: null,
        total_tax_cents: 948,
        total_incl_tax_cents: 18178,
        tax_breakdown: [
            { rate_percent: 5.5, base_cents: 17230, tax_cents: 948 },
        ],
    },
    validation: {
        passed: true,
        lines_total_matches_subtotal: true,
        tax_calculation_consistent: true,
    },
    confidence: {
        overall: 'HIGH',
        image_quality: 'CLEAR',
        extraction_coverage_percent: 100,
    },
    flags: ['TAX_RATE_INFERRED'],
};

// ─── Tests ──────────────────────────────────────────────────────────────────────

describe('🧾 Invoice Extraction Pipeline', () => {

    describe('Zod Schema Validation', () => {

        it('accepts a valid invoice', () => {
            const result = ExtractedSupplierInvoiceSchema.safeParse(VALID_INVOICE);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.line_items).toHaveLength(2);
                expect(result.data.invoice_metadata.supplier.known_supplier_id).toBe('METRO');
            }
        });

        it('accepts a valid single line item', () => {
            const result = InvoiceLineItemSchema.safeParse(VALID_LINE_ITEM);
            expect(result.success).toBe(true);
        });

        it('rejects a line item with invalid unit', () => {
            const bad = { ...VALID_LINE_ITEM, unit: 'GRAM' };
            const result = InvoiceLineItemSchema.safeParse(bad);
            expect(result.success).toBe(false);
        });

        it('rejects a line item with invalid tax rate', () => {
            const bad = { ...VALID_LINE_ITEM, tax_rate_percent: 7 };
            const result = InvoiceLineItemSchema.safeParse(bad);
            expect(result.success).toBe(false);
        });

        it('rejects a line item with missing raw_label', () => {
            const { raw_label, ...bad } = VALID_LINE_ITEM;
            const result = InvoiceLineItemSchema.safeParse(bad);
            expect(result.success).toBe(false);
        });

        it('accepts a NON_PROCESSABLE error response', () => {
            const errorPayload = {
                error: 'NON_PROCESSABLE' as const,
                reason: 'Document is a menu, not an invoice',
                flags: ['ILLEGIBLE_FIELD' as const],
            };
            const result = InvoiceExtractionErrorSchema.safeParse(errorPayload);
            expect(result.success).toBe(true);
        });

        it('rejects NON_PROCESSABLE with wrong error literal', () => {
            const bad = { error: 'UNKNOWN', reason: 'test', flags: [] };
            const result = InvoiceExtractionErrorSchema.safeParse(bad);
            expect(result.success).toBe(false);
        });

        it('accepts CREDIT_NOTE document type', () => {
            const creditNote = {
                ...VALID_INVOICE,
                invoice_metadata: {
                    ...VALID_INVOICE.invoice_metadata,
                    document_type: 'CREDIT_NOTE' as const,
                },
                flags: ['CREDIT_NOTE_DETECTED' as const],
            };
            const result = ExtractedSupplierInvoiceSchema.safeParse(creditNote);
            expect(result.success).toBe(true);
        });
    });

    describe('Price Anomaly Detection', () => {

        it('does NOT flag a price within range', () => {
            const normalLine = {
                ...VALID_LINE_ITEM,
                canonical_name: 'ENTRECOTE_BOEUF_CHAROLAIS',
                unit: 'KG' as const,
                unit_price_cents: 2800, // 28€/kg — within 15-45€/kg range
            };
            const result = InvoiceExtractionService.checkPriceAnomaly(normalLine);
            expect(result).toBe(false);
        });

        it('flags a price ABOVE range', () => {
            const expensiveBeef = {
                ...VALID_LINE_ITEM,
                canonical_name: 'ENTRECOTE_BOEUF_CHAROLAIS',
                unit: 'KG' as const,
                unit_price_cents: 9999, // 99.99€/kg — way above 45€/kg max
            };
            const result = InvoiceExtractionService.checkPriceAnomaly(expensiveBeef);
            expect(result).toBe(true);
        });

        it('flags a price BELOW range', () => {
            const cheapButter = {
                ...VALID_LINE_ITEM,
                canonical_name: 'BEURRE_82_MG',
                raw_label: 'BEURRE 82% MG',
                unit: 'KG' as const,
                unit_price_cents: 100, // 1€/kg — below 5€/kg min
            };
            const result = InvoiceExtractionService.checkPriceAnomaly(cheapButter);
            expect(result).toBe(true);
        });

        it('does NOT flag an unknown product', () => {
            const unknownProduct = {
                ...VALID_LINE_ITEM,
                canonical_name: 'SAFRAN_IRANIEN_PREMIUM',
                raw_label: 'SAFRAN IRAN PREM.',
                unit: 'KG' as const,
                unit_price_cents: 999999, // Expensive but not in our reference table
            };
            const result = InvoiceExtractionService.checkPriceAnomaly(unknownProduct);
            expect(result).toBe(false);
        });

        it('correctly handles huile d\'olive range', () => {
            const normalOil = {
                ...VALID_LINE_ITEM_2,
                canonical_name: 'HUILE_OLIVE_VIERGE_EXTRA',
                unit: 'L' as const,
                unit_price_cents: 890, // 8.90€/L — within 4-15€/L range
            };
            const result = InvoiceExtractionService.checkPriceAnomaly(normalOil);
            expect(result).toBe(false);
        });
    });

    describe('Cross-validation (Post-validation)', () => {

        it('passes when totals match line sums', () => {
            const validated = InvoiceExtractionService.postValidate(VALID_INVOICE);
            expect(validated.validation?.passed).toBe(true);
            expect(validated.validation?.lines_total_matches_subtotal).toBe(true);
            expect(validated.validation?.tax_calculation_consistent).toBe(true);
        });

        it('fails and flags TAX_MISMATCH when subtotal is wrong', () => {
            const badInvoice: ExtractedSupplierInvoice = {
                ...VALID_INVOICE,
                totals: {
                    ...VALID_INVOICE.totals,
                    subtotal_excl_tax_cents: 99999, // Intentionally wrong
                },
            };
            const validated = InvoiceExtractionService.postValidate(badInvoice);
            expect(validated.validation?.passed).toBe(false);
            expect(validated.flags).toContain('TAX_MISMATCH');
        });

        it('tolerates ±2 centimes rounding', () => {
            const roundedInvoice: ExtractedSupplierInvoice = {
                ...VALID_INVOICE,
                totals: {
                    ...VALID_INVOICE.totals,
                    // off by 1 centime from sum (14560 + 2670 = 17230 → declare 17231)
                    subtotal_excl_tax_cents: 17231,
                },
            };
            const validated = InvoiceExtractionService.postValidate(roundedInvoice);
            expect(validated.validation?.lines_total_matches_subtotal).toBe(true);
        });
    });

    describe('Legacy Bridge', () => {

        it('converts new schema to legacy ExtractedInvoice format', () => {
            const legacy = toLegacyInvoice(VALID_INVOICE);

            expect(legacy.supplierName).toBe('Metro Lyon Corbas');
            expect(legacy.invoiceNumber).toBe('FAC-2026-001234');
            expect(legacy.currency).toBe('EUR');
            expect(legacy.totalHT).toBe(172.30);
            expect(legacy.totalTTC).toBe(181.78);
            expect(legacy.items).toHaveLength(2);
            expect(legacy.items[0].name).toBe('ENTRECOTE_BOEUF_CHAROLAIS');
            expect(legacy.items[0].unitPriceHT).toBe(28.00);
            expect(legacy.items[0].unit).toBe('KG');
        });

        it('falls back to raw_label when canonical_name is null', () => {
            const invoiceNoCanonical: ExtractedSupplierInvoice = {
                ...VALID_INVOICE,
                line_items: [{
                    ...VALID_LINE_ITEM,
                    canonical_name: null,
                }],
            };
            const legacy = toLegacyInvoice(invoiceNoCanonical);
            expect(legacy.items[0].name).toBe('ENT. BŒF CHAR.');
        });
    });

    describe('JSON Response Parsing', () => {

        it('extracts JSON from clean response', () => {
            const raw = '{"error":"NON_PROCESSABLE","reason":"test","flags":[]}';
            const result = InvoiceExtractionService.extractJsonFromResponse(raw);
            expect(result).toEqual({ error: 'NON_PROCESSABLE', reason: 'test', flags: [] });
        });

        it('strips markdown code fences', () => {
            const raw = '```json\n{"error":"NON_PROCESSABLE","reason":"test","flags":[]}\n```';
            const result = InvoiceExtractionService.extractJsonFromResponse(raw);
            expect(result).toEqual({ error: 'NON_PROCESSABLE', reason: 'test', flags: [] });
        });

        it('finds JSON in surrounding text', () => {
            const raw = 'Here is the result:\n{"error":"NON_PROCESSABLE","reason":"test","flags":[]}\nDone.';
            const result = InvoiceExtractionService.extractJsonFromResponse(raw);
            expect(result).toEqual({ error: 'NON_PROCESSABLE', reason: 'test', flags: [] });
        });

        it('throws on no JSON found', () => {
            expect(() => {
                InvoiceExtractionService.extractJsonFromResponse('This is just plain text');
            }).toThrow('No valid JSON found');
        });
    });
});
