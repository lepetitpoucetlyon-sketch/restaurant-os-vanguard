/**
 * L57 — Plat témoin banquet (>30 couverts).
 *
 * Règlement CE 852/2004 Annexe II Ch. IX §5 + circulaire DGAL/SDSSA :
 * Pour tout repas de groupe de >30 couverts, l'établissement doit
 * conserver un "plat témoin" de chaque préparation culinaire servie
 * pendant 72h à +4°C. En cas de TIAC (Toxi-Infection Alimentaire Collective),
 * les plats témoins permettent l'analyse bactériologique par la DDPP.
 *
 * Ce service crée automatiquement la checklist plats témoins lors d'une
 * réservation groupe et vérifie leur destruction après 72h.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L57.
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { OutboxService, OutboxPriority } from '@/lib/offline/OutboxService';

const BANQUET_THRESHOLD = 30;
const RETENTION_HOURS = 72;

export interface WitnessDishRecord {
  id: string;
  tenantId: string;
  reservationId: string;
  couverts: number;
  dishes: string[];
  collectedAt: number;
  retainUntil: number;
  destroyedAt?: number;
  legalRef: 'CE 852/2004 Annexe II Ch.IX §5';
}

export class WitnessDishService {
  private static path(tenantId: string, id: string): string {
    return `tenants/${tenantId}/witness_dishes/${id}`;
  }

  static isBanquet(couverts: number): boolean {
    return couverts > BANQUET_THRESHOLD;
  }

  static async createChecklist(input: {
    tenantId: string;
    reservationId: string;
    couverts: number;
    dishes: string[];
    operatorId: string;
    now?: number;
  }): Promise<WitnessDishRecord | null> {
    if (!this.isBanquet(input.couverts)) return null;

    const now = input.now ?? Date.now();
    const id = `wd_${input.reservationId}_${now}`;
    const retainUntil = now + RETENTION_HOURS * 3600_000;

    const record: WitnessDishRecord = {
      id,
      tenantId: input.tenantId,
      reservationId: input.reservationId,
      couverts: input.couverts,
      dishes: input.dishes,
      collectedAt: now,
      retainUntil,
      legalRef: 'CE 852/2004 Annexe II Ch.IX §5',
    };

    await Nexus.adapter.set(this.path(input.tenantId, id), record);
    await OutboxService.enqueue({
      action: 'CREATE',
      collection: `tenants/${input.tenantId}/witness_dishes`,
      targetId: id,
      priority: OutboxPriority.SANITAIRE,
      payload: record as unknown as Record<string, unknown>,
    }).catch(() => 0);

    await NexusEventBus.emit('compliance.witness_dish_checklist_created', {
      v: 1,
      tenantId: input.tenantId,
      reservationId: input.reservationId,
      couverts: input.couverts,
      dishCount: input.dishes.length,
      retainUntil,
      createdAt: now,
    }).catch(() => null);

    return record;
  }

  static async markDestroyed(tenantId: string, witnessId: string, operatorId: string, now?: number): Promise<void> {
    const ts = now ?? Date.now();
    const record = await Nexus.adapter.get<WitnessDishRecord>(this.path(tenantId, witnessId));
    if (!record) throw new Error(`WITNESS_DISH_NOT_FOUND:${witnessId}`);
    if (ts < record.retainUntil) {
      throw new Error(`WITNESS_DISH_PREMATURE_DESTROY: retain until ${new Date(record.retainUntil).toISOString()}`);
    }
    await Nexus.adapter.set(this.path(tenantId, witnessId), { ...record, destroyedAt: ts, destroyedBy: operatorId });
  }

  static async getOverdue(tenantId: string, now?: number): Promise<WitnessDishRecord[]> {
    const ts = now ?? Date.now();
    const all = await Nexus.adapter.query<WitnessDishRecord>(`tenants/${tenantId}/witness_dishes`);
    return all.filter(r => !r.destroyedAt && r.retainUntil < ts);
  }
}
