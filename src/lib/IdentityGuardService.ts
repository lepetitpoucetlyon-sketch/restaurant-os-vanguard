import { logger } from '@/lib/logger';
 
import { LLMManager } from '@/modules/intelligence';
import {
    IdentityExtractionSchema,
    ComplianceExtractionErrorSchema,
    type IdentityExtraction,
    type ComplianceExtractionError
} from '@/domain/schemas/compliance.schemas';
import { IDENTITY_GUARD_SYSTEM_PROMPT } from '@/config/prompts/compliance.prompt';
 
import { AI_MODELS } from '@/modules/intelligence';
import { toError } from "@/lib/toError";

export type IdentityExtractionResult =
    | { success: true; data: IdentityExtraction; rawResponse: string }
    | { success: false; error: ComplianceExtractionError | { error: string; reason: string; flags: string[] }; rawResponse: string };

const getModelId = () => AI_MODELS.fast;

export const IdentityGuardService = {
    /**
     * Performs a GDPR/PII compliance scan on a document image.
     */
    async scanDocument(
        base64Image: string, 
        options: { tenantId: string; trustedContext: boolean }
    ): Promise<IdentityExtractionResult> {
        const { tenantId, trustedContext } = options;

        logger.info(`[IdentityGuard] Scanning document for tenant ${tenantId} (Trusted: ${trustedContext})`);

        try {
            const rawResponse = await this.callVisionAPI(base64Image, trustedContext);
            const parsed = this.extractJson(rawResponse);

            // 1. Error check
            const errorParse = ComplianceExtractionErrorSchema.safeParse(parsed);
            if (errorParse.success) {
                return { success: false, error: errorParse.data, rawResponse };
            }

            // 2. Data check
            const dataParse = IdentityExtractionSchema.safeParse(parsed);
            if (!dataParse.success) {
                logger.error('[IdentityGuard] Schema validation failed', dataParse.error);
                return { 
                    success: false, 
                    error: { error: 'NON_PROCESSABLE', reason: 'Invalid JSON Schema', flags: [] },
                    rawResponse 
                };
            }

            return { success: true, data: dataParse.data, rawResponse };
        } catch (err) {
            logger.error('[IdentityGuard] Execution failed', { error: toError(err).message });
            return { 
                success: false, 
                error: { error: 'NON_PROCESSABLE', reason: toError(err).message, flags: [] },
                rawResponse: '' 
            };
        }
    },

    async callVisionAPI(base64: string, trusted: boolean): Promise<string> {
        const imageData = base64.includes(',') ? base64.split(',')[1] : base64;

        const contextInstruction = trusted
            ? "\nCONTEXTE : TRUSTED_SECURE_VASSAL. Vous pouvez extraire les raw_values."
            : "\nCONTEXTE : UNTRUSTED_OUTSIDE_VASSAL. raw_value doit être NULL pour tout Tier 4.";

        const response = await LLMManager.provider.generateFromImage({
            model: getModelId(),
            systemPrompt: IDENTITY_GUARD_SYSTEM_PROMPT + contextInstruction,
            userPrompt: "Analyze this document for GDPR compliance. Return JSON only.",
            image: { base64: imageData, mimeType: 'image/jpeg' },
            temperature: 0.1,
            responseMimeType: 'application/json',
        });

        return response.text;
    },

    extractJson(text: string): unknown {
        try {
            const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleaned);
        } catch {
            throw new Error('Failed to parse JSON from AI response');
        }
    }
};
