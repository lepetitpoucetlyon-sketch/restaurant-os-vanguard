/**
 * 🛠️ LIB/UTILS — Utilitaires purs et données statiques
 *
 * Barrel logique pour la couche utils de lib/.
 * Les fichiers sources restent à la racine de lib/ pour compatibilité ascendante
 * et seront physiquement déplacés ici lors d'un sprint dédié post-versionbase.
 *
 * ⚠️ Utiliser les imports directs pour éviter les conflits de noms entre modules :
 *   import { formatDate } from '@/lib/dates'           // version dates
 *   import { formatDate } from '@/lib/constants'       // version legacy
 *   import { formatCurrency } from '@/lib/formatters'  // version riche
 *
 * Périmètre :
 *   bloom-filter, constants, dates, docs-data,
 *   formatters, helpers, mock-data, shared-kernel,
 *   slm-data-generator, tutorialContent, utils,
 *   ui.components, ui.foundations
 */

// Barrel sélectif — seuls les modules sans conflits de noms sont ré-exportés globalement.
// Pour les modules avec doublons (dates/constants/formatters), importer directement depuis la source.

export * from '../bloom-filter';
export * from '../helpers';
export * from '../shared-kernel';
export * from '../utils';

// Exports sélectifs pour éviter les conflits :
// constants.ts exporte formatDate/formatTime/formatCurrency en doublon avec dates.ts et formatters.ts
export {
    ROLE_LABELS,
    ROLE_COLORS,
    ORDER_STATUS_LABELS,
    TABLE_STATUS_LABELS,
} from '../constants';

// Data files (large — importer directement si tree-shaking nécessaire) :
// export * from '../docs-data';
// export * from '../mock-data';
// export * from '../slm-data-generator';
// export * from '../tutorialContent';
// export * from '../ui.components';
// export * from '../ui.foundations';
