import type { IVerticalUIPlugin } from '@/shared/plugins/IVerticalUIPlugin';

/**
 * @wip vertical-forge — Échéance: 2026-11-01
 * VeterinaryUIPlugin
 * Utilise tous les composants partagés — pas d'overrides.
 * Theming géré par VERTICAL_DEFAULT_TOKENS (veterinaryDefaultTokens).
 */
export const VeterinaryUIPlugin: IVerticalUIPlugin = {
  variant: 'veterinary',
  preferredLayout: 'sidebar',
};
