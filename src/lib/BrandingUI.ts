import type { ThemeSettings, BrandInput } from '@nexus/contracts';

/**
 * BRANDING UI SERVICE (Grade X)
 * Pure mathematical logic for theme generation.
 * Guaranteed Client-Side Safe (Zero Node dependencies).
 */
export const BrandingUI = {
    /**
     * Nexus Theme Generator
     * Maps Brand Input into professional Theme Design Tokens.
     */
    generateThemeFromBrand(input: BrandInput): ThemeSettings {
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
