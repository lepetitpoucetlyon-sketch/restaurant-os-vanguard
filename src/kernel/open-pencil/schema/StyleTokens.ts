/**
 * 🎨 OpenPencil Style Tokens & Palette Bridge
 * Pont bidirectionnel entre les tokens de marque Restaurant OS et les styles OpenPencil
 */

import { ColorRGBA, Paint, TypographyStyle } from './PenDocument';

export const OPEN_PENCIL_DEFAULT_COLORS: Record<string, ColorRGBA> = {
    // Or impérial & Marque
    'brand.gold.primary': { r: 0.773, g: 0.627, b: 0.349, a: 1 }, // #C5A059
    'brand.gold.ink': { r: 0.431, g: 0.329, b: 0.149, a: 1 },     // #6E5426 (WCAG AA)
    'brand.gold.light': { r: 0.961, g: 0.902, b: 0.765, a: 1 },   // #F5E6C3
    'brand.gold.glow': { r: 0.773, g: 0.627, b: 0.349, a: 0.25 },

    // Neutres & Dark Luxury Glass
    'bg.primary': { r: 0.051, g: 0.051, b: 0.067, a: 1 },         // #0D0D11
    'bg.secondary': { r: 0.094, g: 0.094, b: 0.122, a: 1 },       // #18181F
    'bg.tertiary': { r: 0.141, g: 0.141, b: 0.180, a: 1 },        // #24242E
    'bg.glass': { r: 0.094, g: 0.094, b: 0.122, a: 0.75 },

    // Textes
    'text.primary': { r: 0.961, g: 0.961, b: 0.969, a: 1 },       // #F5F5F7
    'text.secondary': { r: 0.651, g: 0.651, b: 0.702, a: 1 },     // #A6A6B3
    'text.muted': { r: 0.451, g: 0.451, b: 0.502, a: 1 },         // #737380

    // Statuts Opérationnels
    'status.success': { r: 0.063, g: 0.725, b: 0.506, a: 1 },     // #10B981
    'status.warning': { r: 0.961, g: 0.620, b: 0.043, a: 1 },     // #F59E0B
    'status.danger': { r: 0.937, g: 0.267, b: 0.267, a: 1 },      // #EF4444
    'status.info': { r: 0.231, g: 0.510, b: 0.965, a: 1 },        // #3B82F6

    // Bordures
    'border.subtle': { r: 1, g: 1, b: 1, a: 0.08 },
    'border.gold': { r: 0.773, g: 0.627, b: 0.349, a: 0.4 },
};

export const OPEN_PENCIL_DEFAULT_TYPOGRAPHY: Record<string, TypographyStyle> = {
    h1: {
        fontFamily: 'Cormorant Garamond, serif',
        fontWeight: 700,
        fontSize: 36,
        lineHeight: 1.2,
        letterSpacing: -0.5,
    },
    h2: {
        fontFamily: 'Cormorant Garamond, serif',
        fontWeight: 600,
        fontSize: 28,
        lineHeight: 1.25,
        letterSpacing: -0.3,
    },
    h3: {
        fontFamily: 'Inter, sans-serif',
        fontWeight: 600,
        fontSize: 20,
        lineHeight: 1.3,
    },
    bodyLarge: {
        fontFamily: 'Inter, sans-serif',
        fontWeight: 400,
        fontSize: 16,
        lineHeight: 1.5,
    },
    bodyMedium: {
        fontFamily: 'Inter, sans-serif',
        fontWeight: 400,
        fontSize: 14,
        lineHeight: 1.4,
    },
    caption: {
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        fontSize: 12,
        lineHeight: 1.3,
        letterSpacing: 0.2,
    },
    badge: {
        fontFamily: 'Inter, sans-serif',
        fontWeight: 700,
        fontSize: 11,
        lineHeight: 1,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    monoNumber: {
        fontFamily: 'JetBrains Mono, monospace',
        fontWeight: 600,
        fontSize: 15,
        lineHeight: 1.2,
    },
};

/**
 * Convertit un ColorRGBA en chaîne hex ou rgba CSS
 */
export function rgbaToCss(color?: ColorRGBA): string {
    if (!color) return 'transparent';
    const r = Math.round(Math.max(0, Math.min(1, color.r)) * 255);
    const g = Math.round(Math.max(0, Math.min(1, color.g)) * 255);
    const b = Math.round(Math.max(0, Math.min(1, color.b)) * 255);
    const a = color.a ?? 1;
    if (a >= 0.999) {
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
}

/**
 * Convertit un code hex (#FFFFFF ou #FFF ou #FFFFFFFF) en ColorRGBA
 */
export function hexToRgba(hex: string, alpha = 1): ColorRGBA {
    let clean = hex.replace(/^#/, '');
    if (clean.length === 3) {
        clean = clean.split('').map(c => c + c).join('');
    }
    if (clean.length === 6) {
        const num = parseInt(clean, 16);
        return {
            r: ((num >> 16) & 255) / 255,
            g: ((num >> 8) & 255) / 255,
            b: (num & 255) / 255,
            a: alpha,
        };
    }
    if (clean.length === 8) {
        const num = parseInt(clean, 16);
        return {
            r: ((num >> 24) & 255) / 255,
            g: ((num >> 16) & 255) / 255,
            b: ((num >> 8) & 255) / 255,
            a: (num & 255) / 255,
        };
    }
    return { r: 1, g: 1, b: 1, a: alpha };
}

/**
 * Crée un Paint de type SOLID avec token optionnel
 */
export function createSolidPaint(tokenOrHex: string, alpha = 1): Paint {
    if (OPEN_PENCIL_DEFAULT_COLORS[tokenOrHex]) {
        return {
            type: 'SOLID',
            color: OPEN_PENCIL_DEFAULT_COLORS[tokenOrHex],
            tokenReference: `$${tokenOrHex}`,
            opacity: alpha,
        };
    }
    return {
        type: 'SOLID',
        color: hexToRgba(tokenOrHex, alpha),
        opacity: alpha,
    };
}
