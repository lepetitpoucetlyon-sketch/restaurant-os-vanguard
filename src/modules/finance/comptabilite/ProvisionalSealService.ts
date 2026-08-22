/**
 * L6 — Note provisoire anti-fraude.
 *
 * Scénario : le serveur imprime l'addition → encaisse le cash en dehors du
 * système → annule la commande. Résultat : vol interne indétectable.
 *
 * Solution : dès l'impression de l'addition (avant paiement), créer un
 * `journal_provisional` scellé. Toute annulation ultérieure exige un motif
 * et un log AuditLogger `PROVISIONAL_SEAL_ANNULLED` opposable.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L6 (CRITIQUE).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/lib/audit';
import { OutboxService, OutboxPriority } from '@/lib/offline/OutboxService';

export interface ProvisionalSeal {
  id: string;
  tenantId: string;
  orderId: string;
  operatorId: string;
  totalInMicrounits: number;
  status: 'open' | 'paid' | 'annulled';
  sealedAt: number;
  closedAt?: number;
  annulReason?: string;
  annulActorId?: string;
}

export class ProvisionalSealService {
  private static path(tenantId: string, sealId: string): string {
    return `tenants/${tenantId}/journal_provisional/${sealId}`;
  }

  static async createOnPrint(input: {
    tenantId: string;
    orderId: string;
    operatorId: string;
    totalInMicrounits: number;
    now?: number;
  }): Promise<ProvisionalSeal> {
    const now = input.now ?? Date.now();
    const seal: ProvisionalSeal = {
      id: `prov_${input.orderId}_${now}`,
      tenantId: input.tenantId,
      orderId: input.orderId,
      operatorId: input.operatorId,
      totalInMicrounits: input.totalInMicrounits,
      status: 'open',
      sealedAt: now,
    };

    await Nexus.adapter.set(this.path(input.tenantId, seal.id), seal);
    await OutboxService.enqueue({
      action: 'CREATE',
      collection: `tenants/${input.tenantId}/journal_provisional`,
      targetId: seal.id,
      priority: OutboxPriority.FISCAL,
      payload: seal as unknown as Record<string, unknown>,
    }).catch(() => 0);

    await NexusEventBus.emit('finance.provisional_seal_created', {
      v: 1,
      tenantId: input.tenantId,
      orderId: input.orderId,
      operatorId: input.operatorId,
      totalInMicrounits: input.totalInMicrounits,
      sealedAt: now,
    });

    return seal;
  }

  static async markPaid(tenantId: string, sealId: string, now?: number): Promise<void> {
    const ts = now ?? Date.now();
    const seal = await Nexus.adapter.get<ProvisionalSeal>(this.path(tenantId, sealId));
    if (!seal || seal.status !== 'open') return;
    await Nexus.adapter.set(this.path(tenantId, sealId), { ...seal, status: 'paid', closedAt: ts });
  }

  static async annul(input: {
    tenantId: string;
    sealId: string;
    actorId: string;
    reason: string;
    now?: number;
  }): Promise<void> {
    const now = input.now ?? Date.now();
    const seal = await Nexus.adapter.get<ProvisionalSeal>(this.path(input.tenantId, input.sealId));
    if (!seal) throw new Error(`ProvisionalSeal ${input.sealId} introuvable`);
    if (seal.status !== 'open') throw new Error(`ProvisionalSeal ${input.sealId} déjà clos (status=${seal.status})`);

    const updated: ProvisionalSeal = {
      ...seal,
      status: 'annulled',
      closedAt: now,
      annulReason: input.reason,
      annulActorId: input.actorId,
    };
    await Nexus.adapter.set(this.path(input.tenantId, input.sealId), updated);

    await AuditLogger.logAction(
      input.actorId,
      'PROVISIONAL_SEAL_ANNULLED',
      seal.orderId,
      { sealId: input.sealId, reason: input.reason, totalInMicrounits: seal.totalInMicrounits },
    ).catch(() => null);

    await NexusEventBus.emit('finance.provisional_seal_annulled', {
      v: 1,
      tenantId: input.tenantId,
      orderId: seal.orderId,
      actorId: input.actorId,
      reason: input.reason,
      annulledAt: now,
    });
  }
}
