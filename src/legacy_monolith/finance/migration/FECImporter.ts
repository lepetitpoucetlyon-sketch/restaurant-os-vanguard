/**
 * FECImporter — mig-13
 *
 * Importe un Fichier des Écritures Comptables (FEC) DGFiP d'un exercice précédent
 * en lecture seule, marqué 'historical'. Ces entrées :
 *
 * - NE sont PAS injectées dans la chaîne de scellage NF525 active.
 * - Sont immuables : jamais delete, jamais update (SovereignGuard l'impose).
 * - Apparaissent dans les exports FEC historiques avec status='historical'.
 *
 * Format DGFiP : pipe-séparé (|), 18 champs fixes, encodage UTF-8 ou ISO-8859-1.
 * Référence : https://www.impots.gouv.fr/portail/files/media/1_metier/5_fec/specifications_fec.pdf
 */

import { Nexus } from '@/lib/nexus/NexusAdapter';
import { toMicrounits } from '@/domain/schemas/primitives';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface FECEntry {
  JournalCode: string;
  JournalLib: string;
  EcritureNum: string;
  EcritureDate: string;   // YYYYMMDD
  CompteNum: string;       // Compte PCG
  CompteLib: string;
  CompAuxNum?: string;
  CompAuxLib?: string;
  PieceRef?: string;
  PieceDate?: string;
  EcritureLib: string;
  Debit: string;           // Décimal avec virgule ou point (ex: "1250,00")
  Credit: string;
  EcritureLet?: string;
  DateLet?: string;
  ValidDate?: string;
  Montantdevise?: string;
  Idevise?: string;
}

export interface FECImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

// ── Constantes ─────────────────────────────────────────────────────────────────

/** Ordre canonique des champs FEC DGFiP */
export const FEC_FIELD_ORDER: (keyof FECEntry)[] = [
  'JournalCode', 'JournalLib', 'EcritureNum', 'EcritureDate',
  'CompteNum', 'CompteLib', 'CompAuxNum', 'CompAuxLib',
  'PieceRef', 'PieceDate', 'EcritureLib',
  'Debit', 'Credit', 'EcritureLet',
  'DateLet', 'ValidDate', 'Montantdevise', 'Idevise',
];

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Parse un montant FEC (virgule ou point comme séparateur décimal)
 * et le convertit en microunits (1 € = 1 000 000 µ).
 */
export function parseFECAmount(raw: string): number {
  if (!raw || raw.trim() === '') return 0;
  const normalized = raw.trim().replace(',', '.').replace(/[^0-9.\-]/g, '');
  const euros = parseFloat(normalized);
  if (isNaN(euros)) return 0;
  // Arrondi entier pour éviter les erreurs floating-point
  return toMicrounits(Math.round(euros * 1_000_000));
}

/**
 * Parse une date FEC (YYYYMMDD) en timestamp ms.
 * Fallback sur Date.parse si le format ne correspond pas.
 */
