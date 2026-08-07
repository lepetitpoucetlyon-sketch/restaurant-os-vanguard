/**
 * SilaeClient — Client REST Silae API
 *
 * Silae est le logiciel de paie dominant en France (~40% des cabinets comptables).
 * Il gère les 900+ conventions collectives dont la HCR (IDCC 1997).
 *
 * Auth : API Key (header X-API-Key) ou OAuth2 client_credentials selon le contrat.
 * Base URL : configurable par tenant (certains cabinets ont leur propre endpoint).
 *
 * IMPORTANT : Les endpoints exacts dépendent de la version de l'API Silae négociée
 * avec votre commercial Silae (programme Alliance éditeur). Cette implémentation
 * suit la structure documentée dans silae-api.document360.io.
 * Valider avec Silae avant mise en production.
 */

import type { PayrollPeriodSummary, PayrollProviderConfig } from './types';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

const DEFAULT_SILAE_URL = 'https://api.silae.fr';

interface SilaeEmployee {
    matricule: string;
    nom: string;
    prenom: string;
    email?: string;
    typeContrat: string;
    dateEntree?: string;
    tauxHoraire: number;
}

interface SilaeVariableElement {
    matricule: string;
    codeRubrique: string;   // code Silae de la rubrique (heures, primes, etc.)
    valeur: number;
    unite?: 'heures' | 'jours' | 'montant';
}

// Codes rubriques Silae standard (HCR — à confirmer avec votre référentiel Silae)
const SILAE_RUBRIQUES = {
    HEURES_NORMALES:       '1000', // Heures de travail normales
    HEURES_SUP_25:         '1010', // Heures supplémentaires 25%
    HEURES_SUP_50:         '1020', // Heures supplémentaires 50%
    MAJORATION_DIMANCHE:   '1030', // Heures dimanche (+50%)
    MAJORATION_NUIT:       '1040', // Heures nuit (+25%)
    MAJORATION_FERIE:      '1050', // Heures jours fériés (+100%)
    AVANTAGE_REPAS:        '2010', // Avantage en nature repas (nb repas)
    CONGES_PAYES:          '3000', // CP pris (jours)
    ABSENCE_NON_JUSTIFIEE: '3010', // Absence (jours)
};

export class SilaeClient {
    private baseUrl: string;
    private apiKey: string;
    private dossierId: string;

    constructor(config: PayrollProviderConfig) {
        this.baseUrl = config.silaeBaseUrl ?? DEFAULT_SILAE_URL;
        this.apiKey = config.silaeApiKey ?? '';
        this.dossierId = config.silaeDossierId ?? '';
    }

    private async request<T>(
        path: string,
        options: RequestInit = {},
    ): Promise<T> {
        const url = `${this.baseUrl}${path}`;
        const res = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': this.apiKey,
                'Accept': 'application/json',
                ...(options.headers ?? {}),
            },
            signal: AbortSignal.timeout(30_000),
        });

        if (!res.ok) {
            const body = await res.text();
            throw new Error(`Silae API error ${res.status}: ${body}`);
        }

        return res.json() as Promise<T>;
    }

    /** Vérifie la connexion et retourne le nom du dossier. */
    async ping(): Promise<{ ok: boolean; dossierNom?: string }> {
        try {
            const data = await this.request<{ nom?: string; id?: string }>(
                `/api/dossiers/${this.dossierId}`
            );
            return { ok: true, dossierNom: data.nom ?? data.id };
        } catch (err) {
            logger.warn('[SilaeClient] Ping failed', toError(err).message);
            return { ok: false };
        }
    }

    /** Crée ou met à jour un salarié dans Silae. */
    async upsertEmployee(emp: SilaeEmployee): Promise<{ id: string }> {
        return this.request<{ id: string }>(
            `/api/dossiers/${this.dossierId}/salaries/${emp.matricule}`,
            {
                method: 'PUT',
                body: JSON.stringify({
                    matricule: emp.matricule,
                    nom: emp.nom,
                    prenom: emp.prenom,
                    email: emp.email,
                    typeContrat: emp.typeContrat,
                    dateEntree: emp.dateEntree,
                    tauxHoraire: emp.tauxHoraire,
                    convention: 'HCR', // IDCC 1997 — Hôtels Cafés Restaurants
                }),
            }
        );
    }

    /** Pousse les variables de paie d'une période vers Silae. */
    async pushVariables(
        periode: string, // YYYY-MM → Silae attend YYYYMM
        vars: SilaeVariableElement[],
    ): Promise<{ accepted: number; rejected: number }> {
        const silaePeriode = periode.replace('-', '');
        return this.request<{ accepted: number; rejected: number }>(
            `/api/dossiers/${this.dossierId}/periodes/${silaePeriode}/variables`,
            {
                method: 'POST',
                body: JSON.stringify({ variables: vars }),
            }
        );
    }

    /**
     * Synchronise une période pré-paie complète vers Silae.
     * 1. Upsert tous les salariés
     * 2. Push toutes les variables de paie
     */
    async syncPeriod(summary: PayrollPeriodSummary): Promise<{
        success: boolean;
        employeesUpserted: number;
        variablesAccepted: number;
        errors: string[];
    }> {
        const errors: string[] = [];
        let employeesUpserted = 0;
        let variablesAccepted = 0;

        for (const row of summary.rows) {
            try {
                await this.upsertEmployee({
                    matricule: row.matricule,
                    nom: row.nom,
                    prenom: row.prenom,
                    email: row.email,
                    typeContrat: row.contrat,
                    dateEntree: row.dateEntree,
                    tauxHoraire: row.tauxHoraireEur,
                });
                employeesUpserted++;
            } catch (err) {
                errors.push(`Salarié ${row.matricule}: ${toError(err).message}`);
            }
        }

        // Grouper toutes les variables en un seul batch
        const allVars: SilaeVariableElement[] = [];
        for (const row of summary.rows) {
            const push = (code: string, val: number, unite: SilaeVariableElement['unite'] = 'heures') => {
                if (val > 0) allVars.push({ matricule: row.matricule, codeRubrique: code, valeur: val, unite });
            };
            push(SILAE_RUBRIQUES.HEURES_NORMALES,       row.heuresNormales);
            push(SILAE_RUBRIQUES.HEURES_SUP_25,         row.heuresSupP25);
            push(SILAE_RUBRIQUES.HEURES_SUP_50,         row.heuresSupP50);
            push(SILAE_RUBRIQUES.MAJORATION_DIMANCHE,   row.heuresDimanche);
            push(SILAE_RUBRIQUES.MAJORATION_NUIT,       row.heuresNuit);
            push(SILAE_RUBRIQUES.MAJORATION_FERIE,      row.heuresJoursFeries);
            push(SILAE_RUBRIQUES.AVANTAGE_REPAS,        row.nbRepas,          'jours');
            push(SILAE_RUBRIQUES.CONGES_PAYES,          row.congesPayesJours, 'jours');
            push(SILAE_RUBRIQUES.ABSENCE_NON_JUSTIFIEE, row.absencesJours,    'jours');
        }

        if (allVars.length > 0) {
            try {
                const result = await this.pushVariables(summary.periode, allVars);
                variablesAccepted = result.accepted;
                if (result.rejected > 0) {
                    errors.push(`${result.rejected} variables rejetées par Silae`);
                }
            } catch (err) {
                errors.push(`Push variables: ${toError(err).message}`);
            }
        }

        return {
            success: errors.length === 0,
            employeesUpserted,
            variablesAccepted,
            errors,
        };
    }
}
