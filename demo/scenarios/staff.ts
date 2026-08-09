import { SimulacraEngine } from '../engine/SimulacraEngine';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

function seq(prefix: string, idx: number) {
  return `${prefix}_${idx}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── Shift swap validé ────────────────────────────────────────────────────────

export async function triggerShiftSwap(
  engine: SimulacraEngine,
  staff1Id: string = 'emp_srv_1',
  staff2Id: string = 'emp_hot_1'
): Promise<void> {
  const { tenantId } = engine.config;
  // Notification au manager pour approbation
  await NexusEventBus.emit('notification.urgent', {
    v: 1, tenantId,
    message: `Échange de shift demandé : ${staff1Id} ↔ ${staff2Id} — vérification repos 11h en cours`,
    roles: ['manager'],
    priority: 'HIGH',
  });
  // Shift started après swap validé
  await NexusEventBus.emit('hr.shift_started', {
    v: 1, isSimulation: true, tenantId,
    shiftId: seq('shift_swap', Date.now()),
    employeeId: staff2Id,
    startedAt: Date.now(),
    role: 'serveur',
  });
}

// ── Planning hebdomadaire publié ─────────────────────────────────────────────

export async function triggerSchedulePublished(engine: SimulacraEngine): Promise<void> {
  const { tenantId } = engine.config;
  await NexusEventBus.emit('hr.schedule_published', {
    v: 1, isSimulation: true, tenantId,
    weekStart: Date.now(),
    publishedBy: 'emp_mgr_1',
  });
}

// ── Export paie ─────────────────────────────────────────────────────────────

export async function triggerPayrollExport(engine: SimulacraEngine): Promise<void> {
  const { tenantId } = engine.config;
  await NexusEventBus.emit('payroll.submitted', {
    v: 1, isSimulation: true, tenantId,
    period: engine.clock.getDateString().slice(0, 7), // YYYY-MM
    submissionId: seq('payroll', Date.now()),
    employeeCount: 4,
  });
  await NexusEventBus.emit('hr.payroll_exported', {
    v: 1, isSimulation: true, tenantId,
    periodStart: Date.now() - 30 * 86400000,
    periodEnd: Date.now(),
    exportedBy: 'emp_mgr_1',
  });
}
