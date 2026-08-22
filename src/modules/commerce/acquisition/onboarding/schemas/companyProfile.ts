/**
 * 🧬 CompanyProfile — sortie typée du CompanyScrapeAgent (Axe B).
 *
 * Contrat Zod strict entre :
 *  - `CompanyScrapeAgent.scrape(...)` (producteur : scrape web réel, cf. P0)
 *  - `QualificationEngine.inferAnswers(profile, study)` (consommateur : auto-inférence
 *    des 7 axes de la matrice, cf. P2)
 *  - `TenantSeeder.seed(...)` (consommateur : provisioning tenant avec branding réel)
 *
 * Toute donnée qui rentre dans le pipeline d'onboarding tenant doit d'abord être
 * validée contre ce schéma. Rien de ce qui provient du web n'est fait confiance
 * sans passer par un `parse()` Zod (frontière de sécurité).
 *
 * Règles :
 *  - Prix TOUJOURS en microunits (`Microunits`), jamais en cents ni euros.
 *  - Confidence RÉELLE ∈ [0,1] dérivée de la complétude des signaux — jamais une
 *    constante (le stub précédent renvoyait 0.94 en dur, cf. audit MEGA-PLAN).
 *  - `raw` conserve l'audit trail du crawl (URLs, warnings) pour traçabilité.
 */

import { z } from 'zod';

import { MicrounitsSchema } from '@/shared/schemas/primitives';
import { PlatformVariantSchema } from '@/modules/system';

// ── Sous-schémas ────────────────────────────────────────────────────────────────

/** Identité légale et de contact extraite du site (JSON-LD LocalBusiness, mentions légales). */
export const CompanyIdentitySchema = z.object({
    name: z.string().min(1, 'Nom d\'entreprise manquant'),
    legalName: z.string().optional(),
    /** SIREN 9 chiffres (extrait des mentions légales ou fourni). */
    siren: z.string().regex(/^\d{9}$/).optional(),
    address: z
        .object({
            street: z.string().optional(),
            postalCode: z.string().optional(),
            city: z.string().optional(),
            country: z.string().length(2).optional(),
        })
        .optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    /** Horaires en format simplifié : { monday: '09:00-19:00', … } ou schema.org OpeningHoursSpecification. */
    openingHours: z.record(z.string(), z.string()).optional(),
});
export type CompanyIdentity = z.infer<typeof CompanyIdentitySchema>;

/** Signaux extraits qui suggèrent (avec confidence) le PlatformVariant. */
export const SectorSignalsSchema = z.object({
    detectedVariant: PlatformVariantSchema,
    /** Sous-variante inférée (ex. 'gastronomique', 'brunch'). */
    subVariantHint: z.string().optional(),
    /** ∈ [0,1] : complétude des signaux (JSON-LD @type, densité mots-clés menu, cohérence). */
    confidence: z.number().min(0).max(1),
    /** Preuves textuelles : « JSON-LD @type=Restaurant sur /home », « 12 items <Product> sur /menu ». */
    evidence: z.array(z.string()).default([]),
});
export type SectorSignals = z.infer<typeof SectorSignalsSchema>;

/**
 * Item de catalogue RÉELLEMENT extrait de la page (schema.org Product/Offer).
 * Compat descendante volontaire avec l'ancien `ExtractedProductItem` du stub.
 */
export const ExtractedProductItemSchema = z.object({
    id: z.string(),
    name: z.string().min(1),
    description: z.string().default(''),
    /** Prix en microunits (1€ = 1_000_000µ). Extrait de <Offer price="..." priceCurrency="EUR">. */
    priceInMicrounits: MicrounitsSchema,
    /** TVA inférée par catégorie (0.20 défaut restauration, 0.055 alimentation, etc.). */
    taxRate: z.number().min(0).max(1),
    category: z.string().default('Divers'),
    isAvailable: z.boolean().default(true),
    /** URL de la page source qui a fourni l'item (traçabilité). */
    sourceUrl: z.string().url().optional(),
});
export type ExtractedProductItem = z.infer<typeof ExtractedProductItemSchema>;

