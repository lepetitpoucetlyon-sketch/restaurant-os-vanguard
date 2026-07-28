import { logger } from '@/lib/logger';
import { LLMManager } from '@/modules/intelligence/ai';
import { NexusTelemetryService } from '@/shared/nexus/telemetry/NexusTelemetryService';
import { AuditPulseType } from '@/shared/nexus/telemetry/types';
import {
    ExtractedSupplierInvoiceSchema,
    InvoiceExtractionErrorSchema,
    type ExtractedSupplierInvoice,
    type InvoiceExtractionError,
    type InvoiceLineItem,
    type InvoiceFlag,
} from '@/domain/schemas/supplier-invoice.schemas';
import {
    INVOICE_EXTRACTION_SYSTEM_PROMPT,
    PRICE_REFERENCE_TABLE,
} from '@/config/prompts/invoice-extraction.prompt';

// ─── Types ──────────────────────────────────────────────────────────────────────

export type InvoiceExtractionResult =
    | { success: true;  data: ExtractedSupplierInvoice; rawResponse: string }
    | { success: false; error: InvoiceExtractionError | { error: string; reason: string; flags: string[] }; rawResponse: string };

export interface InvoiceExtractionOptions {
    model?: 'flash' | 'pro';
    tenantId?: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────────

import { AI_MODELS } from '@/modules/intelligence/ai';

const MODELS = {
    flash: AI_MODELS.visionFast,
    pro: AI_MODELS.visionPro,
} as const;

// Cross-validation tolerance (±2 centimes)
const TOLERANCE_CENTS = 2;

// ─── Service ────────────────────────────────────────────────────────────────────

/**
 * 🏛️ InvoiceExtractionService — Grade X
 *
 * Production pipeline: Image → Gemini Vision → JSON → Zod → Post-validation
 * Single responsibility: extract structured invoice data from a document image.
 */
export const InvoiceExtractionService = {

    /**
     * Main entry point: extract structured invoice data from a base64 image.
     */
    async extractFromImage(
        base64Image: string,
        options: InvoiceExtractionOptions = {}
    ): Promise<InvoiceExtractionResult> {
        const { model = 'flash', tenantId = 'system' } = options;
        const modelId = MODELS[model];
        const startTime = Date.now();

        logger.info(`[InvoiceExtraction] Starting extraction with ${modelId} for tenant ${tenantId}`);

        let rawResponse = '';

        try {
            // 1. Call LLM Vision API
            rawResponse = await this.callVisionAPI(base64Image, modelId);

            // 2. Parse JSON from response (handle markdown-wrapped JSON)
            const parsed = this.extractJsonFromResponse(rawResponse);

            // 3. Try NON_PROCESSABLE first (it's the simpler schema)
            const errorResult = InvoiceExtractionErrorSchema.safeParse(parsed);
            if (errorResult.success) {
                logger.warn(`[InvoiceExtraction] Document non-processable: ${errorResult.data.reason}`);
                return { success: false, error: errorResult.data, rawResponse };
            }

            // 4. Validate with full schema
            const invoiceResult = ExtractedSupplierInvoiceSchema.safeParse(parsed);
            if (!invoiceResult.success) {
                const zodErrors = invoiceResult.error.issues
                    .map(i => `${i.path.join('.')}: ${i.message}`)
                    .join('; ');
                logger.error(`[InvoiceExtraction] Zod validation failed: ${zodErrors}`);

                // If flash failed and we haven't tried pro yet, retry with pro
                if (model === 'flash') {
                    logger.info('[InvoiceExtraction] Retrying with gemini-2.0-pro...');
                    return this.extractFromImage(base64Image, { ...options, model: 'pro' });
                }

                return {
                    success: false,
                    error: { error: 'NON_PROCESSABLE', reason: `Schema validation failed: ${zodErrors}`, flags: ['MISSING_DATA'] },
                    rawResponse,
                };
            }

            // 5. Post-validation: price anomaly re-check & cross-validation
            const invoice = this.postValidate(invoiceResult.data);

            const duration = Date.now() - startTime;
            logger.info(`[InvoiceExtraction] ✅ Extraction complete in ${duration}ms — ${invoice.line_items.length} lines, confidence: ${invoice.confidence.overall}`);

            // 6. Telemetry
            this.emitTelemetry(invoice, tenantId, duration);

            return { success: true, data: invoice, rawResponse };

        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            logger.error(`[InvoiceExtraction] Pipeline error: ${errorMsg}`);
            return {
                success: false,
                error: { error: 'NON_PROCESSABLE', reason: errorMsg, flags: [] },
                rawResponse,
            };
        }
    },

    // ─── Internal: LLM Vision API Call ──────────────────────────────────────────

    async callVisionAPI(base64Image: string, modelId: string): Promise<string> {
        const imageData = base64Image.includes(',')
            ? base64Image.split(',')[1]
            : base64Image;

        const response = await LLMManager.provider.generateFromImage({
            model: modelId,
            systemPrompt: INVOICE_EXTRACTION_SYSTEM_PROMPT,
            userPrompt: 'Extract this supplier invoice. Return JSON only.',
            image: { base64: imageData, mimeType: 'image/jpeg' },
            temperature: 0.1,
            maxTokens: 8192,
            responseMimeType: 'application/json',
        });

        return response.text;
    },

    // ─── Internal: JSON Extraction ──────────────────────────────────────────────

    extractJsonFromResponse(rawText: string): unknown {
        let cleaned = rawText.trim();

        // Strip markdown code fences if present
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
        }

        try {
            return JSON.parse(cleaned);
        } catch {
            // Try to find JSON object in the response
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('No valid JSON found in Gemini response');
        }
    },

