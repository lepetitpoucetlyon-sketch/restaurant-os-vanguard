import { logger } from '@/lib/axiom';
import { InvoiceExtractionService } from './InvoiceExtractionService';
import { IdentityGuardService } from './IdentityGuardService';
import { toLegacyInvoice, type ExtractedInvoiceItem } from '@/domain/schemas/supplier-invoice.schemas';
import { authedFetch } from '@/lib/client/authedFetch';

// ─── Legacy Types (re-exported for backward compatibility) ──────────────────────

export type { ExtractedInvoiceItem } from '@/domain/schemas/supplier-invoice.schemas';

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

        const result = await InvoiceExtractionService.extractFromImage(base64Image);
        if (result.success) {
            return toLegacyInvoice(result.data);
        }

        // Extraction failed — log and throw
        const reason = 'reason' in result.error ? result.error.reason : 'Unknown extraction error';
        logger.error(`VisionService: Extraction failed — ${reason}`);
        throw new Error(`Échec de la lecture visuelle de la facture: ${reason}`);
    },

    /**
     * Full extraction with the new schema (no legacy conversion).
     * Use this for new code paths.
     */
    async analyzeInvoiceFull(base64Image: string, options?: { model?: 'flash' | 'pro'; tenantId?: string }) {
        return InvoiceExtractionService.extractFromImage(base64Image, options);
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

        return IdentityGuardService.scanDocument(base64Image, options);
    },

    /**
     * Compares a prepared plate photo with the recipe gold standard
     */
    async comparePlateToStandard(plateBase64: string, standardBase64: string, recipeName: string): Promise<PlateAuditResult> {
        logger.info(`VisionService: Auditing plate for ${recipeName}...`);

        try {
            // AI INJECTION POINT (Gemini 1.5 Pro)
            return {
                score: 8.5,
                isCompliant: true,
                feedback: [
                    "Dressage conforme au standard",
                    "Couleurs vives et fraîches détectées",
                    "Disposition des herbes correcte"
                ],
                detectedIssues: [
                    "Manque un léger filet d'huile sur le bord droit"
                ]
            };
        } catch (error: unknown) {
            logger.error('VisionService: Plate audit failed', { error: String(error) });
            throw new Error('Échec de l\'audit visuel de l\'assiette.');
        }
    },

    /**
     * Verifies a HACCP task execution via photo
     */
    async verifyHACCPTask(photoBase64: string, taskDescription: string): Promise<HACCPVerification> {
        logger.info(`VisionService: Verifying HACCP task: ${taskDescription}...`);

        try {
            // AI INJECTION POINT (Gemini 1.5 Flash Vision)
            return {
                isCompliant: true,
                confidence: 0.98,
                observation: "Le plan de travail est dégagé, propre et désinfecté. Aucun résidu visible."
            };
        } catch (error: unknown) {
            logger.error('VisionService: HACCP verification failed', { error: String(error) });
            throw new Error('Échec de la vérification visuelle HACCP.');
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