/** Éléments de marque RÉELS (couleurs extraites du CSS/logo, pas de keyword d'URL). */
export const CompanyBrandingSchema = z.object({
    primaryColor: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/, 'Couleur hex #RRGGBB attendue')
        .default('#C5A059'),
    secondaryColor: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional(),
    /** URL absolue vers le logo (souvent /logo.svg ou favicon 512x512). */
    logoUrl: z.string().url().optional(),
    /** Famille de police détectée dans @font-face ou <link href="fonts.googleapis.com">. */
    fontFamily: z.string().optional(),
    /** 'scraped' quand extrait du site ; 'default' quand fallback appliqué (aucun signal). */
    source: z.enum(['scraped', 'default']),
});
export type CompanyBranding = z.infer<typeof CompanyBrandingSchema>;

/** Signaux de taille (nombre d'employés, multi-sites, franchise). */
export const CompanyScaleSchema = z.object({
    estimatedStaff: z.number().int().nonnegative().optional(),
    multiSite: z.boolean().optional(),
    /** Nombre de sites détectés (« nos 3 boutiques », pages /locations). */
    siteCount: z.number().int().positive().optional(),
    evidence: z.array(z.string()).default([]),
});
export type CompanyScale = z.infer<typeof CompanyScaleSchema>;

/** Traces du crawl (audit trail — jamais utilisé pour prendre une décision métier). */
export const CompanyScrapeRawSchema = z.object({
    /** URLs effectivement fetchées avec succès. */
    pagesCrawled: z.array(z.string().url()).default([]),
    /** Nombre de blocs `<script type="application/ld+json">` parsés. */
    jsonLdBlocks: z.number().int().nonnegative().default(0),
    /** Avertissements non bloquants (parse partiel, timeout page annexe, etc.). */
    warnings: z.array(z.string()).default([]),
    /** ISO timestamp du scrape (pour TTL du cache). */
    scrapedAt: z.string().datetime().default(() => new Date().toISOString()),
});
export type CompanyScrapeRaw = z.infer<typeof CompanyScrapeRawSchema>;

// ── Schéma racine ───────────────────────────────────────────────────────────────

/**
 * Sortie complète du scrape d'une entreprise. Toujours produit — même sur signaux
 * pauvres — avec `confidence` faible + `raw.warnings` peuplé (dégradation propre,
 * jamais d'exception non catchée exposée à l'appelant).
 */
export const CompanyProfileSchema = z.object({
    identity: CompanyIdentitySchema,
    sectorSignals: SectorSignalsSchema,
    catalog: z.array(ExtractedProductItemSchema).default([]),
    branding: CompanyBrandingSchema,
    scale: CompanyScaleSchema.default({ evidence: [] }),
    raw: CompanyScrapeRawSchema,
});
export type CompanyProfile = z.infer<typeof CompanyProfileSchema>;

// ── Helpers de construction (utilisés par l'agent et par les tests) ────────────

/**
 * Profil de repli minimal (aucun signal exploitable). Retourné plutôt qu'une
 * exception : l'appelant garde un objet valide et voit `confidence: 0`.
 */
export function emptyCompanyProfile(name: string, variant = 'custom' as const): CompanyProfile {
    return CompanyProfileSchema.parse({
        identity: { name },
        sectorSignals: {
            detectedVariant: variant,
            confidence: 0,
            evidence: ['aucun signal exploité — scrape vide ou échec réseau'],
        },
        catalog: [],
        branding: { primaryColor: '#C5A059', source: 'default' },
        scale: { evidence: [] },
        raw: {
            pagesCrawled: [],
            jsonLdBlocks: 0,
            warnings: ['scrape sans résultat — utiliser le wizard manuel'],
            scrapedAt: new Date().toISOString(),
        },
    });
}
