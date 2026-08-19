/**
 * nonConformityTypes — Types, config et helpers purs pour les non-conformités HACCP.
 * Pas de React, pas d'effets de bord.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

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
    photoRef?: string;       // base64 data URI or file name reference
    correctiveAction: string;
    responsible: string;
    date: string;            // ISO date string
    status: 'open' | 'resolved';
    createdAt: number;
    resolutionNote?: string;
    resolvedAt?: number;
}

// ── Configuration ──────────────────────────────────────────────────────────────

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

import { buildTenantPath } from '@/lib/nexus/utils/tenantPath';

// ── Path helpers ───────────────────────────────────────────────────────────────

export function buildNcPath(tenantId: string, id: string): string {
    return buildTenantPath(tenantId, 'nonConformities', id);
}

export function buildNcCollectionPath(tenantId: string): string {
    return buildTenantPath(tenantId, 'nonConformities');
}

// ── File helper ────────────────────────────────────────────────────────────────

export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Lecture du fichier échouée'));
        reader.readAsDataURL(file);
    });
}
