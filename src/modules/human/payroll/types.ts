/**
 * Types partagés du module pré-paie Restaurant OS.
 * Ces types sont la source canonique entre PrepaieBuilder, SilaeClient, MergePayrollClient et l'export CSV.
 */

export interface PrepaieRow {
    // Identité
    matricule: string;
    nom: string;
    prenom: string;
    email?: string;
    contrat: 'cdi' | 'cdd' | 'extra' | 'intern' | 'apprentice' | string;
    dateEntree?: string;          // YYYY-MM-DD

    // Heures
    heuresNormales: number;       // jusqu'à 35h/sem × semaines du mois
    heuresSupP25: number;         // 36e–43e heure/sem (×1.25)
    heuresSupP50: number;         // ≥44e heure/sem (×1.50)

    // Majorations HCR (heures, pas montants — le logiciel de paie recalcule)
    heuresDimanche: number;       // heures travaillées un dimanche (majoration +50%)
    heuresNuit: number;           // heures après 21h (majoration +25%)
    heuresJoursFeries: number;    // heures un jour férié (majoration +100%)

    // Avantages & absences
    nbRepas: number;              // avantage en nature repas (jours de présence)
    absencesJours: number;        // jours d'absence non justifiés (retenue)
    congesPayesJours: number;     // CP pris dans le mois

    // Pourboires
    pourboiresEur: number;        // part individuelle du tronc (pool distribué)

    // Rémunération
    tauxHoraireEur: number;       // EUR (source : User.hourlyRateInMicrounits / 1_000_000)
    salaireBrutEur: number;       // calculé par PrepaieBuilder

    // Méta
    periode: string;              // YYYY-MM
    userId: string;
}

export interface PayrollPeriodSummary {
    periode: string;
    tenantId: string;
    generatedAt: string;
    rows: PrepaieRow[];
    totalBrut: number;
    totalHeures: number;
    provider?: string;
    syncStatus?: 'pending' | 'synced' | 'error';
    syncedAt?: string;
    externalRef?: string;         // ID côté Silae / Merge après sync
}

export interface PayrollProviderConfig {
    /** Identifiant du provider — doit correspondre à une clé dans PayrollConnectorFactory */
    provider: string;
    // Silae
    silaeApiKey?: string;
    silaeDossierId?: string;
    silaeBaseUrl?: string;
    // Merge.dev
    mergeAccountToken?: string;
    mergeLinkedAccountId?: string;
    // Extensible : chaque provider peut ajouter ses propres clés ici
    [key: string]: unknown;
}
