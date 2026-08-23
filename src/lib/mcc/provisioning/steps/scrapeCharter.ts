/**
 * 🎨 scrapeCharter step — résout un overlay branding à partir de request.websiteUrl.
 *
 * Extrait dans son propre module pour préserver le fan-out sentrux de
 * `TenantProvisioningService.ts` (`no_god_files`). Ce module encapsule les
 * imports vers `@/modules/commerce` (scrapeCompany) et `@/lib/tenantBrandingFromScrape`.
 *
 * Best-effort : toute erreur du scrape est absorbée (log warn), l'overlay renvoyé
 * est `null` — le pipeline retombe alors sur `request.branding.*`. Aucune exception
 * ne remonte au caller.
 */

import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';
import { scrapeCompany } from '@/modules/commerce';
import {
    tenantBrandingFromScrape,
    type ScrapedBrandingOverlay,
} from '@/lib/tenantBrandingFromScrape';

export interface ScrapeCharterInput {
    websiteUrl?: string;
    companyName: string;
    siret: string;
}

export async function resolveBrandingOverlayFromRequest(
    input: ScrapeCharterInput,
): Promise<ScrapedBrandingOverlay | null> {
    if (!input.websiteUrl) return null;
    try {
        const profile = await scrapeCompany({
            websiteUrl: input.websiteUrl,
            fallbackName: input.companyName,
            siren: input.siret,
        });
        const overlay = tenantBrandingFromScrape(profile);
        if (overlay) {
            logger.info('[MCC/prov] Charte extraite du site', {
                websiteUrl: input.websiteUrl,
                primaryColor: overlay.primaryColor,
                hasLogo: Boolean(overlay.logoUrl),
                hasFont: Boolean(overlay.fontFamily),
            });
        } else {
            logger.info('[MCC/prov] Scrape sans branding exploitable — fallback request.branding', {
                websiteUrl: input.websiteUrl,
            });
        }
        return overlay;
    } catch (err) {
        logger.warn('[MCC/prov] Scrape charte échoué — fallback request.branding', {
            websiteUrl: input.websiteUrl,
            error: toError(err).message,
        });
        return null;
    }
}
