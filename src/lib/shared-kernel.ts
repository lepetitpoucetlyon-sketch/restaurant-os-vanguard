/**
 * SHARED KERNEL - Restaurant OS
 * Centralise la logique métier transverse pour éliminer la redondance (Deding).
 */

import { IdGenerator } from './utils/IdGenerator';
import type { SovereignData, SovereignSchemaField } from '@/shared/nexus-contract';

export const SharedKernel = {
    // --- FINANCE & CALCULS (BASE CENTIMES / INTEGER ONLY) ---
    
    /** Convertit les Euros (float) en Centimes (int) en sécurisant l'arrondi */
    eurosToCents: (euros: number): number => {
        return Math.round(Number((euros * 100).toFixed(2)));
    },

    /** Convertit les Centimes (int) en Euros (float) pour l'affichage ponctuel */
    centsToEuros: (cents: number): number => {
        return cents / 100;
    },

    /** Formate un prix en Euros (l'entrée DOIT être en centimes) */
    formatCurrency: (amountInCents: number): string => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(amountInCents / 100);
    },

    /** Calcule le montant HT à partir du TTC (en centimes) */
    calculateHT: (ttcCents: number, taxRate: number = 0.10): number => {
        // Formule : HT = TTC / (1 + taux)
        // On multiplie par 1000 pour garder de la précision en integer avant de diviser
        return Math.round(ttcCents / (1 + taxRate));
    },

    /** Calcule la marge brute en pourcentage (entrée en centimes) */
    calculateMargin: (priceCents: number, costCents: number): number => {
        if (!priceCents || priceCents === 0) return 0;
        return ((priceCents - costCents) / priceCents) * 100;
    },

    // --- DATA & FORMATTING ---

    /** 
     * 🆔 NanoID Grade X (Sovereign Service)
     */
    nanoId: (size: number = 21): string => {
        return IdGenerator.generate(size);
    },

    /** Génère un identifiant unique Cloud-Safe */
    generateId: (prefix: string = 'ID'): string => {
        return IdGenerator.generateWithPrefix(prefix, 12).toUpperCase();
    },

    /** Formate une date pour l'affichage élégant */
    formatDate: (date: Date): string => {
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    },

    // --- STOCK & MASSES (BASE GRAMMES / INTEGER ONLY) ---

    /** Convertit les Kilogrammes (float) en Grammes (int) */
    kilogramsToGrams: (kg: number): number => {
        return Math.round(Number((kg * 1000).toFixed(3)));
    },

    /** Convertit les Grammes (int) en Kilogrammes (float) pour l'affichage */
    gramsToKilograms: (grams: number): number => {
        return grams / 1000;
    },

    /** 
     * SYNC ENGINE : Assainit et synchronise les données avec le registre de schémas.
     * Gère automatiquement les conversions (Cents, Grammes) avant persistance.
     */
    sync: (schemaKey: string, rawData: SovereignData, schemaFields: SovereignSchemaField[]): SovereignData => {

        const sanitized = { ...rawData };

        schemaFields.forEach(field => {
            const value = sanitized[field.id];
            if (value === undefined || value === null) return;

            // Conversion automatique basée sur les unités du registre
            if (field.unit === 'cents' && typeof value === 'number') {
                sanitized[field.id] = SharedKernel.eurosToCents(value);
            } else if (field.unit === 'grams' && typeof value === 'number') {
                sanitized[field.id] = SharedKernel.kilogramsToGrams(value);
            }

            // Gestion récursive pour les listes
            if (field.type === 'list' && Array.isArray(value) && field.subFields) {
                sanitized[field.id] = value.map(item => 
                    SharedKernel.sync(schemaKey, item as SovereignData, field.subFields as SovereignSchemaField[])
                );
            }
        });


        return sanitized;
    },

    /** Force le cast d'un SovereignField en string (Grade X Compliance) */
    castString: (value: any): string => {
        if (typeof value === 'string') return value;
        return String(value ?? '');
    },

    /** Force le cast d'un SovereignField en nombre (Grade X Compliance) */
    castNumber: (value: any): number => {
        if (typeof value === 'number') return value;
        return Number(value ?? 0);
    }
};

/**
 * 🌀 YieldState - Dictionnaire de l'Oracle
 */
export interface YieldState {
    productId: string;
    productName: string;
    basePriceCents: number;
    adjustedPriceCents: number;
    yieldFactor: number; // e.g., 1.15
    salesVelocity: number; // units/hour
    stockLevel: number; // grams or units
    isCritical: boolean;
}

/**
 * 📦 ProcurementOrder - Dictionnaire de l'Admin
 */
export interface ProcurementOrder {
    id: string;
    supplierId: string;
    ingredientId: string;
    quantity: number;
    unit: string;
    estimatedCostCents: number;
    status: 'draft' | 'sent' | 'received';
    createdAt: string;
}

/**
 * 🧑‍💼 StaffingProposal - Dictionnaire RH Prédictif
 */
export interface StaffingProposal {
    id: string;
    targetDate: string; // ISO
    reason: string;
    currentStaffCount: number;
    suggestedStaffCount: number;
    predictedVelocity: number;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

/**
 * ⚖️ LedgerEntry - Dictionnaire Finance Souveraine
 */
export interface LedgerEntry {
    id: string;
    date: string;
    accountName: 'SALES' | 'PURCHASES' | 'LABOR' | 'PAYROLL' | 'TAX' | 'CASH' | 'EQUITY' | 'PROPOSALS';
    type: 'DEBIT' | 'CREDIT';
    amountInCents: number;
    referenceId: string; // e.g. Order ID, PO ID, Salary ID
    description: string;
    scelledAt: string;
}

/**
 * ⚙️ Grade X Dynamic Configuration Defaults
 */
export type AccountingMode = 'SIMPLE' | 'EXPERT';
export const DEFAULT_STAFF_RATIO = 25;

/**
 * Hache un PIN avec un salt (userId) via SHA-256.
 * Utilisé pour stocker les PINs de manière sécurisée dans Firestore.
 */
export async function hashPin(pin: string, salt: string): Promise<string> {
    const data = new TextEncoder().encode(pin + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0')).join('');
}
