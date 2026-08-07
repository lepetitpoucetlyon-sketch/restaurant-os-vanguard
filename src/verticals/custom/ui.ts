import type { IVerticalUIPlugin } from '@/shared/plugins/IVerticalUIPlugin';

/**
 * CustomUIPlugin
 * Aucune opinion sur les composants — tout hérite des partagés.
 * Le tenant contrôle tout via le configurateur Branding Plus.
 */
export const CustomUIPlugin: IVerticalUIPlugin = {
  variant:         'custom',
  preferredLayout: 'default',
  // Pas de scopedTokens ni de components — le tenant configure via BrandingService
};
