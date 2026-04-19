import { ThemeSettings } from '@/types/settings';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '@/lib/axiom';

/**
 * BRANDING SERVICE (Phase 33 - Nexus Industrialization)
 * The engine responsible for 'Putting his Sauce' (Mettre à sa sauce).
 * Orchestrates the conversion of a brand identity into professional Design Tokens.
 */

// Initialize Gemini with the secured API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
            // Dynamic import to isolate server-side dependencies like playwright
            const { VisualIdentityExtractor } = await import('./VisualIdentityExtractor');

            // 1. Capture the visual identity
            const base64Image = await VisualIdentityExtractor.captureUrl(url);

            // 2. Prepare Gemini Vision
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `
                You are a Senior Art Director. 
                Analyze this website screenshot and extract the Brand Identity.
                Return ONLY a JSON object with this structure:
                {
                    "name": "Brand Name",
                    "primaryColor": "Hex Code",
                    "atmosphere": "luxury" | "bistro" | "fast-food" | "modern",
                    "fontVibe": "serif" | "sans-serif"
                }
            `;

            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: base64Image,
                        mimeType: "image/jpeg"
                    }
                }
            ]);

            const response = await result.response;
            const text = response.text();
            
            // Clean the output (Gemini sometimes adds ```json blocks)
            const cleanJson = text.replace(/```json|```/g, '').trim();
            const data = JSON.parse(cleanJson);

            logger.info(`[Nexus Branding] AI Analysis Success:`, { data });

            return {
                name: data.name,
                primaryColor: data.primaryColor,
                atmosphere: data.atmosphere as BrandInput['atmosphere'],
            };
        } catch (error) {
            logger.error(`[Nexus Branding] AI Extraction failed:`, { error });
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
