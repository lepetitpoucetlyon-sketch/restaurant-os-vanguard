import { logger } from '@/lib/logger';
import { 
    IdentityExtractionSchema, 
    ComplianceExtractionErrorSchema, 
    type IdentityExtraction, 
    type ComplianceExtractionError 
} from '@/domain/schemas/compliance.schemas';
import { IDENTITY_GUARD_SYSTEM_PROMPT } from '@/config/prompts/compliance.prompt';

export type IdentityExtractionResult = 
    | { success: true; data: IdentityExtraction; rawResponse: string }
    | { success: false; error: ComplianceExtractionError | { error: string; reason: string; flags: string[] }; rawResponse: string };

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL_ID = 'gemini-1.5-flash'; // High speed for classification

export const IdentityGuardService = {
    /**
     * Performs a GDPR/PII compliance scan on a document image.
     */
    async scanDocument(
        base64Image: string, 
        options: { tenantId: string; trustedContext: boolean; apiKey?: string }
    ): Promise<IdentityExtractionResult> {
        const { tenantId, trustedContext, apiKey: providedKey } = options;
        const apiKey = providedKey || process.env.GEMINI_API_KEY || '';

        if (!apiKey) {
            return { 
                success: false, 
                error: { error: 'NON_PROCESSABLE', reason: 'Missing API Key', flags: [] },
                rawResponse: '' 
            };
        }

        logger.info(`[IdentityGuard] Scanning document for tenant ${tenantId} (Trusted: ${trustedContext})`);

        try {
            const rawResponse = await this.callGeminiVision(base64Image, apiKey, trustedContext);
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
        } catch (err: unknown) {
            logger.error('[IdentityGuard] Execution failed', err);
            return { 
                success: false, 
                error: { error: 'NON_PROCESSABLE', reason: err.message, flags: [] },
                rawResponse: '' 
            };
        }
    },

    async callGeminiVision(base64: string, key: string, trusted: boolean): Promise<string> {
        const imageData = base64.includes(',') ? base64.split(',')[1] : base64;
        const url = `${GEMINI_ENDPOINT}/${MODEL_ID}:generateContent?key=${key}`;

        const contextInstruction = trusted 
            ? "\nCONTEXTE : TRUSTED_SECURE_VASSAL. Vous pouvez extraire les raw_values."
            : "\nCONTEXTE : UNTRUSTED_OUTSIDE_VASSAL. raw_value doit être NULL pour tout Tier 4.";

        const body = {
            system_instruction: {
                parts: [{ text: IDENTITY_GUARD_SYSTEM_PROMPT + contextInstruction }]
            },
            contents: [{
                parts: [
                    { inline_data: { mime_type: 'image/jpeg', data: imageData } },
                    { text: "Analyze this document for GDPR compliance. Return JSON only." }
                ]
            }],
            generationConfig: {
                temperature: 0.1,
                responseMimeType: "application/json"
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`Gemini API Error: ${response.status}`);
        }

        const res = await response.json();
        return res?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    },

    extractJson(text: string): any {
        try {
            const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleaned);
        } catch {
            throw new Error('Failed to parse JSON from AI response');
        }
    }
};
