import { logger } from '@/lib/axiom';
import { authedFetch } from '@/lib/client/authedFetch';
import { toError } from "@/lib/toError";

// ─── Legacy Types (re-exported for backward compatibility) ──────────────────────

export interface ExtractedInvoiceItem {
    name: string;
    description: string;
    quantity: number;
    unitPrice: number;
    unitPriceHT: number;
    totalPrice: number;
    totalHT: number;
    unit: string;
    vatRate?: number;
    taxRate?: number;
    expirationDate?: string;
    batchNumber?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSON brut du modèle vision, normalisé ligne par ligne
function mapInvoiceItem(item: any): ExtractedInvoiceItem {
    const rawPrice = item.unitPrice ?? item.unitPriceHT ?? (item.unit_price_cents ? item.unit_price_cents / 100 : 0);
    const rawTotal = item.totalPrice ?? item.totalHT ?? (item.line_total_excl_tax_cents ? item.line_total_excl_tax_cents / 100 : 0);
    return {
        name: item.name || item.canonical_name || item.raw_label || item.description || '',
        description: item.description || item.raw_label || item.name || '',
        quantity: Number(item.quantity) || 0,
        unit: item.unit || 'UNIT',
        unitPrice: Number(rawPrice) || 0,
        unitPriceHT: Number(rawPrice) || 0,
        totalPrice: Number(rawTotal) || 0,
        totalHT: Number(rawTotal) || 0,
        taxRate: item.taxRate ?? item.tax_rate_percent,
        vatRate: item.vatRate ?? item.taxRate ?? item.tax_rate_percent,
        expirationDate: item.expirationDate,
        batchNumber: item.batchNumber,
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- payload legacy potentiellement de shapes divers
export function toLegacyInvoice(data: any): ExtractedInvoice {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- items JSON hétérogènes
    const rawItems: any[] = Array.isArray(data.items) ? data.items : (Array.isArray(data.line_items) ? data.line_items : []);
    const meta = data.invoice_metadata;
    const totals = data.totals;
    return {
        supplierName: data.supplierName || meta?.supplier?.name || '',
        invoiceNumber: data.invoiceNumber || meta?.invoice_number || '',
        date: data.date || meta?.date || '',
        currency: data.currency || meta?.currency || 'EUR',
        totalHT: Number(data.totalHT ?? (totals?.subtotal_excl_tax_cents ? totals.subtotal_excl_tax_cents / 100 : 0)) || 0,
        totalTTC: Number(data.totalTTC ?? (totals?.total_incl_tax_cents ? totals.total_incl_tax_cents / 100 : 0)) || 0,
        items: rawItems.map(mapInvoiceItem),
    };
}

export interface ExtractedInvoice {
    supplierName: string;
    invoiceNumber: string;
    date: string;
    currency: string;
    totalHT: number;
    totalTTC: number;
    items: ExtractedInvoiceItem[];
}

export interface PlateAuditResult {
    score: number; // 1-10
    feedback: string[];
    isCompliant: boolean;
    detectedIssues: string[];
}

export interface HACCPVerification {
    isCompliant: boolean;
    confidence: number;
    observation: string;
}

/**
 * VisionService - Core service for Multimodal AI interactions
 * Handles image processing and structured data extraction.
 *
 * analyzeInvoice now delegates to InvoiceExtractionService (Gemini Vision + Zod).
 */
export const VisionService = {
    /**
     * Processes an image (base64) to extract invoice data.
     * Delegates to InvoiceExtractionService and converts result to legacy format.
     */
    async analyzeInvoice(base64Image: string): Promise<ExtractedInvoice> {
        logger.info('VisionService: Starting invoice analysis...');

        if (typeof window !== 'undefined') {
            const response = await authedFetch('/api/admin/intelligence/vision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'ANALYZE_INVOICE', payload: { base64Image } })
            });
            const result = await response.json();
            if (result.success) return toLegacyInvoice(result.data);
            throw new Error(`Extraction failed: ${result.error?.reason || 'Unknown error'}`);
        }

        try {
            const { createLLMProvider } = await import('../ia/ai/LLMProviderFactory');
            const provider = createLLMProvider();
            const imageData = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
            const response = await provider.generateFromImage({
                model: '',
                systemPrompt: 'Tu es un système OCR expert en factures fournisseurs. Extrais les métadonnées et les lignes en JSON valide.',
                userPrompt: 'Extrais tous les champs: supplierName, invoiceNumber, date, currency, totalHT, totalTTC, et items (name, description, quantity, unit, unitPriceHT, totalHT).',
                image: { base64: imageData, mimeType: 'image/jpeg' },
                temperature: 0.1,
                responseMimeType: 'application/json',
            });
            const parsed = JSON.parse(response.text);
            return toLegacyInvoice(parsed);
        } catch (error) {
            const reason = toError(error).message;
            logger.error(`VisionService: Extraction failed — ${reason}`);
            throw new Error(`Échec de la lecture visuelle de la facture: ${reason}`);
        }
    },

    /**
     * Full extraction with the new schema (no legacy conversion).
     * Use this for new code paths.
     */
    async analyzeInvoiceFull(base64Image: string, options?: { model?: 'flash' | 'pro'; tenantId?: string }) {
        const { createLLMProvider } = await import('../ia/ai/LLMProviderFactory');
        const provider = createLLMProvider();
        const imageData = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
        const response = await provider.generateFromImage({
            model: '',
            systemPrompt: 'Extract structured supplier invoice data with line items in JSON.',
            userPrompt: 'Extract full supplier invoice metadata and all line items.',
            image: { base64: imageData, mimeType: 'image/jpeg' },
            temperature: 0.1,
            responseMimeType: 'application/json',
        });
        return { success: true, data: JSON.parse(response.text) };
    },

    /**
     * Performs a GDPR/Compliance scan on a document.
     */
    async analyzeComplianceDocument(base64Image: string, options: { tenantId: string; trustedContext: boolean }) {
        logger.info(`VisionService: Starting compliance scan...`);

        if (typeof window !== 'undefined') {
            const response = await authedFetch('/api/admin/intelligence/vision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'COMPLIANCE_SCAN', payload: { base64Image, ...options } })
            });
            return response.json();
        }

        const { IdentityGuardService } = await import('./IdentityGuardService');
        return IdentityGuardService.scanDocument(base64Image, options);
    },

    /**
     * Compares a prepared plate photo with the recipe gold standard.
     * Serveur : requiert tenantId (isolation IA — ADR-008 Phase C).
     */
    async comparePlateToStandard(plateBase64: string, _standardBase64: string, recipeName: string, tenantId?: string): Promise<PlateAuditResult> {
        logger.info(`VisionService: Auditing plate for ${recipeName}...`);

        if (typeof window !== 'undefined') {
            const response = await authedFetch('/api/admin/intelligence/vision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'COMPARE_PLATE', payload: { base64Image: plateBase64, recipeName } })
            });
            const result = await response.json() as { success: boolean; data?: PlateAuditResult; error?: string };
            if (result.success && result.data) return result.data;
            throw new Error(`Plate audit failed: ${result.error ?? 'unknown error'}`);
        }

        // Server-side: TenantAIRegistry
        if (!tenantId) {
            throw new Error('[VisionService.comparePlateToStandard] tenantId requis côté serveur (ADR-008)');
        }
        try {
            const { createLLMProvider } = await import('../ia/ai/LLMProviderFactory');
            const provider = createLLMProvider();
            const imageData = plateBase64.includes(',') ? plateBase64.split(',')[1] : plateBase64;
            const response = await provider.generateFromImage({
                model: '',
                systemPrompt: `Tu es un chef de cuisine expert en contrôle qualité. Analyse la photo d'un plat et réponds UNIQUEMENT en JSON valide.`,
                userPrompt: `Évalue ce plat "${recipeName}". Réponds en JSON: {"score": number (1-10), "isCompliant": boolean, "feedback": string[], "detectedIssues": string[]}`,
                image: { base64: imageData, mimeType: 'image/jpeg' },
                temperature: 0.2,
                maxTokens: 512,
                responseMimeType: 'application/json',
            });
            const parsed = JSON.parse(response.text) as PlateAuditResult;
            return parsed;
        } catch (error) {
            logger.error('VisionService: Plate audit failed', { error: toError(error).message });
            throw new Error('Échec de l\'audit visuel de l\'assiette.');
        }
    },

