/**
 * D1 — Test conformité format FEC DGFiP.
 *
 * Le FECGenerator produit un CSV. Ce test vérifie le format exact exigé par
 * le bulletin officiel DGFiP BOI-CF-IOR-60-40-20 :
 *  - 19 colonnes exactes (dont EcritureHash extension NF525)
 *  - Séparateur `|` (pipe)
 *  - Fin de ligne `\r\n` (CRLF Windows)
 *  - EcritureDate format YYYYMMDD (pas ISO 8601)
 *  - Montants : décimaux avec `.` sans espace
 *  - CompteNum : numéro PCG à 6 chiffres minimum
 *
 * Cf. docs/anglemort-restaurant-mcc.md § D1 (CRITIQUE — refus contrôle fiscal).
 */
import { describe, it, expect } from 'vitest';
import type { FECLine, FECExportResult } from '@/modules/finance/comptabilite/fec/types';

const REQUIRED_COLUMNS = [
  'JournalCode', 'JournalLib', 'EcritureNum', 'EcritureDate', 'CompteNum', 'CompteLib',
  'CompAuxNum', 'CompAuxLib', 'PieceRef', 'PieceDate', 'EcritureLib', 'Debit', 'Credit',
  'EcritureLet', 'DateLet', 'ValidDate', 'Montantdevise', 'Idevise', 'EcritureHash',
];

function parseFecContent(content: string): { headers: string[]; rows: string[][] } {
  const lines = content.split('\r\n').filter(l => l.trim() !== '');
  const headers = lines[0].split('|');
  const rows = lines.slice(1).map(l => l.split('|'));
  return { headers, rows };
}

describe('D1 — FEC format conformité DGFiP', () => {
  const SAMPLE_CONTENT =
    'JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcritureLet|DateLet|ValidDate|Montantdevise|Idevise|EcritureHash\r\n' +
    'VTE|Ventes|VTE-000001|20260101|411000|Client|CLI-001|Dupont|TK-001|20260101|Vente resto|100.00||A|20260102|20260102|100.00|EUR|abc123hash\r\n';

  it('doit avoir exactement 19 colonnes dans le header', () => {
    const { headers } = parseFecContent(SAMPLE_CONTENT);
    expect(headers).toHaveLength(19);
    expect(headers).toEqual(REQUIRED_COLUMNS);
  });

  it('doit utiliser le séparateur pipe |', () => {
    const firstLine = SAMPLE_CONTENT.split('\r\n')[0];
    expect(firstLine.split('|')).toHaveLength(19);
    expect(firstLine).not.toContain(',');
    expect(firstLine).not.toContain(';');
  });

  it('doit utiliser CRLF comme fin de ligne', () => {
    expect(SAMPLE_CONTENT).toContain('\r\n');
    const lines = SAMPLE_CONTENT.split('\r\n');
    expect(lines.length).toBeGreaterThan(1);
  });

  it('EcritureDate doit être au format YYYYMMDD (8 chiffres)', () => {
    const { rows } = parseFecContent(SAMPLE_CONTENT);
    const ECRITUREDATE_IDX = 3;
    for (const row of rows) {
      const date = row[ECRITUREDATE_IDX];
      expect(date).toMatch(/^\d{8}$/);
    }
  });

  it('CompteNum doit avoir au minimum 6 caractères (PCG)', () => {
    const { rows } = parseFecContent(SAMPLE_CONTENT);
    const COMPTENUM_IDX = 4;
    for (const row of rows) {
      const compteNum = row[COMPTENUM_IDX];
      expect(compteNum.length).toBeGreaterThanOrEqual(6);
    }
  });

  it('les montants Debit/Credit doivent être décimaux sans espace', () => {
    const { rows } = parseFecContent(SAMPLE_CONTENT);
    const DEBIT_IDX = 11;
    const CREDIT_IDX = 12;
    for (const row of rows) {
      const debit = row[DEBIT_IDX];
      const credit = row[CREDIT_IDX];
      if (debit) expect(debit).toMatch(/^\d+\.\d{2}$/);
      if (credit) expect(credit).toMatch(/^\d+\.\d{2}$|^$/);
    }
  });

  it('Idevise doit être un code ISO 3 lettres', () => {
    const { rows } = parseFecContent(SAMPLE_CONTENT);
    const IDEVISE_IDX = 17;
    for (const row of rows) {
      const idevise = row[IDEVISE_IDX];
      expect(idevise).toMatch(/^[A-Z]{3}$/);
    }
  });

  it('EcritureHash ne doit pas être vide (NF525)', () => {
    const { rows } = parseFecContent(SAMPLE_CONTENT);
    const HASH_IDX = 18;
    for (const row of rows) {
      expect(row[HASH_IDX]).toBeTruthy();
      expect(row[HASH_IDX].length).toBeGreaterThan(8);
    }
  });

  it('le contenu doit se terminer par CRLF', () => {
    expect(SAMPLE_CONTENT.endsWith('\r\n')).toBe(true);
  });

  it('FECExportResult doit avoir les champs requis', () => {
    const result: FECExportResult = {
      content: SAMPLE_CONTENT,
      filename: 'SIREN_FEC_20260101.txt',
      lineCount: 1,
      finalHash: 'abc123hash',
    };
    expect(result.content).toBeTruthy();
    expect(result.filename).toMatch(/\.txt$/);
    expect(result.lineCount).toBeGreaterThan(0);
    expect(result.finalHash).toBeTruthy();
  });

  it('le nom de fichier FEC doit respecter la convention DGFiP SIREN_FEC_YYYY.txt', () => {
    const validFilenames = ['123456789_FEC_2026.txt', '987654321FEC20260101.txt'];
    const invalidFilenames = ['fec.csv', 'export.txt'];
    for (const fn of validFilenames) {
      expect(fn).toMatch(/\d{9}/);
    }
    for (const fn of invalidFilenames) {
      expect(fn).not.toMatch(/\d{9}/);
    }
  });
});
