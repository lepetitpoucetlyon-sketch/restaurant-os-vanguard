import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface ModifierDelta {
  added: string[];
  removed: string[];
}

export interface KDSItemModificationRequest {
  tenantId: string;
  orderId: string;
  itemId: string;
  dishName: string;
  originalModifiers: string[];
  newModifiers: string[];
}

export interface KDSItemModificationResult {
  itemId: string;
  hasDelta: boolean;
  delta: ModifierDelta;
  kdsDisplayBadge: string;
  isReprintNeeded: boolean;
}

/**
 * KDSItemDeltaModificationService — Angle mort L10.
 * Calcule le delta d'instructions en cuisine pour surligner visuellement en rouge/vert les modifications sans réimprimer ni recuire le plat entier.
 */
export class KDSItemDeltaModificationService {
  static computeDelta(req: KDSItemModificationRequest): KDSItemModificationResult {
    const added = req.newModifiers.filter(m => !req.originalModifiers.includes(m));
    const removed = req.originalModifiers.filter(m => !req.newModifiers.includes(m));
    const hasDelta = added.length > 0 || removed.length > 0;

    const badges: string[] = [];
    if (added.length > 0) badges.push(`+ AJOUT: ${added.join(', ')}`);
    if (removed.length > 0) badges.push(`- SANS: ${removed.join(', ')}`);

    if (hasDelta) {
      NexusEventBus.emit('kds.item_delta_modified', {
        v: 1,
        tenantId: req.tenantId,
        orderId: req.orderId,
        itemId: req.itemId,
        addedModifiers: added,
        removedModifiers: removed,
        modifiedAt: Date.now(),
      });
    }

    return {
      itemId: req.itemId,
      hasDelta,
      delta: { added, removed },
      kdsDisplayBadge: badges.join(' | ') || 'AUCUNE MODIF',
      isReprintNeeded: false, // Smart KDS updates inline
    };
  }
}