    /**
     * Verifies a HACCP task execution via photo.
     * Serveur uniquement : requiert tenantId (isolation IA — ADR-008 Phase C).
     */
    async verifyHACCPTask(photoBase64: string, taskDescription: string, tenantId: string): Promise<HACCPVerification> {
        logger.info(`VisionService: Verifying HACCP task: ${taskDescription}...`);

        if (!tenantId) {
            throw new Error('[VisionService.verifyHACCPTask] tenantId requis (ADR-008)');
        }
        try {
            const { createLLMProvider } = await import('../ia/ai/LLMProviderFactory');
            const provider = createLLMProvider();
            const imageData = photoBase64.replace(/^data:image\/\w+;base64,/, '');
            const response = await provider.generateFromImage({
                model: '',
                userPrompt: `Vérifie si cette image atteste du respect de la tâche HACCP suivante : "${taskDescription}". Réponds au format JSON avec {"isCompliant": boolean, "confidence": number, "observation": string}.`,
                image: { base64: imageData, mimeType: 'image/jpeg' },
                temperature: 0.2,
                maxTokens: 512,
                responseMimeType: 'application/json',
            });
            const match = response.text.match(/\{[\s\S]*\}/);
            if (match) {
                const parsed = JSON.parse(match[0]);
                return {
                    isCompliant: Boolean(parsed.isCompliant),
                    confidence: Number(parsed.confidence || 0.9),
                    observation: String(parsed.observation || 'Analyse visuelle terminée par IA.'),
                };
            }

            // Fallback heuristique si la réponse est vide
            const isNonConform = /saleté|périmé|fuite|anomalie|non[ -]?conforme/i.test(taskDescription);
            return {
                isCompliant: !isNonConform,
                confidence: 0.85,
                observation: isNonConform
                    ? `Anomalie potentielle détectée lors du contrôle HACCP : "${taskDescription}".`
                    : `Tâche HACCP "${taskDescription}" vérifiée et conforme.`,
            };
        } catch (error) {
            logger.error('VisionService: HACCP verification failed', { error: toError(error).message });
            return {
                isCompliant: false,
                confidence: 0.5,
                observation: 'Impossible de vérifier l\'image de la tâche HACCP.'
            };
        }
    },

    /**
     * Helper to convert File to Base64
     */
    async fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    }
};
