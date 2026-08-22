/**
 * L62 — Bordereau BSDD huiles alimentaires usagées (ISCC-EU).
 *
 * Les huiles alimentaires usagées (HAU) sont des déchets dangereux classés
 * sous le code 20 01 25 (déchets organiques). Tout producteur doit émettre
 * un Bordereau de Suivi des Déchets Dangereux (BSDD) à chaque collecte.
 *
 * Sanctions DREAL : jusqu'à 15 000 € + 2 ans de prison (Art. L. 541-46 CE).
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L62 (HAUT).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { OutboxService, OutboxPriority } from '@/lib/offline/OutboxService';
import { AuditLogger } from '@/modules/compliance';

export interface BsddEntry {
  id: string;
  tenantId: string;
  collectionDate: string;
  volumeLiters: number;
  containerType: 'bidon_20L' | 'fut_200L' | 'container_1000L';
  collectorSiret: string;
  collectorName: string;
  wasteCode: '20 01 25';
  bsddNumber: string;
  generatedAt: number;
  recordedBy: string;
}

export class BsddWasteOilService {
  private static path(tenantId: string, id: string): string {
    return `tenants/${tenantId}/bsdd_waste_oil/${id}`;
  }

  static async record(input: {
    tenantId: string;
    collectionDate: string;
    volumeLiters: number;
    containerType: BsddEntry['containerType'];
    collectorSiret: string;
    collectorName: string;
    bsddNumber: string;
    recordedBy: string;
    now?: number;
  }): Promise<BsddEntry> {
    if (input.volumeLiters <= 0) throw new Error('BsddWasteOil: volumeLiters doit être > 0');
    if (!input.collectorSiret.match(/^\d{14}$/)) {
      throw new Error('BsddWasteOil: SIRET collecteur invalide (14 chiffres requis)');
    }

    const now = input.now ?? Date.now();
    const entry: BsddEntry = {
      id: `bsdd_${input.tenantId}_${input.collectionDate}_${now}`,
      tenantId: input.tenantId,
      collectionDate: input.collectionDate,
      volumeLiters: input.volumeLiters,
      containerType: input.containerType,
      collectorSiret: input.collectorSiret,
      collectorName: input.collectorName,
      wasteCode: '20 01 25',
      bsddNumber: input.bsddNumber,
      generatedAt: now,
      recordedBy: input.recordedBy,
    };

    await Nexus.adapter.set(this.path(input.tenantId, entry.id), entry);
    await OutboxService.enqueue({
      action: 'CREATE',
      collection: `tenants/${input.tenantId}/legal/bsdd`,
      targetId: entry.id,
      priority: OutboxPriority.LEGAL,
      payload: entry as unknown as Record<string, unknown>,
    }).catch(() => 0);

    await AuditLogger.logAction(
      input.recordedBy,
      'BSDD_WASTE_OIL_RECORDED',
      entry.id,
      { volumeLiters: input.volumeLiters, collectorSiret: input.collectorSiret, bsddNumber: input.bsddNumber },
    ).catch(() => null);

    await NexusEventBus.emit('compliance.bsdd_waste_oil_recorded', {
      v: 1,
      tenantId: input.tenantId,
      entryId: entry.id,
      volumeLiters: input.volumeLiters,
      collectorSiret: input.collectorSiret,
      recordedAt: now,
    });

    return entry;
  }
}
