import { getDefaultStore } from 'jotai';
import { tenantIdAtom, fleetSnapshotAtom } from '@/store/operationalAtoms';

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
    const instances = store.get(fleetSnapshotAtom);
    const instance = instances.find(i => i.key === tenantId) || { name: 'Restaurant OS' };

    const baseUrl = `https://${tenantId}.restaurant-os.app`;
    const title = `${instance.name} | Réservez en ligne | Cuisine d'Exception`;
    const description = `Découvrez la carte et réservez votre table chez ${instance.name}. Experience gastronomique unique à ${(instance as any).city || 'Paris'}.`;

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
      jsonLd: this.generateJsonLd(instance, baseUrl)
    };
  },

  /**
   * Generates Schema.org JSON-LD for LocalBusiness.
   */
  generateJsonLd(instance: any, url: string) {
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
      "servesCuisine": instance.cuisineType || "Gastronomique"
    };
  }
};
