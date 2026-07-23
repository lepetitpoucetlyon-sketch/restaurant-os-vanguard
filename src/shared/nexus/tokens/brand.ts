// src/shared/nexus/tokens/brand.ts
import { z } from 'zod';

/**
 * 🛡️ BrandTokensSchema - Le contrat de souveraineté esthétique.
 * Définit tous les points de mutation autorisés pour un tenant.
 */

const hexColor = z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Couleur hex invalide");

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

  // Typographie (Google Fonts compatibles)
  fontBrand:        z.string().max(100).optional(), 
  fontBrandUrl:     z.string().url().optional(),    
  fontUI:           z.string().max(100).optional(),

  // Assets (URLs Firebase Storage / CDN)
  logoUrl:          z.string().url().nullable().optional(),
  faviconUrl:       z.string().url().nullable().optional(),
  bannerUrl:        z.string().url().nullable().optional(),
  ogImageUrl:       z.string().url().nullable().optional(),

  // Ambiance (Overrides AmbianceService)
  ambianceCalm:     hexColor.optional(),
  ambianceActive:   hexColor.optional(),
  ambianceLuxury:   hexColor.optional(),

  // Tables & Floor Plan
  tableFree:        hexColor.optional(),
  tableBusy:        hexColor.optional(),
  tableReserved:    hexColor.optional(),

  // Timestamps
  createdAt:        z.string().optional(),
  updatedAt:        z.string().optional(),
}).strict();

export type BrandConfig = z.infer<typeof BrandTokensSchema>;
// export type PartialBrandConfig = z.infer<typeof BrandTokensSchema.partial()>;

// Tokens par défaut — Restaurant OS Vanguard Branding
export const defaultBrandTokens: BrandConfig = {
  tenantId:     'nexus_core',
  brandName:    'Restaurant OS',
  primaryColor: '#C5A059', // Vanguard Gold
  logoUrl:      null,
  faviconUrl:   null,
};
