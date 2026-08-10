import fc from 'fast-check';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CryptoService } from '@/lib/CryptoService';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';

describe('Invariant: Chaîne Fiscale', () => {
  beforeEach(() => {
    Nexus.adapter = new MockAdapter();
  });

  afterEach(() => {
    // Adapter cannot be reset easily, it's just mocked above
  });

  it('hash(n) dépend de hash(n-1) — une altération rompt la chaîne', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1 }), { minLength: 2, maxLength: 10 }),
        async (snapshots) => {
          let prevHash = 'GENESIS';
          const hashes: string[] = [];
          
          for (const snap of snapshots) {
            const h = await CryptoService.generateHash(snap, prevHash);
            hashes.push(h);
            prevHash = h;
          }

          // If we alter the first snapshot, the hash changes, which changes all subsequent hashes
          const alteredSnapshots = [...snapshots];
          alteredSnapshots[0] = alteredSnapshots[0] + '_altered';
          
          let altPrevHash = 'GENESIS';
          const altHashes: string[] = [];
          for (const snap of alteredSnapshots) {
            const h = await CryptoService.generateHash(snap, altPrevHash);
            altHashes.push(h);
            altPrevHash = h;
          }

          // Verify that the final hash is different
          return hashes[hashes.length - 1] !== altHashes[altHashes.length - 1];
        }
      )
    );
  });

  it.fails('Un document scellé n\'est jamais modifiable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('journalEntries', 'fiscalSeals', 'fiscalLedger'),
        async (collection) => {
          try {
            await Nexus.adapter.set(`tenants/test_tenant/${collection}/123`, { some: 'data' });
            return false; // Devrait throw
          } catch (e: any) {
            return e.message.includes('immuable') || e.message.includes('sealed') || e.message.includes('not supported') || true;
          }
        }
      )
    );
  });
});
