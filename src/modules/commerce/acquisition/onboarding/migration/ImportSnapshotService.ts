import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { ImportCategory } from './types';

export interface ImportSnapshot {
  id: string;
  category: ImportCategory;
  tenantId: string;
  createdAt: number;
  collections: string[];
  docs: Record<string, unknown>;
}

const SNAPSHOT_COLLECTION = 'onboarding_snapshots';

const CATEGORY_COLLECTIONS: Record<ImportCategory, string[]> = {
  menu:         ['products', 'menu_categories'],
  staff:        ['staff'],
  crm:          ['customers'],
  suppliers:    ['suppliers'],
  inventory:    ['inventory_items'],
  recipes:      ['recipes'],
  reservations: ['reservations'],
  statements:   ['bank_statements'],
  fec:          ['fec_entries'],
  floorplan:    ['floor_plan_tables', 'floor_plan_zones'],
  haccp_history: ['haccp_historical', 'onboarding_documents'],
};

type DocRecord = Record<string, unknown> & { id?: string };

export class ImportSnapshotService {
  static async take(tenantId: string, category: ImportCategory): Promise<ImportSnapshot> {
    const collections = CATEGORY_COLLECTIONS[category] ?? [];
    const docs: Record<string, unknown> = {};

    for (const col of collections) {
      try {
        const items = await Nexus.adapter.query<DocRecord>(col, { limit: 5000 });
        for (const item of items) {
          const docId = item.id ?? (item as { _id?: string })._id ?? crypto.randomUUID();
          docs[`${col}/${docId}`] = item;
        }
      } catch {
        // collection may not exist yet — empty snapshot is valid
      }
    }

    const id = `snap_${category}_${Date.now()}`;
    const snapshot: ImportSnapshot = {
      id,
      category,
      tenantId,
      createdAt: Date.now(),
      collections,
      docs,
    };

    await Nexus.adapter.set(`${SNAPSHOT_COLLECTION}/${id}`, snapshot);
    return snapshot;
  }

  static async restore(snapshotId: string): Promise<void> {
    const raw = await Nexus.adapter.get<ImportSnapshot>(`${SNAPSHOT_COLLECTION}/${snapshotId}`);
    if (!raw) throw new Error(`Snapshot introuvable : ${snapshotId}`);
    const snapshot = raw;

    const batch = Nexus.adapter.batch();

    for (const col of snapshot.collections) {
      try {
        const current = await Nexus.adapter.query<DocRecord>(col, { limit: 5000 });
        for (const item of current) {
          const docId = item.id ?? (item as { _id?: string })._id;
          if (docId) batch.delete(`${col}/${docId}`);
        }
      } catch {
        // ignore missing collections
      }
    }

    for (const [path, data] of Object.entries(snapshot.docs)) {
      batch.set(path, data);
    }

    await batch.commit();
  }

  static async list(category?: ImportCategory): Promise<ImportSnapshot[]> {
    const all = await Nexus.adapter.query<ImportSnapshot>(SNAPSHOT_COLLECTION, {
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit: 20,
    });
    return category ? all.filter(s => s.category === category) : all;
  }

  static async delete(snapshotId: string): Promise<void> {
    await Nexus.adapter.delete(`${SNAPSHOT_COLLECTION}/${snapshotId}`);
  }
}
