import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { doc, onSnapshot } from 'firebase/firestore';
import { tenantBrandTokensAtom } from '@/shared/nexus/state/SovereignGenome';
import { BrandTokensSchema } from '@/shared/nexus/tokens/brand';
import { firestore } from '@/lib/firebase';

/**
 * 🛰️ useFirestoreBrand - Le cordon ombilical Google Stitch.
 * Écoute les changements de configuration de marque en temps réel sur Firestore
 * et les injecte directement dans le DOM et l'état global.
 */
export function useFirestoreBrand(brandId: string) {
  const setBrandTokens = useSetAtom(tenantBrandTokensAtom);

  useEffect(() => {
    if (!brandId || brandId === 'nexus_core') return;

    // Chemin standard Grade X : /brands/{brandId}/config/tokens
    const ref = doc(firestore, 'brands', brandId, 'config', 'tokens');
    
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        console.warn(`[useFirestoreBrand] No config found for brand: ${brandId}`);
        return;
      }
      
      const raw = snap.data();
      const result = BrandTokensSchema.safeParse(raw);
      
      if (result.success) {
        console.log(`[useFirestoreBrand] 🛰️ Mutation detected for ${brandId}`);
        setBrandTokens(result.data);
        
        // Injection directe des variables CSS pour un rendu instantané (Ultra-Fast)
        Object.entries(result.data).forEach(([key, value]) => {
          if (value && typeof value === 'string') {
            // Conversion camelCase en kebab-case pour les variables CSS
            const cssKey = key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
            document.documentElement.style.setProperty(`--brand-${cssKey}`, value);
          }
        });
      } else {
        console.error('[useFirestoreBrand] ❌ Invalid tokens schema:', result.error);
      }
    }, (error) => {
      console.error('[useFirestoreBrand] 🚨 Firestore sync error:', error);
    });

    return () => unsubscribe();
  }, [brandId, setBrandTokens]);
}
