import { SimulacraEngine } from '../engine/SimulacraEngine';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

function seq(prefix: string, idx: number) {
  return `${prefix}_${idx}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── Huile friture > 25% polaires ────────────────────────────────────────────

export async function triggerHuileOver25(engine: SimulacraEngine): Promise<void> {
  const { tenantId } = engine.config;
  await NexusEventBus.emit('haccp.nonconform', {
    v: 1, isSimulation: true, tenantId,
    checkId: seq('oil_chk', Date.now()),
    correctionDeadline: Date.now() + 2 * 3600000,
  });
  await NexusEventBus.emit('facility.maintenance_required', {
    tenantId, assetId: 'fryer_principal',
    assetType: 'friteuse',
    description: 'Huile friteuse à changer — taux polaires 26.2% (limite légale 25%)',
  });
}

// ── Relevé de température légal quotidien ────────────────────────────────────

export async function triggerDailyTempCheck(engine: SimulacraEngine): Promise<void> {
  const { tenantId } = engine.config;
  const sensors = [
    { sensorId: 'frigo_viande', temp: 3.1 },
    { sensorId: 'frigo_poisson', temp: 1.8 },
    { sensorId: 'congelateur_1', temp: -18.5 },
    { sensorId: 'bain_marie_cuisine', temp: 64.2 },
  ];
  for (const { sensorId, temp } of sensors) {
    await NexusEventBus.emit('haccp.temperature_logged', {
      v: 1, isSimulation: true, tenantId, sensorId,
      temperature: temp, unit: '°C', timestamp: Date.now(),
    });
    await NexusEventBus.emit('haccp.check.saved', {
      v: 1, isSimulation: true, tenantId,
      checkId: seq(`hcpchk_${sensorId}`, Date.now()),
      operatorId: 'emp_chef_1',
      timestamp: Date.now(),
    });
  }
}

// ── Nettoyage et désinfection (plan de nettoyage) ────────────────────────────

export async function triggerCleaningPlan(engine: SimulacraEngine): Promise<void> {
  const { tenantId } = engine.config;
  await NexusEventBus.emit('compliance.calendar', {
    v: 1, isSimulation: true, tenantId,
    eventType: 'inspection',
    title: 'Nettoyage & Désinfection complet cuisine',
    dueDate: engine.clock.getDateString(),
    daysUntilDue: 0,
  });
}
