/**
 * mcc-deploy-adv-1 — White-Label Branding Injector
 *
 * Injecte les variables CSS d'un tenant (primaryColor, logo, displayName)
 * dans tenantConfig.branding lors du provisioning.
 * Lues côté client par BrandingProvider pour personnaliser l'UI.
 */

import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export interface TenantBranding {
    primaryColor: string;
    accentColor?: string;
    logoUrl?: string;
    displayName?: string;
}

function colorToRgb(hex: string): string {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `${r} ${g} ${b}`;
}

export async function injectBrandingVars(tenantId: string, branding: TenantBranding): Promise<void> {
    const { primaryColor, accentColor, logoUrl, displayName } = branding;

    const cssVars: Record<string, string> = {
        '--tenant-primary':       primaryColor,
        '--tenant-primary-rgb':   colorToRgb(primaryColor),
        '--tenant-accent':        accentColor ?? primaryColor,
        '--tenant-accent-rgb':    colorToRgb(accentColor ?? primaryColor),
    };

    await Nexus.adapter.set(`tenants/${tenantId}/tenantConfig`, {
        branding: {
            primaryColor,
            accentColor: accentColor ?? primaryColor,
            logoUrl: logoUrl ?? null,
            displayName: displayName ?? null,
            cssVars,
            injectedAt: new Date().toISOString(),
        },
    }, { merge: true });

    logger.info(`[BrandingInjector] CSS vars injectés pour tenant ${tenantId}`, { primaryColor });
}
