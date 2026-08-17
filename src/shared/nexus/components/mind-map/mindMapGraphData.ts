import type * as d3 from 'd3';

export interface MindMapNode extends d3.SimulationNodeDatum {
    id: string;
    label: string;
    group: string;
    size: number;
    description: string;
    side: 'left' | 'right' | 'center'; // Control bilateral distribution
    metrics?: { label: string; value: string }[];
}

export interface MindMapLink extends d3.SimulationLinkDatum<MindMapNode> {
    id: string;
    label: string;
    strength: number;
}

const REVENUE_CORE = 450000; // Mock base (Cents)
const STOCK_ALERTS = 4; // Mock base

export const MINDMAP_NODES: MindMapNode[] = [
    {
        id: 'pos', label: 'Caisse (POS)', group: 'revenue', size: 65, side: 'center',
        description: 'Moteur transactionnel central gérant les ventes et les encaissements.',
        metrics: [{ label: 'Tickets/j', value: '142' }, { label: 'Revenue Fleet', value: `${(REVENUE_CORE / 100).toLocaleString()}€` }]
    },
    {
        id: 'kds', label: 'Cuisine (KDS)', group: 'production', size: 50, side: 'right',
        description: 'Interface de production temps-réel pour la préparation des commandes.',
        metrics: [{ label: 'Temps Prep', value: '12m' }]
    },
    {
        id: 'inventory', label: 'Stocks', group: 'logistics', size: 45, side: 'left',
        description: 'Gestion des matières premières et suivi HACCP.',
        metrics: [{ label: 'Statut', value: STOCK_ALERTS > 0 ? 'CRITIQUE' : 'NOMINAL' }, { label: 'Alertes LowStock', value: STOCK_ALERTS.toString() }]
    },
    {
        id: 'reservations', label: 'Réservations', group: 'crm', size: 40, side: 'right',
        description: 'CRM et carnet de réservations intelligent.',
        metrics: [{ label: 'Couverts/j', value: '85' }]
    },
    {
        id: 'accounting', label: 'Comptabilité', group: 'finance', size: 55, side: 'left',
        description: 'Pilotage financier et analyse de rentabilité.',
        metrics: [{ label: 'Bénéfice Fleet', value: '+12%' }]
    },
    {
        id: 'staff', label: 'Staff HR', group: 'human', size: 35, side: 'left',
        description: 'Gestion de la brigade, des plannings et du pointage.',
        metrics: [{ label: 'Brigade', value: '8' }]
    },
    {
        id: 'floor', label: 'Plan Salle', group: 'production', size: 30, side: 'right',
        description: 'Visualisation spatiale et occupation des tables.'
    }
];

export const MINDMAP_LINKS: MindMapLink[] = [
    { id: 'pos-kds', source: 'pos', target: 'kds', label: 'Envoi Commandes', strength: 1 },
    { id: 'pos-inv', source: 'pos', target: 'inventory', label: 'Sortie Stock', strength: 0.8 },
    { id: 'pos-acc', source: 'pos', target: 'accounting', label: 'Flux Revenus', strength: 1.2 },
    { id: 'res-floor', source: 'reservations', target: 'floor', label: 'Placement', strength: 0.6 },
    { id: 'staff-pos', source: 'staff', target: 'pos', label: 'Authentification', strength: 0.5 },
    { id: 'inv-acc', source: 'inventory', target: 'accounting', label: 'Dépenses Food', strength: 0.7 },
    { id: 'kds-inv', source: 'kds', target: 'inventory', label: 'Usage Recettes', strength: 0.4 }
];
