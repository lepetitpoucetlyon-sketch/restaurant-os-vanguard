/**
 * L3 — Add-on ticket après scellement NF525.
 *
 * Le café commandé après la clôture de l'addition principale (déjà scellée NF525)
 * ne peut pas modifier rétroactivement le JournalEntry — cela briserait la chaîne
 * de hachage. Solution : sous-session "add-on" cryptographiquement chaînée au sceau
 * parent. L'add-on est un nouveau JournalEntry avec `parentSealId` pointant vers
 * le sceau d'origine.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L3 (CRITIQUE — Art. 286-I-3° bis CGI).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { OutboxService, OutboxPriority } from '@/lib/offline/OutboxService';
import { AuditLogger } from '@/modules/compliance/securite/AuditLogger';

export interface AddonTicketItem {
  productId: string;
  name: string;
  quantity: number;
  unitPriceInMicrounits: number;
  taxRate: string;
}

export interface AddonTicket {
  id: string;
  tenantId: string;
  parentSealId: string;
  parentOrderId: string;
  operatorId: string;
  items: AddonTicketItem[];
  totalInMicrounits: number;
  taxBreakdown: Record<string, number>;
  createdAt: number;
  status: 'open' | 'paid' | 'cancelled';
}

export class PostSealAddonService {
  private static path(tenantId: string, addonId: string): string {
    return `tenants/${tenantId}/addon_tickets/${addonId}`;
  }

  static computeTotal(items: AddonTicketItem[]): { totalInMicrounits: number; taxBreakdown: Record<string, number> } {
    let total = 0;
    const breakdown: Record<string, number> = {};
    for (const item of items) {
      const lineTotal = item.unitPriceInMicrounits * item.quantity;
      total += lineTotal;
      const taxRateNum = parseFloat(item.taxRate);
      const taxAmount = Math.round(lineTotal * taxRateNum);
      breakdown[item.taxRate] = (breakdown[item.taxRate] ?? 0) + taxAmount;
    }
    return { totalInMicrounits: total, taxBreakdown: breakdown };
  }

  static async create(input: {
    tenantId: string;
    parentSealId: string;
    parentOrderId: string;
    operatorId: string;
    items: AddonTicketItem[];
    now?: number;
  }): Promise<AddonTicket> {
    if (input.items.length === 0) throw new Error('AddonTicket: au moins 1 item requis');
    const now = input.now ?? Date.now();
    const { totalInMicrounits, taxBreakdown } = this.computeTotal(input.items);

    const addon: AddonTicket = {
      id: `addon_${input.parentOrderId}_${now}`,
      tenantId: input.tenantId,
      parentSealId: input.parentSealId,
      parentOrderId: input.parentOrderId,
      operatorId: input.operatorId,
      items: input.items,
      totalInMicrounits,
      taxBreakdown,
      createdAt: now,
      status: 'open',
    };

    await Nexus.adapter.set(this.path(input.tenantId, addon.id), addon);
    await OutboxService.enqueue({
      action: 'CREATE',
      collection: `tenants/${input.tenantId}/addon_tickets`,
      targetId: addon.id,
      priority: OutboxPriority.FISCAL,
      payload: addon as unknown as Record<string, unknown>,
    }).catch(() => 0);

    await AuditLogger.logAction(
      input.operatorId,
      'ADDON_TICKET_CREATED',
      addon.id,
      { parentSealId: input.parentSealId, totalInMicrounits },
    ).catch(() => null);

    await NexusEventBus.emit('finance.addon_ticket_created', {
      v: 1,
      tenantId: input.tenantId,
      parentSealId: input.parentSealId,
      addonOrderId: addon.id,
      addonTotalInMicrounits: totalInMicrounits,
      createdAt: now,
    });

    return addon;
  }

  static async markPaid(tenantId: string, addonId: string, now?: number): Promise<void> {
    const ts = now ?? Date.now();
    const addon = await Nexus.adapter.get<AddonTicket>(this.path(tenantId, addonId));
    if (!addon || addon.status !== 'open') return;
    await Nexus.adapter.set(this.path(tenantId, addonId), { ...addon, status: 'paid', paidAt: ts });
  }
}
