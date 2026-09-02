import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

/** Fiche de shift employé (Firestore) */
interface ShiftRecord {
  id: string;
  employeeId: string;
  startedAt: number;       // timestamp ms
  endedAt?: number;
  hourlyRate?: number;     // microunits / heure (ex: 15_000_000 = 15€)
  role?: string;
}
/** Cumul journalier du coût salarial */
interface LaborBudget {
  totalCostInMicrounits: number;
  totalHours: number;
  updatedAt?: number;
}

import { LaborCostAnalyzer } from '@/modules/human';

export function registerLaborCostAnalyzerHandler(): () => void {
  const unsubStarted = NexusEventBus.on(
    'hr.shift_started',
    async (payload) => {
      const { tenantId: _tenantId, shiftId, employeeId, startedAt: _startedAt } = payload;
      
      logger.info(`[LaborCostAnalyzer] Début du shift ${shiftId} pour employé ${employeeId}`);
      
      empireAudit.log({
        module: 'human',
        action: 'SHIFT_STARTED_TRACKED',
        details: { shiftId, employeeId },
        severity: 'low',
        timestamp: new Date(),
      });
    },
    { id: 'labor-cost-shift-started', priority: 'BACKGROUND' }
  );

  const handleShiftCompleted = async (tenantId: string, employeeId: string, employeeName?: string, endedAt?: number) => {
    const effectiveEndedAt = endedAt || Date.now();
    const dateStr = new Date(effectiveEndedAt).toISOString().split('T')[0];

    try {
      // Analyse en temps réel croisant les pointages et les contrats
      const metrics = await LaborCostAnalyzer.analyzeDailyLaborCost(tenantId, 0);

      if (metrics.alertStatus === 'CRITICAL') {
        await NexusEventBus.emitDurable('notification.urgent', {
          v: 1,
          tenantId,
          message: `Alerte Masse Salariale : Ratio personnel/CA critique (${metrics.laborCostPercentage.toFixed(1)}%)`,
          roles: ['manager', 'directeur', 'admin'],
          priority: 'HIGH',
          metadata: { dateStr, employeeId, employeeName, metrics },
        });
      }

      logger.info(`[LaborCostAnalyzer] Dépointage ${employeeName || employeeId} : Coût salarial cumulé = ${(metrics.currentLaborCostInCents / 100).toFixed(2)}€`);
    } catch (err) {
      logger.warn(`[LaborCostAnalyzer] Impossible de recalculer le coût salarial après dépointage: ${(err as Error).message}`);
    }
  };

  const unsubEnded = NexusEventBus.on(
    'hr.shift_ended',
    async (payload) => {
      const { tenantId, shiftId, employeeId, endedAt } = payload;
      await handleShiftCompleted(tenantId, employeeId, undefined, endedAt);

      empireAudit.log({
        module: 'human',
        action: 'SHIFT_ENDED_TRACKED',
        details: { shiftId, employeeId },
        severity: 'low',
        timestamp: new Date(),
      });
    },
    { id: 'labor-cost-shift-ended', priority: 'BACKGROUND' }
  );

  // Suture Nœud 4 : Écoute du dépointage réel depuis le kiosque de pointage
  const unsubStaffClockOut = NexusEventBus.on(
    'staff.clock_out',
    async (payload) => {
      const { tenantId, userId, userName, timestamp } = payload;
      const endedAt = new Date(timestamp).getTime();
      await handleShiftCompleted(tenantId, userId, userName, endedAt);
    },
    { id: 'labor-cost-staff-clock-out', priority: 'BACKGROUND' }
  );

  return () => {
    unsubStarted();
    unsubEnded();
    unsubStaffClockOut();
  };
}
