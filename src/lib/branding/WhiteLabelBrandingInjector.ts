/**
 * White-Label Branding Injector
 *
 * Persiste la charte graphique d'un tenant via Nexus (DB-agnostique).
 * Lue côté client par BrandingProvider → CSS custom properties.
 *
 * Deux modes :
 *  - 'default'  : branding Restaurant OS (gold/dark) — aucune surcharge visuelle
 *  - 'custom'   : charte propre (logo, couleurs, splash)
 */

import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export interface TenantBranding {
    /** 'default' = Restaurant OS branding. 'custom' = charte propre. */
    mode?: 'default' | 'custom';
    primaryColor: string;
    accentColor?: string;
    logoUrl?: string | null;
    displayName?: string;
    /** Activer le splash screen branded à l'ouverture de l'app. */
    splashEnabled?: boolean;
}

function colorToRgb(hex: string): string {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `${r} ${g} ${b}`;
}

/**
 * Écrit la charte graphique dans tenantConfig via Nexus.
 * Appelé une fois au provisioning, puis à chaque mise à jour depuis les settings.
 */
export async function injectBrandingVars(tenantId: string, branding: TenantBranding): Promise<void> {
    const mode = branding?.mode ?? (branding?.primaryColor ? 'custom' : 'default');
    const { primaryColor, accentColor, logoUrl, displayName, splashEnabled } = branding ?? {};

    // En mode 'default', on persiste quand même le mode pour que le client le lise.
    // Les CSS vars ne sont pas surchargées (BrandingProvider ignore si mode=default).
    const cssVars: Record<string, string> = mode === 'custom' ? {
        '--tenant-primary':     primaryColor,
        '--tenant-primary-rgb': colorToRgb(primaryColor),
        '--tenant-accent':      accentColor ?? primaryColor,
        '--tenant-accent-rgb':  colorToRgb(accentColor ?? primaryColor),
    } : {};

    await Nexus.adapter.set(`tenants/${tenantId}/tenantConfig`, {
        branding: {
            mode,
            primaryColor,
            accentColor:    accentColor ?? primaryColor,
            logoUrl:        logoUrl ?? null,
            displayName:    displayName ?? null,
            splashEnabled:  splashEnabled ?? false,
            cssVars,
            injectedAt:     new Date().toISOString(),
        },
    }, { merge: true });

    logger.info(`[BrandingInjector] Charte persistée pour tenant ${tenantId}`, { mode, primaryColor, splashEnabled });
}
