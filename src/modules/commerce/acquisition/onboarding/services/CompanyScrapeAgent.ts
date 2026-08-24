/**
 * 🕸️ CompanyScrapeAgent — Façade d'orchestration pour le scrape d'entreprise (Axe B onboarding).
 *
 * Découpé selon les règles architecturales Nexus :
 *  - SafeFetcher.ts : sandbox HTTP et anti-SSRF
 *  - HtmlSignalExtractor.ts : extraction JSON-LD / Meta / Catalog
 *  - ScrapeClassifier.ts : classification de variante et fallback LLM
 */

import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';
import { type PlatformVariant } from '@/modules/system';
import {
    type CompanyProfile,
    type ExtractedProductItem,
    CompanyProfileSchema,
    emptyCompanyProfile,
} from '../schemas/companyProfile';

import {
    assertUrlIsPublic,
    isPrivateIp,
    fetchSandboxed,
    MAX_BODY_BYTES,
    DEFAULT_MAX_PAGES,
    PRIORITY_PATHS,
    type FetchResult,
} from './scrape/SafeFetcher';

import {
    parseJsonLdBlocks,
    parseMetaTags,
    extractProductsFromJsonLd,
    extractName,
    extractPrimaryColor,
    absolutize,
} from './scrape/HtmlSignalExtractor';

import {
    classifyVariant,
    buildClassifyPrompt,
    parseLlmClassification,
    uniqPreserveOrder,
    extractHostBrand,
    textOnly,
} from './scrape/ScrapeClassifier';

// ── Re-exports publics pour compatibilité ───────────────────────────────────────

export {
    assertUrlIsPublic,
    isPrivateIp,
    fetchSandboxed,
    parseJsonLdBlocks,
    parseMetaTags,
    classifyVariant,
    extractProductsFromJsonLd,
    extractName,
    extractPrimaryColor,
    buildClassifyPrompt,
};
export type { FetchResult };

export interface CompanyScrapeInput {
    /** URL du site vitrine — protocole optionnel, https ajouté sinon. */
    websiteUrl?: string;
    /** Complément d'identité fourni par l'opérateur (utilisé en cas de scrape pauvre). */
    fallbackName?: string;
    /** SIREN fourni manuellement (jamais deviné). */
    siren?: string;
    /** LLM injecté (agnostique) — appelé UNIQUEMENT si signals faibles pour classifier. */
    llm?: ScrapeLLM;
    /** Verrouille le variant à une valeur (bypass la classification IA). */
    forceVariant?: PlatformVariant;
    /** Limite du nombre de pages internes crawlées (défaut 4 : home + /menu + /about + /contact). */
    maxPages?: number;
}

/** LLM injecté agnostique : prompt système + user, réponse JSON stricte attendue. */
export type ScrapeLLM = (input: { system: string; user: string }) => Promise<string>;

/**
 * Point d'entrée principal : scrape une entreprise et retourne un `CompanyProfile` validé Zod.
 */
