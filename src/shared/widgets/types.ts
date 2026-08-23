/**
 * 📦 Dashboard Widgets — Types & Catalogue de Manifests.
 *
 * Micro-widgets découplés et autonomes pour composer les tableaux de bord.
 * Architecture lazy-loaded (`next/dynamic` / `React.lazy`) pour respecter le budget
 * bundle (< 200KB initial).
 *
 * Catégories :
 * - finance     : Chiffre d'affaires, panier moyen, trésorerie
 * - meteo       : Météo terrasse, prévisions affluence
 * - social      : Avis Google en direct, réputation
 * - iot         : Sondes HACCP, SmartSpout tireuses connectées
 * - ops         : Commandes en cours, cadence cuisine
 * - hr          : Pointages du jour, alertes repos
 */

import type { CapabilityKey } from '@/verticals/_shared/catalog/CapabilityCatalog';

export type WidgetCategory = 'finance' | 'meteo' | 'social' | 'iot' | 'ops' | 'hr' | 'custom';

export interface WidgetManifest {
    id: string;
    label: string;
    description: string;
    category: WidgetCategory;
    icon: string; // Nom de l'icône Lucide (ex: 'DollarSign', 'CloudSun', 'Star')
    minWidth: number; // Nombre de colonnes min (1-12)
    defaultWidth: number;
    minHeight: number; // Nombre de lignes min (1-6)
    defaultHeight: number;
    /** Capability requise pour afficher ce widget (optionnel) */
    requiredCapability?: CapabilityKey;
}

export interface WidgetProps {
    tenantId: string;
    config?: Record<string, unknown>;
    className?: string;
}

/**
 * Catalogue des micro-widgets disponibles.
 */
export const WIDGET_MANIFESTS: WidgetManifest[] = [
    {
        id: 'widget_live_revenue',
        label: 'CA en Temps Réel',
        description: 'Chiffre d’affaires encaissé aujourd’hui et comparaison J-1',
        category: 'finance',
        icon: 'TrendingUp',
        minWidth: 3,
        defaultWidth: 4,
        minHeight: 1,
        defaultHeight: 1,
        requiredCapability: 'mod_pos',
    },
    {
        id: 'widget_terrace_weather',
        label: 'Météo & Terrasse',
        description: 'Conditions météo en direct et prévision d’occupation terrasse',
        category: 'meteo',
        icon: 'CloudSun',
        minWidth: 3,
        defaultWidth: 4,
        minHeight: 1,
        defaultHeight: 1,
    },
    {
        id: 'widget_google_reviews',
        label: 'Avis Marchand Live',
        description: 'Derniers avis Google / plateformes avec score de réputation',
        category: 'social',
        icon: 'Star',
        minWidth: 3,
        defaultWidth: 4,
        minHeight: 2,
        defaultHeight: 2,
        requiredCapability: 'mod_customer',
    },
    {
        id: 'widget_haccp_probe',
        label: 'Sondes Frigo IoT',
        description: 'Températures en direct des enceintes réfrigérées',
        category: 'iot',
        icon: 'Thermometer',
        minWidth: 3,
        defaultWidth: 4,
        minHeight: 1,
        defaultHeight: 1,
        requiredCapability: 'mod_haccp',
    },
    {
        id: 'widget_orders_pacing',
        label: 'Cadence de Service',
        description: 'Temps moyen de préparation et commandes en attente',
        category: 'ops',
        icon: 'Flame',
        minWidth: 3,
        defaultWidth: 6,
        minHeight: 1,
        defaultHeight: 1,
        requiredCapability: 'mod_kds',
    },
    {
        id: 'widget_timeclock_today',
        label: 'Effectifs & Pointages',
        description: 'Membres d’équipe pointés actuellement sur le shift',
        category: 'hr',
        icon: 'Clock',
        minWidth: 3,
        defaultWidth: 4,
        minHeight: 1,
        defaultHeight: 1,
        requiredCapability: 'mod_timeclock',
    },
];
