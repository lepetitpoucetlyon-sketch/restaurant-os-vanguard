import type { IVerticalUIPlugin } from '@/shared/plugins/IVerticalUIPlugin';

/**
 * RetailUIPlugin
 * Interface retail : claire, pas de glass, radius modéré.
 */
export const RetailUIPlugin: IVerticalUIPlugin = {
  variant:         'retail',
  preferredLayout: 'sidebar',
  scopedTokens: {
    '/pos':       { '--radius-card': '0.75rem', '--radius-btn': '0.5rem', '--glass-blur': '0px' },
    '/inventory': { '--radius-card': '0.5rem', '--glass-blur': '0px' },
    '/showcase':  { '--radius-card': '1rem' },
  },
};