    // ─── Internal: Post-validation ──────────────────────────────────────────────

    postValidate(invoice: ExtractedSupplierInvoice): ExtractedSupplierInvoice {
        const flags = new Set<InvoiceFlag>(invoice.flags);
        const lineItems = invoice.line_items.map(line => ({ ...line }));

        // 1. Price anomaly re-check
        for (const line of lineItems) {
            const anomaly = this.checkPriceAnomaly(line);
            if (anomaly && !line.price_anomaly) {
                line.price_anomaly = true;
                flags.add('PRICE_ANOMALY');
            }
        }

        // 2. Cross-validation: Σ line totals vs declared totals
        const sumExclTax = lineItems.reduce((acc, l) => acc + l.line_total_excl_tax_cents, 0);
        const sumTax = lineItems.reduce((acc, l) => acc + l.line_tax_cents, 0);
        const declaredSubtotal = invoice.totals.subtotal_excl_tax_cents;
        const declaredTax = invoice.totals.total_tax_cents;
        const declaredTotal = invoice.totals.total_incl_tax_cents;

        const linesTotalMatch = Math.abs(sumExclTax - declaredSubtotal) <= TOLERANCE_CENTS;
        const taxMatch = Math.abs(sumTax - declaredTax) <= TOLERANCE_CENTS;
        const totalMatch = Math.abs((declaredSubtotal + declaredTax) - declaredTotal) <= TOLERANCE_CENTS;

        const validationPassed = linesTotalMatch && taxMatch && totalMatch;

        if (!validationPassed) {
            flags.add('TAX_MISMATCH');
        }

        return {
            ...invoice,
            line_items: lineItems,
            flags: Array.from(flags),
            validation: {
                passed: validationPassed,
                lines_total_matches_subtotal: linesTotalMatch,
                tax_calculation_consistent: taxMatch && totalMatch,
            },
        };
    },

    /**
     * Check a line item against the price reference table.
     * Returns true if the price is outside the expected range.
     */
    checkPriceAnomaly(line: InvoiceLineItem): boolean {
        const label = (line.canonical_name ?? line.raw_label).toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        for (const ref of PRICE_REFERENCE_TABLE) {
            // Check if at least 2 keywords match (prevents false positives)
            const matchCount = ref.keywords.filter(kw => label.includes(kw)).length;
            if (matchCount < 2 && ref.keywords.length > 1) continue;
            if (matchCount < 1) continue;

            // Unit must match
            if (line.unit !== ref.unit) continue;

            // Check range
            if (line.unit_price_cents < ref.min_cents || line.unit_price_cents > ref.max_cents) {
                return true;
            }
        }

        return false;
    },

    // ─── Internal: Telemetry ────────────────────────────────────────────────────

    async emitTelemetry(
        invoice: ExtractedSupplierInvoice,
        tenantId: string,
        durationMs: number
    ): Promise<void> {
        try {
            await NexusTelemetryService.emit({
                pulse: AuditPulseType.STORAGE_WRITE,
                vassalId: tenantId,
                actorId: 'invoice-extraction-agent',
                payload: {
                    operation: 'INVOICE_EXTRACTION',
                    supplier: invoice.invoice_metadata.supplier.name,
                    lineCount: invoice.line_items.length,
                    confidence: invoice.confidence.overall,
                    flags: invoice.flags,
                    durationMs,
                    totalInclTaxCents: invoice.totals.total_incl_tax_cents,
                },
                severity: invoice.flags.includes('PRICE_ANOMALY') ? 'WARNING' : 'INFO',
                timestamp: new Date().toISOString(),
            });
        } catch {
            // Telemetry failure should never block extraction
        }
    },
};
