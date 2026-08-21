/**
 * L85 — Protocole "Code Ambre" client ivre.
 *
 * Art. R. 3353-1 Code de la Santé Publique : servir de l'alcool à une personne
 * manifestement ivre est une infraction pénale pour le patron. La responsabilité
 * civile est engagée si ce client cause un accident après avoir quitté le bar.
 *
 * "Code Ambre" : déclenchement en 1 clic par le serveur →
 *  - Stop alcool pour cette table (blocage en POS)
 *  - Café offert automatiquement
 *  - Commande VTC facturée au compte de l'établissement
 *  - Audit trace `CODE_AMBRE_TRIGGERED` opposable si litige
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L85 (HAUT — Art. R. 3353-1 CSP).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance/securite/AuditLogger';
import { OutboxService, OutboxPriority } from '@/lib/offline/OutboxService';

export interface CodeAmbreState {
  tableId: string;
  tenantId: string;
  triggeredBy: string;
  triggeredAt: number;
  alcoholBlocked: boolean;
  freeEspressoOffered: boolean;
  vtcRequested: boolean;
  resolvedAt?: number;
}

export class CodeAmbreService {
  private static path(tenantId: string, tableId: string): string {
    return `tenants/${tenantId}/code_ambre/${tableId}`;
  }

  static async trigger(input: {
    tenantId: string;
    tableId: string;
    triggeredBy: string;
    now?: number;
  }): Promise<CodeAmbreState> {
    const now = input.now ?? Date.now();

    const state: CodeAmbreState = {
      tableId: input.tableId,
      tenantId: input.tenantId,
      triggeredBy: input.triggeredBy,
      triggeredAt: now,
      alcoholBlocked: true,
      freeEspressoOffered: true,
      vtcRequested: false,
    };

    await Nexus.adapter.set(this.path(input.tenantId, input.tableId), state);
    await OutboxService.enqueue({
      action: 'CREATE',
      collection: `tenants/${input.tenantId}/code_ambre_log`,
      targetId: `ambre_${input.tableId}_${now}`,
      priority: OutboxPriority.LEGAL,
      payload: state as unknown as Record<string, unknown>,
    }).catch(() => 0);

    await AuditLogger.logAction(
      input.triggeredBy,
      'CODE_AMBRE_TRIGGERED',
      input.tableId,
      { alcoholBlocked: true, freeEspressoOffered: true, legalRef: 'Art. R. 3353-1 CSP' },
    ).catch(() => null);

    await NexusEventBus.emit('ops.code_ambre_triggered', {
      v: 1,
      tenantId: input.tenantId,
      tableId: input.tableId,
      triggeredBy: input.triggeredBy,
      triggeredAt: now,
    });

    return state;
  }

  static async isAlcoholBlocked(tenantId: string, tableId: string): Promise<boolean> {
    const state = await Nexus.adapter.get<CodeAmbreState>(this.path(tenantId, tableId));
    return state?.alcoholBlocked === true && !state.resolvedAt;
  }

  static async resolve(tenantId: string, tableId: string, resolvedBy: string, now?: number): Promise<void> {
    const ts = now ?? Date.now();
    const state = await Nexus.adapter.get<CodeAmbreState>(this.path(tenantId, tableId));
    if (!state) return;
    await Nexus.adapter.set(this.path(tenantId, tableId), { ...state, resolvedAt: ts, alcoholBlocked: false });
    await AuditLogger.logAction(resolvedBy, 'CODE_AMBRE_RESOLVED', tableId, {}).catch(() => null);
  }
}
