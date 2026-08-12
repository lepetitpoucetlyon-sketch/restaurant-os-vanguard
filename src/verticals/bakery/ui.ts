import type { IVerticalUIPlugin } from '@/kernel/plugins/IVerticalUIPlugin';

/**
 * BakeryUIPlugin
 * Interface chaleureuse — radius max, pas de glass sur les tokens scoped.
 */
export const BakeryUIPlugin: IVerticalUIPlugin = {
  variant:         'bakery',
  preferredLayout: 'sidebar',
  scopedTokens: {
    '/pos':        { '--radius-card': '1.5rem', '--radius-btn': '9999px' },
    '/production': { '--radius-card': '1rem' },
  },
};
