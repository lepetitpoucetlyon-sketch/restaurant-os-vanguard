import { useAtomValue } from 'jotai';
import { tenantConfigAtom } from '@nexus/state/SovereignGenome';

/**
 * Retourne les droits de branding du tenant courant.
 *
 * mod_brand_basic : logo, couleur primaire, favicon, mode light/dark — activé par défaut.
 * mod_brand_plus  : configurateur avancé (layout, presets, AI import, polices) — désactivé par défaut,
 *                   activable depuis le MCC par le super-admin.
 */
export function useBrandCapabilities() {
  const config = useAtomValue(tenantConfigAtom);
  const caps   = (config as { capabilities?: Record<string, boolean> })?.capabilities ?? {};

  return {
    hasBasic: caps['mod_brand_basic'] !== false,  // true par défaut (absent = true)
    hasPlus:  caps['mod_brand_plus']  === true,   // false par défaut (absent = false)
  };
}
