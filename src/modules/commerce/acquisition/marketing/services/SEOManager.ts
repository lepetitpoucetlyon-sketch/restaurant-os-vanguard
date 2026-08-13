import { getDefaultStore } from 'jotai';
import { tenantIdAtom } from '@nexus/state/SovereignGenome';
import { fleetSnapshotAtom } from '@/store/pillars/sovereign';
import { EmpireInstance } from '@nexus/contracts';
import type { PlatformVariant } from '@nexus/contracts';

export interface SEOInstance extends EmpireInstance {
  address?: string;
  city?: string;
  zip?: string;
  businessType?: string;
  /** @deprecated Use businessType */
  cuisineType?: string;
}

/** Maps a PlatformVariant to its schema.org @type */
function resolveSchemaType(variant: PlatformVariant): string {
  const map: Record<PlatformVariant, string> = {
    restaurant: 'Restaurant',
    hotel: 'LodgingBusiness',
    bakery: 'Bakery',
    garage: 'AutoRepair',
    salon: 'BeautySalon',
    clinic: 'MedicalBusiness',
    retail: 'Store',
    custom: 'LocalBusiness',
  };
  return map[variant] ?? 'LocalBusiness';
}

export const SEOManager = {
  generateConfig(variant: PlatformVariant = 'restaurant') {
    const store = getDefaultStore();
    const tenantId = store.get(tenantIdAtom);
    const instances = store.get(fleetSnapshotAtom) as EmpireInstance[];
    const instance = instances.find((i: EmpireInstance) => i.id === tenantId) as SEOInstance | undefined;

    const resolvedInstance: SEOInstance = instance || {
      id: tenantId || 'default',
      key: tenantId || 'default',
      name: 'Nexus OS',
      status: 'ONLINE',
      tier: 'STANDARD',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastHeartbeat: new Date().toISOString(),
      metrics: {
        activeUsers: 0,
        dailyRevenue: 0,
        revenue24h: 0,
        healthScore: 100,
        complianceScore: 100,
        lowStockAlerts: 0
      },
      branding: { primaryColor: '#000000' },
      security: {
        twoFactorEnabled: false,
        nf525Certified: true,
        maintenanceAccessGranted: false,
        supportAccessGranted: false
      }
    };

    const baseUrl = `https://${tenantId}.restaurant-os.app`;
    const title = `${resolvedInstance.name} — Réservez en ligne`;
    const description = `Découvrez et réservez chez ${resolvedInstance.name} à ${resolvedInstance.city || 'votre ville'}.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: baseUrl,
        siteName: 'Nexus OS',
        type: 'website',
      },
      jsonLd: this.generateJsonLd(resolvedInstance, baseUrl, variant)
    };
  },

  generateJsonLd(instance: SEOInstance, url: string, variant: PlatformVariant = 'restaurant') {
    const schemaType = resolveSchemaType(variant);
    const base: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": schemaType,
      "name": instance.name,
      "url": url,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": instance.address,
        "addressLocality": instance.city,
        "postalCode": instance.zip,
        "addressCountry": "FR"
      },
    };
    // servesCuisine only valid for food verticals
    const businessType = instance.businessType ?? instance.cuisineType;
    if (businessType && (variant === 'restaurant' || variant === 'bakery' || variant === 'hotel')) {
      base["servesCuisine"] = businessType;
    }
    return base;
  }
};
