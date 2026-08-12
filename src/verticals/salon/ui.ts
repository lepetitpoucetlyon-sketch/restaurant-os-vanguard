import type { IVerticalUIPlugin } from '@/kernel/plugins/IVerticalUIPlugin';
import { SalonStatCard } from './ui/SalonStatCard';

/**
 * SalonUIPlugin
 * StatCard remplacée : affiche client, styliste, heure, statut RDV.
 * Radius maximal sur l'agenda — esthétique soft/féminine.
 */
export const SalonUIPlugin: IVerticalUIPlugin = {
  variant:         'salon',
  preferredLayout: 'sidebar',
  components: {
    StatCard: SalonStatCard,
  },
  scopedTokens: {
    '/agenda':  { '--radius-card': '9999px', '--radius-btn': '9999px' },
    '/clients': { '--radius-card': '1.5rem' },
    '/pos':     { '--radius-card': '1rem', '--radius-btn': '9999px' },
  },
};
