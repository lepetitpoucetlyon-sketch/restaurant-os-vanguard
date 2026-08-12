import type { IVerticalUIPlugin } from '@/kernel/plugins/IVerticalUIPlugin';
import { GarageStatCard } from './ui/GarageStatCard';

/**
 * GarageUIPlugin
 * StatCard remplacée : affiche immatriculation, marque, étape réparation, technicien.
 * Géométrie industrielle — radius minimal.
 */
export const GarageUIPlugin: IVerticalUIPlugin = {
  variant:         'garage',
  preferredLayout: 'sidebar',
  components: {
    StatCard: GarageStatCard,
  },
  scopedTokens: {
    '/pos':     { '--radius-card': '0.25rem', '--radius-btn': '0.25rem' },
    '/repairs': { '--radius-card': '0.25rem', '--radius-btn': '0.25rem' },
    '/fleet':   { '--radius-card': '0.5rem' },
  },
};