export async function scrapeCompany(input: CompanyScrapeInput): Promise<CompanyProfile> {
    if (!input.websiteUrl) {
        logger.warn('[CompanyScrapeAgent] Aucun websiteUrl fourni — profil vide retourné');
        return emptyCompanyProfile(input.fallbackName ?? 'Établissement');
    }

    const rootUrl = await assertUrlIsPublic(input.websiteUrl);
    const maxPages = input.maxPages ?? DEFAULT_MAX_PAGES;
    const pagesToTry = uniqPreserveOrder(
        PRIORITY_PATHS.map(p => new URL(p, rootUrl).toString()),
    ).slice(0, maxPages);

    const pagesCrawled: string[] = [];
    const warnings: string[] = [];
    const allBlocks: unknown[] = [];
    const allProducts: ExtractedProductItem[] = [];
    const mergedMeta: Record<string, string> = {};
    let bodyTextForClassify = '';
    let jsonLdCount = 0;

    for (const url of pagesToTry) {
        try {
            const res = await fetchSandboxed(url);
            if (res.status < 200 || res.status >= 400) {
                warnings.push(`${url} → HTTP ${res.status}`);
                continue;
            }
            if (!res.contentType.includes('html') && !res.contentType.includes('xml')) {
                warnings.push(`${url} → content-type ignoré (${res.contentType})`);
                continue;
            }
            if (res.truncated) warnings.push(`${url} → body tronqué à ${MAX_BODY_BYTES} octets`);

            pagesCrawled.push(res.finalUrl);
            const meta = parseMetaTags(res.body);
            for (const [k, v] of Object.entries(meta)) {
                if (!mergedMeta[k]) mergedMeta[k] = v;
            }

            const { blocks, warnings: ldWarn } = parseJsonLdBlocks(res.body);
            allBlocks.push(...blocks);
            jsonLdCount += blocks.length;
            warnings.push(...ldWarn);
            allProducts.push(...extractProductsFromJsonLd(blocks, res.finalUrl));

            if (bodyTextForClassify.length < 20_000) {
                bodyTextForClassify += '\n' + textOnly(res.body).slice(0, 8_000);
            }
        } catch (err) {
            const msg = toError(err).message;
            if (/interdit|invalide|privée|Résolution DNS|Trop de redirections/.test(msg)) throw err;
            warnings.push(`${url} → ${msg}`);
        }
    }

    if (pagesCrawled.length === 0) {
        logger.warn(`[CompanyScrapeAgent] 0 page scrappée sur ${input.websiteUrl}`);
        return emptyCompanyProfile(input.fallbackName ?? extractHostBrand(rootUrl));
    }

    const name = extractName(allBlocks, mergedMeta, input.fallbackName);
    const primaryColor = extractPrimaryColor(mergedMeta);
    const logoUrl = mergedMeta['og:image'] || (mergedMeta['__favicon'] ? absolutize(mergedMeta['__favicon']!, rootUrl.toString()) : undefined);

    let classification = input.forceVariant
        ? { variant: input.forceVariant, evidence: [`variant forcé par l'appelant`], confidence: 1 }
        : classifyVariant(allBlocks, mergedMeta, bodyTextForClassify);

    let subVariantHint: string | undefined;
    if (!input.forceVariant && input.llm && classification.confidence < 0.5) {
        try {
            const raw = await input.llm(buildClassifyPrompt(bodyTextForClassify));
            const parsed = parseLlmClassification(raw);
            if (parsed) {
                classification = {
                    variant: parsed.variant,
                    evidence: [...classification.evidence, ...parsed.evidence.map(e => `[llm] ${e}`)],
                    confidence: Math.max(classification.confidence, parsed.confidence),
                };
                subVariantHint = parsed.subVariant;
            } else {
                warnings.push('LLM : réponse hors schéma, ignorée');
            }
        } catch (err) {
            warnings.push(`LLM : ${toError(err).message}`);
        }
    }

    const richness = Math.min(1, (jsonLdCount * 0.05) + (allProducts.length * 0.02) + (pagesCrawled.length * 0.05));
    const globalConfidence = input.forceVariant
        ? 1
        : Math.min(1, classification.confidence * 0.7 + richness * 0.3);

    const profile: CompanyProfile = CompanyProfileSchema.parse({
        identity: {
            name,
            siren: input.siren,
        },
        sectorSignals: {
            detectedVariant: classification.variant,
            subVariantHint,
            confidence: Number(globalConfidence.toFixed(3)),
            evidence: classification.evidence,
        },
        catalog: allProducts,
        branding: {
            primaryColor,
            logoUrl,
            source: primaryColor === '#C5A059' && !logoUrl ? 'default' : 'scraped',
        },
        scale: { evidence: [] },
        raw: {
            pagesCrawled,
            jsonLdBlocks: jsonLdCount,
            warnings,
            scrapedAt: new Date().toISOString(),
        },
    });

    logger.info(`[CompanyScrapeAgent] Scrape OK ${input.websiteUrl} — variant=${profile.sectorSignals.detectedVariant} conf=${profile.sectorSignals.confidence} items=${profile.catalog.length}`);
    return profile;
}

export const CompanyScrapeAgent = {
    scrape: scrapeCompany,
    assertUrlIsPublic,
    isPrivateIp,
    fetchSandboxed,
    parseJsonLdBlocks,
    parseMetaTags,
    classifyVariant,
    extractProductsFromJsonLd,
    extractName,
    extractPrimaryColor,
} as const;
