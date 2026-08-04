import { Nexus } from '@/lib/nexus/NexusAdapter';
        // FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
         
import { StatementIngestionService } from '@/shared/nexus/engines/Ledger/accounting/domain/StatementIngestionService';
        // FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
         
import { inferPCGAccount } from '@/verticals/restaurant/finance/cash/banking/openBanking/pcgHeuristics';
import type { ParsedFile, ImportResult } from '../types';

// Cross-impact: StatementIngestionService already has a robust CSV parser with SHA-256 dedup.
// We wrap it here to give it an accessible UI entry point. The PCG heuristic is shared with
// the Powens/agrégateur sync (src/domain/finance/banking/openBanking) so manual CSV imports
// and live bank sync classify transactions identically.

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
