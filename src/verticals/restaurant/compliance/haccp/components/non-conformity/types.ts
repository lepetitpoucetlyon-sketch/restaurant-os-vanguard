export type NonConformityType =
    | 'température hors norme'
    | 'produit non-conforme'
    | 'livraison refusée'
    | 'contamination'
    | 'autre';

export interface NonConformity {
    id: string;
    type: NonConformityType;
    description: string;
    photoRef?: string;
    correctiveAction: string;
    responsible: string;
    date: string;
    status: 'open' | 'resolved';
    createdAt: number;
    resolutionNote?: string;
    resolvedAt?: number;
}

export const NC_TYPES: NonConformityType[] = [
    'température hors norme',
    'produit non-conforme',
    'livraison refusée',
    'contamination',
    'autre',
];

export const STAFF_LIST = [
    'Chef de cuisine',
    'Second de cuisine',
    'Chef de partie',
    'Responsable HACCP',
    'Responsable de salle',
    'Directeur / Manager',
];

export const TYPE_LABELS: Record<NonConformityType, string> = {
    'température hors norme': 'Température hors norme',
    'produit non-conforme': 'Produit non-conforme',
    'livraison refusée': 'Livraison refusée',
    'contamination': 'Contamination',
    'autre': 'Autre',
};
