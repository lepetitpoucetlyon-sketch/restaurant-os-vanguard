import { Nexus } from '@/lib/nexus/NexusAdapter';
import { CryptoService } from '@/lib/CryptoService';
import type { ParsedFile, ImportResult } from '../types';

// Cross-impact (NF525 CRITIQUE):
// - journalEntries/ collection is IMMUTABLE — no delete, no update, ever.
// - Each entry must be sealed with SHA-256 chained hash.
// - FEC from prior year = historical read-only data → sealed immediately on import.
// - These entries will appear in FEC export but marked as 'imported' (not POS-generated).

// Official FEC field order (DGFiP spec)
const FEC_FIELDS = [
  'JournalCode', 'JournalLib', 'EcritureNum', 'EcritureDate',
  'CompteNum', 'CompteLib', 'CompAuxNum', 'CompAuxLib',
  'PieceRef', 'PieceDate', 'EcritureLib',
  'Debit', 'Credit', 'EcritureLet',
  'DateLet', 'ValidDate', 'Montantdevise', 'Idevise',
];

function parseFECAmount(raw: string): number {
  if (!raw || raw.trim() === '') return 0;
  return Math.round(parseFloat(raw.replace(',', '.').replace(/[^0-9.\-]/g, '')) * 1_000_000) || 0;
}

function parseFECDate(raw: string): number {
  // FEC date format: YYYYMMDD
  if (/^\d{8}$/.test(raw)) {
    return new Date(`${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`).getTime();
  }
  return Date.parse(raw) || Date.now();
}

export async function importFEC(file: ParsedFile, onProgress: (n: number) => void): Promise<ImportResult> {
  onProgress(5);

  if (file.rows.length === 0) {
    return { created: 0, updated: 0, skipped: 0, errors: [{ row: 0, message: 'Fichier FEC vide' }] };
  }

  // Get the last journal entry to continue the hash chain
  const existingEntries = await Nexus.adapter.query<{ id: string; fiscalSeal?: { hash: string }; createdAt?: number }>(
    'journalEntries',
    { orderBy: { field: 'createdAt', direction: 'desc' }, limit: 1 }
  );
  let previousHash = existingEntries[0]?.fiscalSeal?.hash ?? '0000000000000000000000000000000000000000000000000000000000000000';
  onProgress(20);

  const batch = Nexus.adapter.batch();
  let created = 0, skipped = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < file.rows.length; i++) {
    const row = file.rows[i];
    onProgress(20 + Math.round((i / file.rows.length) * 65));

    const ecritureNum = row['EcritureNum'] ?? row[FEC_FIELDS[2]] ?? '';
    const ecritureDate = parseFECDate(row['EcritureDate'] ?? row[FEC_FIELDS[3]] ?? '');
    const compteNum = row['CompteNum'] ?? row[FEC_FIELDS[4]] ?? '';
    const compteLib = row['CompteLib'] ?? row[FEC_FIELDS[5]] ?? '';
    const ecritureLib = row['EcritureLib'] ?? row[FEC_FIELDS[10]] ?? '';
    const debitMicrounits = parseFECAmount(row['Debit'] ?? row[FEC_FIELDS[11]] ?? '');
    const creditMicrounits = parseFECAmount(row['Credit'] ?? row[FEC_FIELDS[12]] ?? '');
    const journalCode = row['JournalCode'] ?? row[FEC_FIELDS[0]] ?? '';
    const journalLib = row['JournalLib'] ?? row[FEC_FIELDS[1]] ?? '';

    if (!ecritureNum && !compteNum) { skipped++; continue; }
    if (debitMicrounits === 0 && creditMicrounits === 0) { skipped++; continue; }

    const dataSnapshot = JSON.stringify({ ecritureNum, ecritureDate, compteNum, debitMicrounits, creditMicrounits });
    let sealHash: string;
    try {
      sealHash = await CryptoService.generateHash(dataSnapshot, previousHash);
    } catch {
      errors.push({ row: i + 2, message: `Erreur de scellement ligne ${i + 2}` });
      continue;
    }

    const id = Nexus.adapter.generateId('journalEntries');
    batch.set(`journalEntries/${id}`, {
      id,
      type: 'journalEntry',
      source: 'fec_import',
      journalCode,
      journalLib,
      ecritureNum,
      ecritureDate,
      compteNum,
      compteLib,
      ecritureLib,
      debitInMicrounits: debitMicrounits,
      creditInMicrounits: creditMicrounits,
      fiscalSeal: {
        hash: sealHash,
        previousHash,
        sequence: i,
        signedPayload: dataSnapshot,
      },
      // Immutable marker — SovereignGuard will refuse updates to this collection
      immutable: true,
      importedFromFEC: true,
      createdAt: Date.now(),
    });

    previousHash = sealHash;
    created++;
  }

  await batch.commit();
  onProgress(100);
  return { created, updated: 0, skipped, errors };
}
