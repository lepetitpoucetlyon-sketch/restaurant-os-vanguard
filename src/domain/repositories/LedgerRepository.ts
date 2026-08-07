import { BaseRepository } from './BaseRepository';
import type { JournalEntry, FiscalSeal } from '@nexus/contracts';
import type { NexusContext } from '@/lib/nexus/types';
import { Nexus } from '@/lib/nexus/NexusAdapter';

export class LedgerRepository extends BaseRepository<JournalEntry> {
  constructor() {
    super('journalEntries');
  }

  /**
   * Enforces NF525 Append-Only invariant: No updating or deleting past journal entries.
   */
  override async delete(_id: string, _context: NexusContext): Promise<void> {
    throw new Error('[NF525 FISCAL VIOLATION] Journal entries are immutable and cannot be deleted.');
  }

  async appendEntry(entry: JournalEntry, context: NexusContext): Promise<void> {
    await this.save(entry, context);
  }

  async getLastFiscalSeal(context: NexusContext): Promise<FiscalSeal | null> {
    const sealsPath = `tenants/${context.vassalId}/fiscalSeals`;
    const result = await Nexus.adapter.query<FiscalSeal>(sealsPath, {
      orderBy: { field: 'timestamp', direction: 'desc' },
      limit: 1,
    }, context);
    return result[0] ?? null;
  }
}

export const ledgerRepository = new LedgerRepository();
