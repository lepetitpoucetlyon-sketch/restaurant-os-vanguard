import { Nexus } from '@/lib/nexus/NexusAdapter';
import { StatementIngestionService } from '@/modules/finance/accounting/domain/StatementIngestionService';
import type { ParsedFile, ImportResult } from '../types';

// Cross-impact: StatementIngestionService already has a robust CSV parser with SHA-256 dedup.
// We wrap it here to give it an accessible UI entry point.
// TODO: after inject → link each BankTransaction to a JournalEntry via PCG account mapping.
// That link is the missing piece between bank reconciliation and NF525 accounting.

const PCG_ACCOUNT_HEURISTICS: { pattern: RegExp; account: string; label: string }[] = [
  { pattern: /virement|salaire|paie/i, account: '641', label: 'Rémunérations du personnel' },
  { pattern: /urssaf|cotisation|social/i, account: '645', label: 'Charges de sécurité sociale' },
  { pattern: /loyer|bail|locatio/i, account: '613', label: 'Locations' },
  { pattern: /electricit|edf|gaz|energie/i, account: '606', label: 'Énergie' },
  { pattern: /transgourmet|metro|sysco|fournisseur|livraison marchandise/i, account: '607', label: 'Achats de marchandises' },
  { pattern: /assurance/i, account: '616', label: 'Primes d\'assurance' },
  { pattern: /telephone|orange|sfr|bouygues|free/i, account: '626', label: 'Frais postaux et de télécommunication' },
  { pattern: /banque|frais bancaire|commission/i, account: '627', label: 'Services bancaires' },
  { pattern: /vente|cb|tpe|ticket|stripe|sumup/i, account: '706', label: 'Prestations de services' },
  { pattern: /remboursement|avoir/i, account: '709', label: 'Rabais, remises, ristournes accordés' },
];

function inferPCGAccount(label: string): { account: string; label: string } | undefined {
  for (const h of PCG_ACCOUNT_HEURISTICS) {
    if (h.pattern.test(label)) return { account: h.account, label: h.label };
  }
  return undefined;
}

export async function importStatements(file: ParsedFile, rawFile: File, onProgress: (n: number) => void): Promise<ImportResult> {
  onProgress(5);

  // Delegate parsing to StatementIngestionService (has SHA-256 dedup built in)
  const text = await rawFile.text();
  onProgress(20);

  const transactions = await StatementIngestionService.parseCSV(text);
  onProgress(40);

  if (transactions.length === 0) {
    return { created: 0, updated: 0, skipped: 0, errors: [{ row: 0, message: 'Aucune transaction parsée' }] };
  }

  // Dedup: load existing signatures
  const existing = await Nexus.adapter.query<{ id: string; signature?: string }>('bankTransactions');
  const sigSet = new Set(existing.map(e => e.signature).filter(Boolean));
  onProgress(55);

  const batch = Nexus.adapter.batch();
  let created = 0, skipped = 0;

  for (const tx of transactions) {
    const sig = (tx as { signature?: string }).signature;
    if (sig && sigSet.has(sig)) { skipped++; continue; }

    const pcg = inferPCGAccount(tx.label ?? '');
    const id = Nexus.adapter.generateId('bankTransactions');
    batch.set(`bankTransactions/${id}`, {
      id,
      type: 'bankTransaction',
      date: tx.date,
      label: tx.label,
      amount: tx.amount,
      transactionType: tx.type, // 'credit' | 'debit'
      signature: sig,
      pcgAccount: pcg?.account,
      pcgLabel: pcg?.label,
      journalEntryId: null, // to be linked manually or via reconciliation flow
      importedAt: Date.now(),
    });
    created++;
  }

  await batch.commit();
  onProgress(100);
  return { created, updated: 0, skipped, errors: [] };
}
