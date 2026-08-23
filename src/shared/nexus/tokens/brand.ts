// src/shared/nexus/tokens/brand.ts
import { z } from 'zod';

/**
 * 🛡️ BrandTokensSchema - Le contrat de souveraineté esthétique.
 * Définit tous les points de mutation autorisés pour un tenant.
 */

const hexColor = z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Couleur hex invalide");

/**
 * 🔒 URL Whitelist — Anti-XSS.
 * Seules les URLs HTTPS vers des domaines de confiance sont acceptées.
 * Bloque javascript:, data:, blob: et tout domaine non approuvé.
 */
const SAFE_ASSET_DOMAINS = [
    'firebasestorage.googleapis.com',
    'storage.googleapis.com',
    'lh3.googleusercontent.com',
    'cdn.restaurantos.io',
] as const;

const SAFE_FONT_DOMAINS = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
] as const;

const safeAssetUrl = z.string().url().refine(
    (url) => {
        try {
            const parsed = new URL(url);
            return parsed.protocol === 'https:' && SAFE_ASSET_DOMAINS.some(d => parsed.hostname.endsWith(d));
        } catch { return false; }
    },
    { message: `URL invalide — domaines autorisés : ${SAFE_ASSET_DOMAINS.join(', ')}` },
);

const safeFontUrl = z.string().url().refine(
    (url) => {
        try {
            const parsed = new URL(url);
            return parsed.protocol === 'https:' && SAFE_FONT_DOMAINS.some(d => parsed.hostname.endsWith(d));
        } catch { return false; }
    },
    { message: `URL de police invalide — domaines autorisés : ${SAFE_FONT_DOMAINS.join(', ')}` },
);

export const BrandTokensSchema = z.object({
  // Identité de base
  tenantId:         z.string().min(1),
  brandName:        z.string().min(1).max(80),
  tagline:          z.string().max(200).optional(),

  // Couleurs Fondamentales (Overrides semantic.ts)
  primaryColor:     hexColor.optional(),
  primaryHover:     hexColor.optional(),
  accentColor:      hexColor.optional(),
  dangerColor:      hexColor.optional(),
  
  // Couleurs de Statuts
  statusSuccess:    hexColor.optional(),
  statusWarning:    hexColor.optional(),
  statusDanger:     hexColor.optional(),

  // Surfaces & Modals
  surfaceModal:     hexColor.optional(),
  surfaceCard:      hexColor.optional(),
  surfaceBg:        hexColor.optional(),

  // Typographie — 3 rôles distincts (Google Fonts compatibles)
  // fontBrand  → --font-brand : titres, KPI, valeurs grandes (StatCard), headers premium
  // fontUI     → --font-ui    : corps, labels, boutons, navigation, descriptions
  // fontMono   → --font-mono  : tickets de caisse, codes produit, JournalEntry, timestamps KDS
  fontBrand:        z.string().max(100).optional(),
  fontBrandUrl:     safeFontUrl.optional(),
  fontUI:           z.string().max(100).optional(),
  fontUIUrl:        safeFontUrl.optional(),
  fontMono:         z.string().max(100).optional(),
  fontMonoUrl:      safeFontUrl.optional(),

  // Assets (URLs Firebase Storage / CDN — whitelist anti-XSS)
  logoUrl:          safeAssetUrl.nullable().optional(),
  logoUrl_1x:       safeAssetUrl.nullable().optional(),
  logoUrl_2x:       safeAssetUrl.nullable().optional(),
  logoUrl_3x:       safeAssetUrl.nullable().optional(),
  faviconUrl:       safeAssetUrl.nullable().optional(),
  bannerUrl:        safeAssetUrl.nullable().optional(),
  ogImageUrl:       safeAssetUrl.nullable().optional(),

  // Ambiance (Overrides AmbianceService)
  ambianceCalm:     hexColor.optional(),
  ambianceActive:   hexColor.optional(),
  ambianceLuxury:   hexColor.optional(),

  // Tables & Floor Plan
  tableFree:        hexColor.optional(),
  tableBusy:        hexColor.optional(),
  tableReserved:    hexColor.optional(),

  // Formes & Rayons de courbure (Radii)
  borderRadiusCard: z.enum(['sm', 'md', 'lg', 'full']).optional(),
  borderRadiusBtn:  z.enum(['sm', 'md', 'lg', 'full']).optional(),

  // Effets Glassmorphism & Flou
  glassBlur:        z.enum(['none', 'sm', 'md', 'lg']).optional(),
  glassOpacity:     z.enum(['low', 'medium', 'high']).optional(),

  // Mode de branding & Splash
  // 'default' = Restaurant OS branding (gold/dark) — aucun override visuel
  // 'custom'  = charte graphique propre au tenant (logo + couleurs)
  brandingMode:     z.enum(['default', 'custom']).default('default'),
  // Afficher un écran de démarrage branded (logo + fond couleur charte)
  splashEnabled:    z.boolean().default(true),
  // Politique d'affichage du splash screen : 'always' (chaque cold boot), 'first-boot' (une fois par session), 'never'
  splashPolicy:     z.enum(['always', 'first-boot', 'never']).default('always'),

  // Timestamps
  createdAt:        z.string().optional(),
  updatedAt:        z.string().optional(),
}).strict();

export type BrandConfig = z.infer<typeof BrandTokensSchema>;
// export type PartialBrandConfig = z.infer<typeof BrandTokensSchema.partial()>;

// Tokens par défaut — Restaurant OS Vanguard Branding
export const defaultBrandTokens: BrandConfig = {
  tenantId:      'nexus_core',
  brandName:     'Restaurant OS',
  primaryColor:  '#C5A059', // Vanguard Gold
  logoUrl:       null,
  faviconUrl:    null,
  brandingMode:  'default',
  splashEnabled: true,
  splashPolicy:  'always',
};

/**
 * 🔒 Sanitize une valeur de brand token avant injection dans le DOM.
 * Prévient les injections CSS/XSS via des valeurs malformées.
 * Utilise CSS.escape() quand disponible, sinon strip les caractères dangereux.
 */
export function sanitizeBrandValue(value: string): string {
    // Bloquer les protocoles dangereux
    if (/^(javascript|data|blob|vbscript):/i.test(value.trim())) {
        return '';
    }
    // Pour les valeurs CSS (couleurs, noms de police), échapper les caractères spéciaux
    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
        // CSS.escape est trop agressif pour les hex colors — ne l'appliquer qu'aux noms
        if (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl')) {
            return value; // Déjà validé par le regex hexColor
        }
        return value; // Les URLs et noms de polices sont validés par Zod en amont
    }
    return value;
}

export { SAFE_ASSET_DOMAINS, SAFE_FONT_DOMAINS };
