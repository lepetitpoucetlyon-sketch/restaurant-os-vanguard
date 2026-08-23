/**
 * 🎨 tenantBrandingFromScrape — projette un CompanyProfile scrapé sur le theme d'un tenant.
 *
 * Sépare TenantSeeder (orchestrateur, fan-out déjà élevé) du contrat CompanyProfile
 * (P0 CompanyScrapeAgent). Un seul point d'entrée, testé indépendamment.
 *
 * Règle : seul un `branding.source === 'scraped'` est autorisé à écraser les valeurs
 * de la DNA — un branding `'default'` (repli d'un scrape vide) est ignoré.
 */

import type { CompanyProfile } from '@/modules/commerce';

export interface ScrapedBrandingOverlay {
    primaryColor: string;
    secondaryColor?: string;
    logoUrl?: string;
    fontFamily?: string;
}

/**
 * Renvoie un overlay branding (à merger sur `theme` de la DNA) ou `null` si le
 * profil est absent ou son branding vient d'un repli (non scrapé).
 */
export function tenantBrandingFromScrape(
    profile: CompanyProfile | undefined,
): ScrapedBrandingOverlay | null {
    if (!profile) return null;
    if (profile.branding.source !== 'scraped') return null;
    const b = profile.branding;
    return {
        primaryColor: b.primaryColor,
        ...(b.secondaryColor ? { secondaryColor: b.secondaryColor } : {}),
        ...(b.logoUrl ? { logoUrl: b.logoUrl } : {}),
        ...(b.fontFamily ? { fontFamily: b.fontFamily } : {}),
    };
}

/**
 * Renvoie le SIREN scrapé (ou undefined) — extrait pour éviter de faire dépendre
 * TenantSeeder du schema CompanyProfile complet.
 */
export function scrapedSiren(profile: CompanyProfile | undefined): string | undefined {
    return profile?.identity.siren;
}
