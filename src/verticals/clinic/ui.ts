import type { IVerticalUIPlugin } from '@/kernel/plugins/IVerticalUIPlugin';

/**
 * ClinicUIPlugin
 * Interface médicale : densité compacte, pas de glassmorphism, coins carrés.
 */
export const ClinicUIPlugin: IVerticalUIPlugin = {
  variant:         'clinic',
  preferredLayout: 'sidebar',
  scopedTokens: {
    '/agenda':   { '--radius-card': '0.5rem', '--radius-btn': '0.25rem', '--glass-blur': '0px' },
    '/patients': { '--radius-card': '0.5rem', '--glass-blur': '0px' },
    '/pos':      { '--radius-card': '0.25rem', '--radius-btn': '0.25rem' },
  },
};
