import 'server-only';
import { ThemeSettings } from '@nexus/contracts';
import { logger } from '@/lib/axiom';
 
import { LLMManager } from '@/modules/intelligence';

/**
 * BRANDING SERVICE (Phase 33 - Nexus Industrialization)
 * The engine responsible for 'Putting his Sauce' (Mettre à sa sauce).
 * Orchestrates the conversion of a brand identity into professional Design Tokens.
 */

export interface BrandInput {
    name: string;
    primaryColor?: string;
    logoUrl?: string;
    atmosphere?: 'luxury' | 'bistro' | 'fast-food' | 'zen' | 'modern';
}

export const BrandingService = {

    /**
     * AI-Driven Identity Extraction (Nexus Vision)
     * Analyzes a website screenshot to extract branding intent.
     */
    extractFromUrl: async (url: string): Promise<BrandInput> => {
        // Ensure this ONLY runs on the server side (avoiding playwright leak)
        if (typeof window !== 'undefined') {
            throw new Error('[Nexus Branding] Security breach: URL extraction can only be triggered from server context.');
        }

        logger.info(`[Nexus Branding] Initiating AI Extraction for: ${url}`);
        
        try {
            const { VisualIdentityExtractor } = await import('@modules/intelligence/services/VisualIdentityExtractor');

            const base64Image = await VisualIdentityExtractor.captureUrl(url);

             
            const { AI_MODELS } = await import('@/modules/intelligence/ia/ai');
            const response = await LLMManager.provider.generateFromImage({
                model: AI_MODELS.fast,
                systemPrompt: 'You are a Senior Art Director.',
                userPrompt: `Analyze this website screenshot and extract the Brand Identity.
                Return ONLY a JSON object with this structure:
                {
                    "name": "Brand Name",
                    "primaryColor": "Hex Code",
                    "atmosphere": "luxury" | "bistro" | "fast-food" | "modern",
                    "fontVibe": "serif" | "sans-serif"
                }`,
                image: { base64: base64Image, mimeType: 'image/jpeg' },
                responseMimeType: 'application/json',
            });

            const cleanJson = response.text.replace(/```json|```/g, '').trim();
            const data = JSON.parse(cleanJson);

            logger.info(`[Nexus Branding] AI Analysis Success:`, { data });

            return {
                name: data.name,
                primaryColor: data.primaryColor,
                atmosphere: data.atmosphere as BrandInput['atmosphere'],
            };
        } catch (error: unknown) {
            logger.error(`[Nexus Branding] AI Extraction failed:`, { error: String(error) });
            // Fallback to minimal branding
            return {
                name: "New Partner",
                primaryColor: "#C5A059",
                atmosphere: 'modern',
            };
        }
    },

    /**
     * Nexus Theme Generator
     * Maps Brand Input into professional Theme Design Tokens.
     */
    generateThemeFromBrand: (input: BrandInput): ThemeSettings => {
        const primary = input.primaryColor || "#C5A059";

        return {
            mode: 'dark',
            primaryColor: primary,
            secondaryColor: primary,
            backgroundColor: '#0A0A0A',
            textColor: '#FFFFFF',
            fontPrimary: 'Geist Sans',
            fontHeadings: input.atmosphere === 'luxury' || input.atmosphere === 'bistro' ? 'serif' : 'Geist Sans',
            borderRadius: 'large',
            buttonStyle: 'flat',
            animationsEnabled: true
        };
    }
};
