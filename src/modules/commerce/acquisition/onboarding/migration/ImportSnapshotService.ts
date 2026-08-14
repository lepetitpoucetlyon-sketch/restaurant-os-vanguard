import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import type { NexusContext } from '@/lib/nexus/types';
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

/**
 * Contexte d'accès ancré sur un tenant explicite.
 *
 * ⚠️ Ne JAMAIS revenir à `Nexus.tenantOverride` dans ce service : le singleton
 * `Nexus` est partagé entre toutes les requêtes concurrentes d'un même process
 * Node. Deux tenants appelant l'API en parallèle se marchent dessus et une
 * restauration peut écrire dans les données d'un autre client.
 * Le `vassalId` porté par le contexte scope le chemin ET alimente SovereignGuard.
 */
function ctx(tenantId: string, actorId = 'system'): NexusContext {
  return { vassalId: tenantId, actorId };
}

/** Refuse l'accès à un snapshot appartenant à un autre tenant. */
function assertOwnership(snapshot: ImportSnapshot, tenantId: string): void {
  if (snapshot.tenantId !== tenantId) {
    throw new Error(
      `[ImportSnapshot] Accès refusé : le snapshot ${snapshot.id} appartient à un autre tenant.`
    );
  }
}

export class ImportSnapshotService {
  static async take(tenantId: string, category: ImportCategory): Promise<ImportSnapshot> {
    const collections = CATEGORY_COLLECTIONS[category] ?? [];
    const docs: Record<string, unknown> = {};
    const context = ctx(tenantId);

    for (const col of collections) {
      try {
        const items = await Nexus.adapter.query<DocRecord>(col, { limit: 5000 }, context);
        for (const item of items) {
          const docId = item.id ?? (item as { _id?: string })._id ?? crypto.randomUUID();
          docs[`${col}/${docId}`] = item;
        }
      } catch (err) {
        // collection may not exist yet — empty snapshot is valid
        logger.debug('[ImportSnapshotService] Collection absente lors du snapshot', { col, error: err });
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

    await Nexus.adapter.set(`${SNAPSHOT_COLLECTION}/${id}`, snapshot, undefined, context);
    return snapshot;
  }

  static async restore(snapshotId: string, tenantId: string): Promise<void> {
    const context = ctx(tenantId);

    const raw = await Nexus.adapter.get<ImportSnapshot>(
      `${SNAPSHOT_COLLECTION}/${snapshotId}`,
      context
    );
    if (!raw) throw new Error(`Snapshot introuvable : ${snapshotId}`);
    // Sans ce contrôle, connaître l'identifiant d'un snapshot suffisait à recopier
    // les données d'un autre tenant dans le sien.
    assertOwnership(raw, tenantId);
    const snapshot = raw;

    const batch = Nexus.adapter.batch(context);

    for (const col of snapshot.collections) {
      try {
        const current = await Nexus.adapter.query<DocRecord>(col, { limit: 5000 }, context);
        for (const item of current) {
          const docId = item.id ?? (item as { _id?: string })._id;
          if (docId) batch.delete(`${col}/${docId}`);
        }
      } catch (err) {
        // ignore missing collections
        logger.debug('[ImportSnapshotService] Collection absente lors de la restauration', { col, error: err });
      }
    }

    for (const [path, data] of Object.entries(snapshot.docs)) {
      batch.set(path, data);
    }

    await batch.commit();
  }

  static async list(tenantId: string, category?: ImportCategory): Promise<ImportSnapshot[]> {
    const all = await Nexus.adapter.query<ImportSnapshot>(
      SNAPSHOT_COLLECTION,
      { orderBy: { field: 'createdAt', direction: 'desc' }, limit: 20 },
      ctx(tenantId)
    );
    // Défense en profondeur : le scoping par vassalId doit déjà filtrer, mais un
    // snapshot mal ancré ne doit jamais remonter dans la liste d'un autre tenant.
    const owned = all.filter(s => s.tenantId === tenantId);
    return category ? owned.filter(s => s.category === category) : owned;
  }

  static async delete(snapshotId: string, tenantId: string): Promise<void> {
    const context = ctx(tenantId);
    const raw = await Nexus.adapter.get<ImportSnapshot>(
      `${SNAPSHOT_COLLECTION}/${snapshotId}`,
      context
    );
    if (!raw) return;
    assertOwnership(raw, tenantId);
    await Nexus.adapter.delete(`${SNAPSHOT_COLLECTION}/${snapshotId}`, context);
  }
}
