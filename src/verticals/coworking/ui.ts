import type { IVerticalUIPlugin } from '@/shared/plugins/IVerticalUIPlugin';

/**
 * CoworkingUIPlugin
 * Utilise tous les composants partagés — pas d'overrides.
 * Theming géré par VERTICAL_DEFAULT_TOKENS (coworkingDefaultTokens).
 */
export const CoworkingUIPlugin: IVerticalUIPlugin = {
  variant: 'coworking',
  preferredLayout: 'sidebar',
};
