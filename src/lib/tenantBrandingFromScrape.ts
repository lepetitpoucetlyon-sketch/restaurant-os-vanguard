/**
 * 🎨 tenantBrandingFromScrape — projette un CompanyProfile scrapé sur le theme d'un tenant.
 *
 * Sépare TenantSeeder (orchestrateur, fan-out déjà élevé) du contrat CompanyProfile
 * (P0 CompanyScrapeAgent). Un seul point d'entrée, testé indépendamment.
 *
 * Règle : seul un `branding.source === 'scraped'` est autorisé à écraser les valeurs
 * de la DNA — un branding `'default'` (repli d'un scrape vide) est ignoré.
 *
 * V2 : Projection enrichie supportant jusqu'à 16 champs tout en garantissant une
 * compatibilité descendante stricte (100% rétro-compatible avec les fixtures existantes).
 */

import type { CompanyProfile } from '@/modules/commerce';

export interface ScrapedBrandingOverlay {
    primaryColor: string;
    primaryHover?: string;
    secondaryColor?: string;
    accentColor?: string;
    surfaceBg?: string;
    surfaceCard?: string;
    fontFamily?: string;
    fontBrand?: string;
    fontBrandUrl?: string;
    fontUI?: string;
    fontUIUrl?: string;
    logoUrl?: string;
    faviconUrl?: string;
    ogImageUrl?: string;
    appearance?: 'light' | 'dark';
    borderRadiusCard?: 'sm' | 'md' | 'lg';
}

/**
 * Renvoie un overlay branding enrichi (à merger sur `theme` de la DNA) ou `null`
 * si le profil est absent ou son branding vient d'un repli (non scrapé).
 */
export function tenantBrandingFromScrape(
    profile: CompanyProfile | undefined,
): ScrapedBrandingOverlay | null {
    if (!profile) return null;
    if (profile.branding.source !== 'scraped') return null;
    const b = profile.branding as Record<string, unknown>;

    const overlay: ScrapedBrandingOverlay = {
        primaryColor: b.primaryColor as string,
    };

    if (b.secondaryColor) overlay.secondaryColor = b.secondaryColor as string;
    if (b.logoUrl) overlay.logoUrl = b.logoUrl as string;
    if (b.fontFamily) overlay.fontFamily = b.fontFamily as string;

    // Champs enrichis V2 (inclus uniquement si présents ou déduits d'un profil enrichi)
    if (b.primaryHover) overlay.primaryHover = b.primaryHover as string;
    if (b.accentColor) overlay.accentColor = b.accentColor as string;
    if (b.surfaceBg) overlay.surfaceBg = b.surfaceBg as string;
    if (b.surfaceCard) overlay.surfaceCard = b.surfaceCard as string;
    if (b.fontBrand) overlay.fontBrand = b.fontBrand as string;
    if (b.fontBrandUrl) overlay.fontBrandUrl = b.fontBrandUrl as string;
    if (b.fontUI) overlay.fontUI = b.fontUI as string;
    if (b.fontUIUrl) overlay.fontUIUrl = b.fontUIUrl as string;
    if (b.faviconUrl) overlay.faviconUrl = b.faviconUrl as string;
    if (b.ogImageUrl) overlay.ogImageUrl = b.ogImageUrl as string;
    if (b.appearance) overlay.appearance = b.appearance as 'light' | 'dark';
    if (b.borderRadiusCard) overlay.borderRadiusCard = b.borderRadiusCard as 'sm' | 'md' | 'lg';

    return overlay;
}

/**
 * Renvoie le SIREN scrapé (ou undefined) — extrait pour éviter de faire dépendre
 * TenantSeeder du schema CompanyProfile complet.
 */
export function scrapedSiren(profile: CompanyProfile | undefined): string | undefined {
    return profile?.identity.siren;
}
