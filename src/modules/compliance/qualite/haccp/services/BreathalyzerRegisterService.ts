/**
 * T94 — Registre éthylomètre (établissements avec animation).
 *
 * Décret 2012-284 (art. R. 234-1 Code de la Route) :
 * Les établissements recevant du public avec vente d'alcool doivent
 * mettre à disposition des éthylotests NF à titre gratuit.
 * Depuis 2012, obligation dans les boîtes de nuit et bars avec animation.
 *
 * Ce service trace :
 *  - Le stock d'éthylotests disponibles (alerte si < MIN_STOCK)
 *  - Les utilisations enregistrées par le staff
 *  - Le résultat (pour les protocoles internes — pas transmis)
 *
 * Cf. docs/anglemort-restaurant-mcc.md § T94.
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { OutboxService, OutboxPriority } from '@/lib/offline/OutboxService';

const MIN_STOCK_ALERT = 5;

export interface EthylotestUsage {
  id: string;
  tenantId: string;
  usedAt: number;
  usedBy: string;
  result: 'pass' | 'fail' | 'refused';
  legalRef: 'Decret 2012-284';
}

export class BreathalyzerRegisterService {
  private static stockPath(tenantId: string): string {
    return `tenants/${tenantId}/breathalyzer_stock`;
  }

  static async getStock(tenantId: string): Promise<number> {
    const record = await Nexus.adapter.get<{ count: number }>(this.stockPath(tenantId));
    return record?.count ?? 0;
  }

  static async setStock(tenantId: string, count: number, updatedBy: string, now?: number): Promise<void> {
    const ts = now ?? Date.now();
    await Nexus.adapter.set(this.stockPath(tenantId), { count, updatedBy, updatedAt: ts });
    if (count < MIN_STOCK_ALERT) {
      await NexusEventBus.emit('compliance.breathalyzer_stock_low', {
        v: 1,
        tenantId,
        currentStock: count,
        minStock: MIN_STOCK_ALERT,
        detectedAt: ts,
      }).catch(() => null);
    }
  }

  static async recordUsage(input: {
    tenantId: string;
    usedBy: string;
    result: 'pass' | 'fail' | 'refused';
    now?: number;
  }): Promise<EthylotestUsage> {
    const now = input.now ?? Date.now();
    const id = `eth_${now}_${input.usedBy}`;

    const currentStock = await this.getStock(input.tenantId);
    if (currentStock > 0) {
      await this.setStock(input.tenantId, currentStock - 1, input.usedBy, now);
    }

    const usage: EthylotestUsage = {
      id,
      tenantId: input.tenantId,
      usedAt: now,
      usedBy: input.usedBy,
      result: input.result,
      legalRef: 'Decret 2012-284',
    };

    await Nexus.adapter.set(`tenants/${input.tenantId}/breathalyzer_usages/${id}`, usage);
    await OutboxService.enqueue({
      action: 'CREATE',
      collection: `tenants/${input.tenantId}/breathalyzer_usages`,
      targetId: id,
      priority: OutboxPriority.LEGAL,
      payload: usage as unknown as Record<string, unknown>,
    }).catch(() => 0);

    return usage;
  }
}