export function parseFECDate(raw: string): number {
  if (/^\d{8}$/.test(raw.trim())) {
    const s = raw.trim();
    const ts = new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`).getTime();
    return isNaN(ts) ? Date.now() : ts;
  }
  const ts = Date.parse(raw);
  return isNaN(ts) ? Date.now() : ts;
}

// ── Parsing FEC ────────────────────────────────────────────────────────────────

function buildFECEntry(cells: string[], fieldMap: string[]): FECEntry {
  const get = (field: string): string => {
    const idx = fieldMap.indexOf(field);
    return idx >= 0 ? (cells[idx] ?? '').trim() : '';
  };
  return {
    JournalCode:   get('JournalCode'),
    JournalLib:    get('JournalLib'),
    EcritureNum:   get('EcritureNum'),
    EcritureDate:  get('EcritureDate'),
    CompteNum:     get('CompteNum'),
    CompteLib:     get('CompteLib'),
    CompAuxNum:    get('CompAuxNum') || undefined,
    CompAuxLib:    get('CompAuxLib') || undefined,
    PieceRef:      get('PieceRef') || undefined,
    PieceDate:     get('PieceDate') || undefined,
    EcritureLib:   get('EcritureLib'),
    Debit:         get('Debit'),
    Credit:        get('Credit'),
    EcritureLet:   get('EcritureLet') || undefined,
    DateLet:       get('DateLet') || undefined,
    ValidDate:     get('ValidDate') || undefined,
    Montantdevise: get('Montantdevise') || undefined,
    Idevise:       get('Idevise') || undefined,
  };
}

/**
 * Parse le contenu brut d'un fichier FEC pipe-séparé.
 *
 * Gère :
 * - Séparateur | (pipe) uniquement (spec DGFiP stricte)
 * - Encodage UTF-8 et ISO-8859-1 (translitération déjà faite côté lecture)
 * - BOM UTF-8 en tête de fichier
 * - Ligne d'en-tête optionnelle (détectée si elle contient "JournalCode")
 */
export function parseFECContent(content: string): { entries: FECEntry[]; warnings: string[] } {
  const warnings: string[] = [];

  const clean = content.replace(/^﻿/, '');
  const lines = clean.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  if (lines.length === 0) {
    return { entries: [], warnings: ['Fichier vide'] };
  }

  let dataStart = 0;
  let fieldMap: string[] = FEC_FIELD_ORDER as string[];

  const firstLine = lines[0];
  if (firstLine.includes('JournalCode') || firstLine.includes('EcritureNum')) {
    fieldMap = firstLine.split('|').map(f => f.trim());
    dataStart = 1;
  }

  const entries: FECEntry[] = [];

  for (let i = dataStart; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cells = line.split('|');
    if (cells.length < 12) {
      warnings.push(`Ligne ${i + 1} : ${cells.length} champs (minimum 12 requis) — ignorée`);
      continue;
    }

    entries.push(buildFECEntry(cells, fieldMap));
  }

  return { entries, warnings };
}

// ── Importer ───────────────────────────────────────────────────────────────────

export class FECImporter {
  /**
   * Importe un FEC d'exercice précédent comme entrées historiques immuables.
   *
   * IMPORTANT — NF525 : ces entrées sont marquées status='historical' et ne
   * sont PAS enchaînées à la chaîne de scellage NF525 active. Elles restent
   * immuables via SovereignGuard (immutable: true).
   *
   * @param content   - Contenu brut du fichier FEC (pipe-séparé)
   * @param tenantId  - Identifiant du tenant actif
   * @param exercice  - Exercice comptable source (ex: "2024", "2023-2024")
   * @returns         { imported, skipped, errors }
   */
  async importFEC(
    content: string,
    tenantId: string,
    exercice: string
  ): Promise<FECImportResult> {
    const { entries, warnings } = parseFECContent(content);
    const errors: string[] = [...warnings];

    if (entries.length === 0) {
      return { imported: 0, skipped: 0, errors: ['Aucune écriture FEC valide trouvée'] };
    }

    const batch = Nexus.adapter.batch();
    let imported = 0;
    let skipped = 0;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      // Champs obligatoires
      if (!entry.EcritureNum && !entry.CompteNum) { skipped++; continue; }

      const debitMicrounits = parseFECAmount(entry.Debit);
      const creditMicrounits = parseFECAmount(entry.Credit);

      if (debitMicrounits === 0 && creditMicrounits === 0) { skipped++; continue; }

      const ecritureDate = parseFECDate(entry.EcritureDate);

      // Identifiant déterministe : exercice + numéro d'écriture + index
      // pour éviter les doublons en cas de ré-import
      const stableKey = `${exercice}_${entry.EcritureNum}_${i}`.replace(/[^a-zA-Z0-9_\-]/g, '_');
      const id = Nexus.adapter.generateId('journalEntries');

      batch.set(`journalEntries/${id}`, {
        id,
        type: 'journalEntry',
        // Marqueur historique — différencie des écritures POS en temps réel
        status: 'historical',
        source: 'fec_import',
        exercice,
        tenantId,

        // Champs FEC canoniques
        journalCode:  entry.JournalCode,
        journalLib:   entry.JournalLib,
        ecritureNum:  entry.EcritureNum,
        ecritureDate,
        compteNum:    entry.CompteNum,
        compteLib:    entry.CompteLib,
        compAuxNum:   entry.CompAuxNum,
        compAuxLib:   entry.CompAuxLib,
        pieceRef:     entry.PieceRef,
        pieceDate:    entry.PieceDate ? parseFECDate(entry.PieceDate) : undefined,
        ecritureLib:  entry.EcritureLib,

        // Montants en microunits (convention du projet)
        debitInMicrounits:  debitMicrounits,
        creditInMicrounits: creditMicrounits,

        // Devise (FEC optionnel)
        montantdevise: entry.Montantdevise,
        idevise:       entry.Idevise || 'EUR',

        // Immuabilité : SovereignGuard refuse tout update sur ces documents
        immutable: true,
        importedFromFEC: true,
        // Clé stable pour idempotence
        stableKey,

        // PAS de fiscalSeal : les entrées historiques ne s'injectent PAS
        // dans la chaîne NF525 active (FinancialNexusBridge / FiscalEngine)
        fiscalSeal: null,

        createdAt: Date.now(),
        importedAt: Date.now(),
      });

      imported++;
    }

    await batch.commit();
    return { imported, skipped, errors };
  }

  /**
   * Valide le format d'un FEC sans importer.
   * Retourne les 5 premières entrées pour prévisualisation.
   */
  preview(content: string): { entries: FECEntry[]; warnings: string[]; isValid: boolean } {
    const { entries, warnings } = parseFECContent(content);
    const preview = entries.slice(0, 5);
    const isValid = entries.length > 0 && entries[0].JournalCode !== '' && entries[0].CompteNum !== '';
    return { entries: preview, warnings, isValid };
  }
}
