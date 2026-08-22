import type { IVerticalUIPlugin } from '@/shared/plugins/IVerticalUIPlugin';

/**
 * GymUIPlugin
 * Utilise tous les composants partagés — pas d'overrides.
 * Theming géré par VERTICAL_DEFAULT_TOKENS (gymDefaultTokens).
 */
export const GymUIPlugin: IVerticalUIPlugin = {
  variant: 'gym',
  preferredLayout: 'sidebar',
};
