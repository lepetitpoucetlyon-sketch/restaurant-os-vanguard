import type { IVerticalUIPlugin } from '@/shared/plugins/IVerticalUIPlugin';

/**
 * HotelUIPlugin
 * Layout topbar pour hôtel — navigation horizontale premium.
 */
export const HotelUIPlugin: IVerticalUIPlugin = {
  variant:         'hotel',
  preferredLayout: 'topbar',
  scopedTokens: {
    '/frontdesk': { '--radius-card': '0.5rem', '--radius-btn': '0.25rem' },
    '/rooms':     { '--radius-card': '1rem' },
  },
};
