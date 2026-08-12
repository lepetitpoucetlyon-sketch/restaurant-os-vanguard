import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { tenantBrandTokensAtom } from '@nexus/state/SovereignGenome';
import { BrandTokensSchema } from '@nexus/tokens/brand';
import { logger } from '@/lib/logger';

/**
 * 🛰️ useFirestoreBrand - Le cordon ombilical Google Stitch.
 * Écoute les changements de configuration de marque en temps réel sur Firestore
 * et les injecte directement dans le DOM et l'état global.
 */
export function useFirestoreBrand(brandId: string) {
  const setBrandTokens = useSetAtom(tenantBrandTokensAtom);

  useEffect(() => {
    if (!brandId || brandId === 'nexus_core') return;

    const brandPath = `brands/${brandId}/config/tokens`;

    const unsubscribe = Nexus.adapter.onSnapshot<Record<string, unknown> | null>(brandPath, (raw) => {
      if (!raw) {
        console.warn(`[useFirestoreBrand] No config found for brand: ${brandId}`);
        return;
      }

      const result = BrandTokensSchema.safeParse(raw);

      if (result.success) {
        logger.debug(`[useFirestoreBrand] Mutation detected for ${brandId}`);
        setBrandTokens(result.data);

        Object.entries(result.data).forEach(([key, value]) => {
          if (value && typeof value === 'string') {
            const cssKey = key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
            document.documentElement.style.setProperty(`--brand-${cssKey}`, value);
          }
        });
      } else {
        console.error('[useFirestoreBrand] Invalid tokens schema:', result.error);
      }
    }, { onError: (error) => {
      console.error('[useFirestoreBrand] Firestore sync error:', error);
    }});

    return () => unsubscribe();
  }, [brandId, setBrandTokens]);
}
