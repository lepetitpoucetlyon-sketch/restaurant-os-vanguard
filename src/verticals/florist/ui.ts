import type { IVerticalUIPlugin } from '@/shared/plugins/IVerticalUIPlugin';

/**
 * @wip vertical-forge — Échéance: 2026-11-01
 * FloristUIPlugin
 * Utilise tous les composants partagés — pas d'overrides.
 * Theming géré par VERTICAL_DEFAULT_TOKENS (floristDefaultTokens).
 */
export const FloristUIPlugin: IVerticalUIPlugin = {
  variant: 'florist',
  preferredLayout: 'sidebar',
};
