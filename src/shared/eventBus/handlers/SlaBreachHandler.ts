import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { SharedKernel } from '@/lib/shared-kernel';
import { GlobalAlertEscalationMatrixService } from '@/modules/fleet';

/**
 * SlaBreachHandler
 * Écoute `fleet.sla_breach_detected` — émis par SlaMonitoringFleetService quand
 * une latence dépasse le seuil. Persiste la brèche pour audit MCC et déclenche
 * l'escalade d'incident (Track 2.1).
 */
export async function handleSlaBreachDetected(payload: Record<string, unknown>) {
  const { tenantId, endpoint, latencyMs, allowedLatencyMs, breachAt } = payload as {
    tenantId: string;
    endpoint: string;
    latencyMs: number;
    allowedLatencyMs: number;
    breachAt: number;
  };

  const incidentId = SharedKernel.generateId('SLABREACH');

  await Nexus.adapter.set(`mcc/slaBreaches/${incidentId}`, {
    id: incidentId,
    tenantId,
    endpoint,
    latencyMs,
    allowedLatencyMs,
    breachAt: new Date(breachAt).toISOString(),
  });

  GlobalAlertEscalationMatrixService.escalateIncident({
    incidentId,
    tenantId,
    severity: 'P2',
    title: `SLA breach — ${endpoint} (${latencyMs}ms > ${allowedLatencyMs}ms)`,
    impactedModule: 'pos',
    details: `Latence ${latencyMs}ms dépasse le seuil autorisé ${allowedLatencyMs}ms sur ${endpoint}.`,
  });
}

export function registerSlaBreachHandler() {
  return NexusEventBus.on(
    'fleet.sla_breach_detected',
    handleSlaBreachDetected as Parameters<typeof NexusEventBus.on>[1],
    { id: 'sla-breach-handler', priority: 'HIGH' }
  );
}
