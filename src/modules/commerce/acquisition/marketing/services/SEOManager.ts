import { getDefaultStore } from 'jotai';
import { tenantIdAtom } from '@nexus/state/SovereignGenome';
import { fleetSnapshotAtom } from '@/store/pillars/sovereign';
import { EmpireInstance } from '@nexus/contracts';

/**
 * 🏛️ SEOInstance interface mapping dynamic SEO properties onto the EmpireInstance schema
 */
export interface SEOInstance extends EmpireInstance {
  address?: string;
  city?: string;
  zip?: string;
  activityCategory?: string;
}

/**
 * 🔍 SEOManager - Restaurant OS
 * Generates dynamic metadata and JSON-LD for Google crawling per tenant.
 */
export const SEOManager = {
  
  /**
   * Generates a dynamic SEO config for the current active tenant.
   */
  generateConfig() {
    const store = getDefaultStore();
    const tenantId = store.get(tenantIdAtom);
    const instances = store.get(fleetSnapshotAtom) as EmpireInstance[];
    const instance = instances.find((i: EmpireInstance) => i.id === tenantId) as SEOInstance | undefined;
    
    const resolvedInstance: SEOInstance = instance || {
      id: tenantId || 'default',
      key: tenantId || 'default',
      name: 'Restaurant OS',
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
      branding: {
        primaryColor: '#000000'
      },
      security: {
        twoFactorEnabled: false,
        nf525Certified: true,
        maintenanceAccessGranted: false,
        supportAccessGranted: false
      }
    };

    const baseUrl = `https://${tenantId}.restaurant-os.app`;
    const title = `${resolvedInstance.name} | Réservez en ligne | Cuisine d'Exception`;
    const description = `Découvrez la carte et réservez votre table chez ${resolvedInstance.name}. Experience gastronomique unique à ${resolvedInstance.city || 'Paris'}.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: baseUrl,
        siteName: 'Restaurant OS Empire',
        type: 'website',
      },
      jsonLd: this.generateJsonLd(resolvedInstance, baseUrl)
    };
  },

  /**
   * Generates Schema.org JSON-LD for LocalBusiness.
   */
  generateJsonLd(instance: SEOInstance, url: string) {
    return {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      "name": instance.name,
      "url": url,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": instance.address,
        "addressLocality": instance.city,
        "postalCode": instance.zip,
        "addressCountry": "FR"
      },
      "servesCuisine": instance.activityCategory || "Gastronomique"
    };
  }
};
