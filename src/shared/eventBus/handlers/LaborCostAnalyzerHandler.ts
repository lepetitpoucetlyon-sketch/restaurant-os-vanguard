import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/infrastructure/services/audit';
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

export function registerLaborCostAnalyzerHandler() {
  const unsubStarted = NexusEventBus.on(
    'hr.shift_started',
    async (payload) => {
      const { tenantId: _tenantId, shiftId, employeeId, startedAt: _startedAt } = payload;
      
      logger.info(`[LaborCostAnalyzer] Début du shift ${shiftId} pour employé ${employeeId}`);
      // L'initialisation du coût peut se faire ici ou simplement tracer le début.
      
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

  const unsubEnded = NexusEventBus.on(
    'hr.shift_ended',
    async (payload) => {
      const { tenantId, shiftId, employeeId, endedAt } = payload;
      
      const shift = await Nexus.adapter.get<ShiftRecord>(`tenants/${tenantId}/shifts/${shiftId}`);
      
      if (shift && shift.startedAt) {
        const durationHours = (endedAt - shift.startedAt) / 3600000;
        
        // En vrai: récupérer le taux horaire de l'employé depuis son profil
        const hourlyRate = shift.hourlyRate ?? 15000000; // 15 euros par défaut (en microunits)
        
        const costInMicrounits = durationHours * hourlyRate;
        
        // Ajouter ce coût au budget salarial de la journée
        const dateStr = new Date(endedAt).toISOString().split('T')[0];
        const budgetPath = `tenants/${tenantId}/analytics/laborCost_${dateStr}`;
        
        await Nexus.adapter.runTransaction(async (_tx) => {
          const budget = await Nexus.adapter.get<LaborBudget>(budgetPath) ?? { totalCostInMicrounits: 0, totalHours: 0 };
          
          await Nexus.adapter.set(budgetPath, {
            totalCostInMicrounits: budget.totalCostInMicrounits + costInMicrounits,
            totalHours: budget.totalHours + durationHours,
            updatedAt: Date.now()
          });
        });
        
        logger.info(`[LaborCostAnalyzer] Fin de shift ${shiftId}. Coût salarial ajouté: ${costInMicrounits / 1000000} EUR.`);
      }

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

  return () => {
    unsubStarted();
    unsubEnded();
  };
}
