/**
 * 💾 BackupDeriver — dérive rétention, backup, PCA/PRA du tenant (§C.10 P2d).
 *
 * Complète RgpdDeriver.retentionByCategory avec :
 *  - backupFrequency : fréquence de sauvegarde selon volumétrie transactionnelle.
 *  - dr : Disaster Recovery { rto: minutes, rpo: minutes } — santé et grands
 *    comptes = strict, sinon best-effort.
 *  - encryptionAtRest : niveau de chiffrement (AES-256 par défaut, HDS santé,
 *    PCI-DSS si mod_pos + volume élevé).
 *  - dataResidency : où les données peuvent être hébergées (santé = UE only).
 *  - archivalStrategy : cold storage pour données comptables > 3 ans.
 */

import type { PlatformVariant } from '@/modules/system';
import type { CapabilitySet } from '../catalog/CapabilityCatalog';
import type { QualificationAnswers } from '@/modules/commerce';

// ── Types de sortie ─────────────────────────────────────────────────────────────

export type BackupFrequency = 'hourly' | 'every_4h' | 'every_12h' | 'daily' | 'weekly';
export type EncryptionLevel = 'AES256' | 'AES256_HDS' | 'AES256_PCI_DSS';

export interface DrObjective {
    /** Recovery Time Objective — minutes. */
    readonly rtoMinutes: number;
    /** Recovery Point Objective — minutes. */
    readonly rpoMinutes: number;
    readonly reasoning: string;
}

export interface DerivedBackup {
    readonly backupFrequency: BackupFrequency;
    readonly encryptionAtRest: EncryptionLevel;
    readonly dr: DrObjective;
    readonly dataResidency: readonly string[];       // ex. ['EU'], ['EU', 'US']
    readonly archivalAfterMonths: number;
    readonly archiveStorage: 'hot' | 'warm' | 'cold_glacier';
    readonly derivedFrom: Record<string, string>;
}

// ── Entrée ──────────────────────────────────────────────────────────────────────

export interface BackupDeriverInput {
    readonly answers: QualificationAnswers;
    readonly variant: PlatformVariant;
    readonly effectiveCapabilities: CapabilitySet;
    /** Nombre estimé de transactions par jour (issu de businessLaws.node_capacity). */
    readonly transactionsPerDay?: number;
}

// ── Dérivation ──────────────────────────────────────────────────────────────────

export function deriveBackup(input: BackupDeriverInput): DerivedBackup {
    const { answers, variant, effectiveCapabilities: caps, transactionsPerDay = 100 } = input;
    const derivedFrom: Record<string, string> = {};

    const isHealth = variant === 'clinic' || variant === 'veterinary';
    const isBig = answers.axis1_scale === 'pme' || answers.axis1_scale === 'eti';

    // ── Fréquence backup selon volumétrie + criticité ────────────────────
    let backupFrequency: BackupFrequency;
    if (isHealth || answers.axis1_scale === 'eti') backupFrequency = 'hourly';
    else if (transactionsPerDay > 500 || isBig) backupFrequency = 'every_4h';
    else if (transactionsPerDay > 100) backupFrequency = 'every_12h';
    else backupFrequency = 'daily';
    derivedFrom['backupFrequency'] = `tx/day=${transactionsPerDay}, scale=${answers.axis1_scale}, isHealth=${isHealth} → ${backupFrequency}`;

    // ── Chiffrement at-rest ──────────────────────────────────────────────
    let encryptionAtRest: EncryptionLevel = 'AES256';
    if (isHealth) encryptionAtRest = 'AES256_HDS';
    else if (caps['mod_pos'] && transactionsPerDay > 1000) encryptionAtRest = 'AES256_PCI_DSS';
    derivedFrom['encryptionAtRest'] = isHealth
        ? 'santé → HDS obligatoire'
        : caps['mod_pos'] && transactionsPerDay > 1000
            ? 'volume paiement élevé → PCI-DSS recommandé'
            : 'AES-256 standard';

    // ── DR (RTO/RPO) ────────────────────────────────────────────────────
    let dr: DrObjective;
    if (isHealth) {
        dr = { rtoMinutes: 60, rpoMinutes: 15, reasoning: 'Santé → PRA obligatoire (Décret 2018-137), RTO 1h/RPO 15min' };
    } else if (answers.axis1_scale === 'eti') {
        dr = { rtoMinutes: 240, rpoMinutes: 60, reasoning: 'ETI → PCA formalisé, RTO 4h/RPO 1h' };
    } else if (isBig) {
        dr = { rtoMinutes: 480, rpoMinutes: 240, reasoning: 'PME → best-effort structuré' };
    } else {
        dr = { rtoMinutes: 1440, rpoMinutes: 1440, reasoning: 'TPE/solo → best-effort quotidien' };
    }
    derivedFrom['dr'] = dr.reasoning;

    // ── Data residency ──────────────────────────────────────────────────
    const dataResidency: string[] = ['EU'];
    if (isHealth) {
        // Santé : strictement UE (HDS). Ne pas ajouter US même si CDN.
        derivedFrom['dataResidency'] = 'santé → UE only (HDS)';
    } else if (caps['mod_ai']) {
        // Google Gemini est aux US — donc traitement partiel aux US (documenté dans registre RGPD)
        dataResidency.push('US');
        derivedFrom['dataResidency'] = 'mod_ai → US partiel (Gemini) + UE principal';
    } else {
        derivedFrom['dataResidency'] = 'UE par défaut';
    }

    // ── Archivage cold storage après X mois ──────────────────────────────
    const archivalAfterMonths = isHealth ? 60 : 36;
    const archiveStorage: DerivedBackup['archiveStorage'] = isHealth ? 'cold_glacier' : isBig ? 'warm' : 'hot';
    derivedFrom['archivalAfterMonths'] = `${archivalAfterMonths} mois, storage=${archiveStorage}`;

    return {
        backupFrequency,
        encryptionAtRest,
        dr,
        dataResidency,
        archivalAfterMonths,
        archiveStorage,
        derivedFrom,
    };
}
