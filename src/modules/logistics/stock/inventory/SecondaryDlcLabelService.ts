/**
 * T57 — DLC secondaire J+3 non étiquetée (reste ouvert non daté).
 *
 * Règlement CE 852/2004 Annexe II Ch.9 : toute denrée dont l'emballage d'origine
 * est ouvert doit recevoir une étiquette "Date limite de consommation secondaire"
 * (DLCS) = date d'ouverture + 3 jours (par défaut sauf réglementation spécifique).
 *
 * Ce service enregistre l'ouverture d'un produit et calcule sa DLCS.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § T57 (HAUT).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { OutboxService, OutboxPriority } from '@/lib/offline/OutboxService';

export interface DlcsEntry {
  id: string;
  tenantId: string;
  productId: string;
  batchId: string;
  openedAt: number;
  secondaryDlcAt: number;
  daysUntilExpiry: number;
  recordedBy: string;
}

const DEFAULT_SECONDARY_DLC_DAYS = 3;

export class SecondaryDlcLabelService {
  static computeDlcs(openedAt: number, daysUntilExpiry = DEFAULT_SECONDARY_DLC_DAYS): number {
    return openedAt + daysUntilExpiry * 86400_000;
  }

  static async recordOpening(input: {
    tenantId: string;
    productId: string;
    batchId: string;
    openedBy: string;
    daysUntilExpiry?: number;
    now?: number;
  }): Promise<DlcsEntry> {
    const now = input.now ?? Date.now();
    const daysUntilExpiry = input.daysUntilExpiry ?? DEFAULT_SECONDARY_DLC_DAYS;
    const secondaryDlcAt = this.computeDlcs(now, daysUntilExpiry);

    const entry: DlcsEntry = {
      id: `dlcs_${input.productId}_${input.batchId}_${now}`,
      tenantId: input.tenantId,
      productId: input.productId,
      batchId: input.batchId,
      openedAt: now,
      secondaryDlcAt,
      daysUntilExpiry,
      recordedBy: input.openedBy,
    };

    await Nexus.adapter.set(`tenants/${input.tenantId}/secondary_dlc/${entry.id}`, entry);
    await OutboxService.enqueue({
      action: 'CREATE',
      collection: `tenants/${input.tenantId}/secondary_dlc`,
      targetId: entry.id,
      priority: OutboxPriority.SANITAIRE,
      payload: entry as unknown as Record<string, unknown>,
    }).catch(() => 0);

    await NexusEventBus.emit('logistics.secondary_dlc_label_required', {
      v: 1,
      tenantId: input.tenantId,
      productId: input.productId,
      batchId: input.batchId,
      openedAt: now,
      secondaryDlcAt,
    });

    return entry;
  }
}
