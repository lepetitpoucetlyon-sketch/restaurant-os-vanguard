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
import type { QualificationAnswers } from '../qualification/QualificationAnswers';

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

function deriveBackupFrequency(isHealth: boolean, scale: string, txPerDay: number): { freq: BackupFrequency; reason: string } {
    let freq: BackupFrequency = 'daily';
    if (isHealth || scale === 'eti') freq = 'hourly';
    else if (txPerDay > 500 || scale === 'pme') freq = 'every_4h';
    else if (txPerDay > 100) freq = 'every_12h';
    return { freq, reason: `tx/day=${txPerDay}, scale=${scale}, isHealth=${isHealth} → ${freq}` };
}

function deriveEncryptionAtRest(isHealth: boolean, hasPos: boolean, txPerDay: number): { level: EncryptionLevel; reason: string } {
    if (isHealth) return { level: 'AES256_HDS', reason: 'santé → HDS obligatoire' };
    if (hasPos && txPerDay > 1000) return { level: 'AES256_PCI_DSS', reason: 'volume paiement élevé → PCI-DSS recommandé' };
    return { level: 'AES256', reason: 'AES-256 standard' };
}

function deriveDrObjective(isHealth: boolean, scale: string): DrObjective {
    if (isHealth) return { rtoMinutes: 60, rpoMinutes: 15, reasoning: 'Santé → PRA obligatoire (Décret 2018-137), RTO 1h/RPO 15min' };
    if (scale === 'eti') return { rtoMinutes: 240, rpoMinutes: 60, reasoning: 'ETI → PCA formalisé, RTO 4h/RPO 1h' };
    if (scale === 'pme') return { rtoMinutes: 480, rpoMinutes: 240, reasoning: 'PME → best-effort structuré' };
    return { rtoMinutes: 1440, rpoMinutes: 1440, reasoning: 'TPE/solo → best-effort quotidien' };
}

function deriveDataResidency(isHealth: boolean, hasAi: boolean): { residency: string[]; reason: string } {
    if (isHealth) return { residency: ['EU'], reason: 'santé → UE only (HDS)' };
    if (hasAi) return { residency: ['EU', 'US'], reason: 'mod_ai → US partiel (Gemini) + UE principal' };
    return { residency: ['EU'], reason: 'UE principal' };
}

function deriveArchivalStrategy(stockNature: string): { months: number; storage: 'hot' | 'warm' | 'cold_glacier'; reason: string } {
    const isPerishable = stockNature === 'perishable';
    return {
        months: isPerishable ? 12 : 36,
        storage: isPerishable ? 'warm' : 'cold_glacier',
        reason: isPerishable ? 'périssable → archivage annuel' : 'standard → archivage triennal cold storage',
    };
}

export function deriveBackup(input: BackupDeriverInput): DerivedBackup {
    const { answers, variant, effectiveCapabilities: caps, transactionsPerDay = 100 } = input;
    const derivedFrom: Record<string, string> = {};

    const isHealth = variant === 'clinic' || variant === 'veterinary';
    const scale = answers.axis1_scale;

    const { freq, reason: freqReason } = deriveBackupFrequency(isHealth, scale, transactionsPerDay);
    derivedFrom['backupFrequency'] = freqReason;

    const { level, reason: encReason } = deriveEncryptionAtRest(isHealth, !!caps['mod_pos'], transactionsPerDay);
    derivedFrom['encryptionAtRest'] = encReason;

    const dr = deriveDrObjective(isHealth, scale);
    derivedFrom['dr'] = dr.reasoning;

    const { residency, reason: resReason } = deriveDataResidency(isHealth, !!caps['mod_ai']);
    derivedFrom['dataResidency'] = resReason;

    const { months, storage, reason: archReason } = deriveArchivalStrategy(answers.axis4_stockNature);
    derivedFrom['archivalStrategy'] = archReason;

    return {
        backupFrequency: freq,
        encryptionAtRest: level,
        dr,
        dataResidency: residency,
        archivalAfterMonths: months,
        archiveStorage: storage,
        derivedFrom,
    };
}
