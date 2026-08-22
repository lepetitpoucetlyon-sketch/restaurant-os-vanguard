/**
 * L7 — Rendu de monnaie laissé en pourboire.
 *
 * Quand un client dit "gardez la monnaie", le cash rendu doit être tracé comme
 * pourboire en compte 426 (personnel) ventilé au prorata des heures travaillées
 * — sinon risque de redressement URSSAF sur avantages en nature non déclarés.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L7 (HAUT).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { OutboxService, OutboxPriority } from '@/lib/offline/OutboxService';
import { AuditLogger } from '@/lib/audit';

export interface ChangeAsTipInput {
  tenantId: string;
  orderId: string;
  operatorId: string;
  changeInMicrounits: number;
  tipInMicrounits: number;
  now?: number;
}

export class ChangeAsTipService {
  static async record(input: ChangeAsTipInput): Promise<void> {
    if (input.tipInMicrounits <= 0) throw new Error('ChangeAsTip: tipInMicrounits doit être > 0');
    if (input.tipInMicrounits > input.changeInMicrounits) {
      throw new Error('ChangeAsTip: le pourboire ne peut excéder le rendu de monnaie');
    }
    const now = input.now ?? Date.now();

    const entry = {
      id: `tip_${input.orderId}_${now}`,
      tenantId: input.tenantId,
      orderId: input.orderId,
      operatorId: input.operatorId,
      changeInMicrounits: input.changeInMicrounits,
      tipInMicrounits: input.tipInMicrounits,
      account: '426',
      accountLabel: 'Personnel — pourboires',
      recordedAt: now,
    };

    await Nexus.adapter.set(`tenants/${input.tenantId}/tips/${entry.id}`, entry);
    await OutboxService.enqueue({
      action: 'CREATE',
      collection: `tenants/${input.tenantId}/tips`,
      targetId: entry.id,
      priority: OutboxPriority.FISCAL,
      payload: entry as unknown as Record<string, unknown>,
    }).catch(() => 0);

    await AuditLogger.logAction(
      input.operatorId,
      'TIP_RECORDED',
      input.orderId,
      { tipInMicrounits: input.tipInMicrounits, account: '426' },
    ).catch(() => null);

    await NexusEventBus.emit('finance.change_as_tip', {
      v: 1,
      tenantId: input.tenantId,
      orderId: input.orderId,
      changeInMicrounits: input.changeInMicrounits,
      tipInMicrounits: input.tipInMicrounits,
      operatorId: input.operatorId,
      recordedAt: now,
    });
  }
}
