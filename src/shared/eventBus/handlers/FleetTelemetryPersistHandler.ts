import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';

/**
 * FleetTelemetryPersistHandler
 * Persiste les events `fleet.*` restants (provisioning, benchmark, audit conformité,
 * kill-switch, escalade, affectation véhicule) — jusqu'ici émis dans le vide
 * (coverage-theater MCC, Track 2.1).
 */

export async function handleBenchmarkComputed(payload: Record<string, unknown>) {
  const { tenantId, ...rest } = payload as { tenantId: string } & Record<string, unknown>;
  await Nexus.adapter.set(`mcc/benchmarks/${tenantId}`, {
    tenantId, ...rest, persistedAt: new Date().toISOString(),
  });
}

export async function handleComplianceAuditComputed(payload: Record<string, unknown>) {
  const { tenantId, ...rest } = payload as { tenantId: string } & Record<string, unknown>;
  await Nexus.adapter.set(`mcc/complianceAudits/${tenantId}`, {
    tenantId, ...rest, persistedAt: new Date().toISOString(),
  });
}

export async function handleKillSwitchToggled(payload: Record<string, unknown>) {
  const { tenantId, featureFlag, ...rest } = payload as {
    tenantId: string; featureFlag: string;
  } & Record<string, unknown>;
  await Nexus.adapter.set(`mcc/killSwitchLog/${tenantId}_${featureFlag}`, {
    tenantId, featureFlag, ...rest, persistedAt: new Date().toISOString(),
  });
}

export async function handleAlertEscalated(payload: Record<string, unknown>) {
  const { incidentId, ...rest } = payload as { incidentId: string } & Record<string, unknown>;
  await Nexus.adapter.set(`mcc/escalatedAlerts/${incidentId}`, {
    incidentId, ...rest, persistedAt: new Date().toISOString(),
  });
}

export async function handleVehicleAssigned(payload: Record<string, unknown>) {
  const { tenantId, vehicleId, ...rest } = payload as {
    tenantId: string; vehicleId: string;
  } & Record<string, unknown>;
  await Nexus.adapter.set(`tenants/${tenantId}/vehicleAssignments/${vehicleId}`, {
    tenantId, vehicleId, ...rest, persistedAt: new Date().toISOString(),
  });
}

export function registerFleetTelemetryPersistHandler() {
  const unsubs = [
    NexusEventBus.on('fleet.benchmark_computed', handleBenchmarkComputed as Parameters<typeof NexusEventBus.on>[1], { id: 'fleet-benchmark-persist', priority: 'BACKGROUND' }),
    NexusEventBus.on('fleet.compliance_audit_computed', handleComplianceAuditComputed as Parameters<typeof NexusEventBus.on>[1], { id: 'fleet-compliance-audit-persist', priority: 'BACKGROUND' }),
    NexusEventBus.on('fleet.kill_switch_toggled', handleKillSwitchToggled as Parameters<typeof NexusEventBus.on>[1], { id: 'fleet-kill-switch-persist', priority: 'HIGH' }),
    NexusEventBus.on('fleet.alert_escalated', handleAlertEscalated as Parameters<typeof NexusEventBus.on>[1], { id: 'fleet-alert-escalated-persist', priority: 'HIGH' }),
    NexusEventBus.on('fleet.vehicle_assigned', handleVehicleAssigned as Parameters<typeof NexusEventBus.on>[1], { id: 'fleet-vehicle-assigned-persist', priority: 'BACKGROUND' }),
  ];

  return () => unsubs.forEach(unsub => unsub());
}
