/**
 * L67 — Protocole continuité coupure eau (bascule vaisselle jetable + eau minérale).
 *
 * Paquet Hygiène CE 852/2004 Art. 5 : en cas de coupure d'eau, le responsable
 * doit immédiatement déclencher un plan de continuité. Absence de protocole =
 * fermeture sanitaire immédiate par la DDPP.
 *
 * Ce service déclenche le protocole de coupure eau avec :
 *  - Outbox SANITAIRE (drainé en priorité)
 *  - AuditLogger trace inaltérable
 *  - Notification automatique de l'opérateur responsable
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L67 (HAUT).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { OutboxService, OutboxPriority } from '@/lib/offline/OutboxService';
import { AuditLogger } from '@/modules/compliance/securite/AuditLogger';

export interface WaterCutIncident {
  id: string;
  tenantId: string;
  detectedAt: number;
  detectedBy: string;
  estimatedRestorationIso?: string;
  status: 'active' | 'resolved';
  protocol: {
    switchToDisposableware: boolean;
    reserveMineralWaterLiters: number;
    notifyKitchenAt: number;
    shutdownRawFoodHandling: boolean;
  };
  resolvedAt?: number;
}

export class WaterCutProtocolService {
  private static path(tenantId: string, id: string): string {
    return `tenants/${tenantId}/water_cut_incidents/${id}`;
  }

  static async trigger(input: {
    tenantId: string;
    detectedBy: string;
    estimatedRestorationIso?: string;
    now?: number;
  }): Promise<WaterCutIncident> {
    const now = input.now ?? Date.now();
    const incident: WaterCutIncident = {
      id: `watercut_${input.tenantId}_${now}`,
      tenantId: input.tenantId,
      detectedAt: now,
      detectedBy: input.detectedBy,
      estimatedRestorationIso: input.estimatedRestorationIso,
      status: 'active',
      protocol: {
        switchToDisposableware: true,
        reserveMineralWaterLiters: 20,
        notifyKitchenAt: now,
        shutdownRawFoodHandling: true,
      },
    };

    await Nexus.adapter.set(this.path(input.tenantId, incident.id), incident);
    await OutboxService.enqueue({
      action: 'CREATE',
      collection: `tenants/${input.tenantId}/water_cut_incidents`,
      targetId: incident.id,
      priority: OutboxPriority.SANITAIRE,
      payload: incident as unknown as Record<string, unknown>,
    }).catch(() => 0);

    await AuditLogger.logAction(
      input.detectedBy,
      'WATER_CUT_PROTOCOL_TRIGGERED',
      incident.id,
      { estimatedRestoration: input.estimatedRestorationIso },
    ).catch(() => null);

    await NexusEventBus.emit('compliance.water_cut_protocol_triggered', {
      v: 1,
      tenantId: input.tenantId,
      detectedAt: now,
      estimatedRestorationIso: input.estimatedRestorationIso,
      notifiedOperatorId: input.detectedBy,
    });

    return incident;
  }

  static async resolve(tenantId: string, incidentId: string, resolvedBy: string, now?: number): Promise<void> {
    const ts = now ?? Date.now();
    const existing = await Nexus.adapter.get<WaterCutIncident>(this.path(tenantId, incidentId));
    if (!existing || existing.status === 'resolved') return;
    await Nexus.adapter.set(this.path(tenantId, incidentId), { ...existing, status: 'resolved', resolvedAt: ts });
    await AuditLogger.logAction(resolvedBy, 'WATER_CUT_RESOLVED', incidentId, {}).catch(() => null);
  }
}
