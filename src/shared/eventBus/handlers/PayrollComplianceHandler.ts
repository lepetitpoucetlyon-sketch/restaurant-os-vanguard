import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

interface ShiftRecord {
  id: string;
  endedAt?: number;
  locked?: boolean;
}

export function registerPayrollComplianceHandler() {
  return NexusEventBus.on(
    'hr.payroll_exported',
    async (payload) => {
      const { tenantId, periodStart, periodEnd, exportedBy } = payload;
      
      logger.info(`[PayrollCompliance] Export de paie détecté. Verrouillage des pointages du ${new Date(periodStart).toISOString()} au ${new Date(periodEnd).toISOString()}`);

      // Transaction pour verrouiller tous les shifts de la période.
      // Cela garantit l'immuabilité RH post-export (anti-falsification).
      
      const shiftsPath = `tenants/${tenantId}/shifts`;
      // Dans une implémentation Firestore réelle, on ferait une query: where('endedAt', '>=', periodStart) ...
      // Pour ce boilerplate, on simule l'obtention de la collection.
      const allShifts = await Nexus.adapter.query<ShiftRecord>(shiftsPath) || [];
      
      const shiftsToLock = allShifts.filter((s: ShiftRecord) => 
        s.endedAt && s.endedAt >= periodStart && s.endedAt <= periodEnd && !s.locked
      );

      // Verrouillage en batch
      for (const shift of shiftsToLock) {
        await Nexus.adapter.update(`${shiftsPath}/${shift.id}`, {
          locked: true,
          lockedAt: Date.now(),
          lockedByExport: exportedBy
        });
      }

      logger.info(`[PayrollCompliance] ${shiftsToLock.length} pointages ont été définitivement verrouillés.`);

      empireAudit.log({
        module: 'human',
        action: 'PAYROLL_LOCKED',
        details: { periodStart, periodEnd, lockedShiftsCount: shiftsToLock.length, exportedBy },
        severity: 'medium', // Elevé car c'est une action légale structurante
        timestamp: new Date(),
      });
    },
    { id: 'payroll-compliance', priority: 'HIGH' }
  );
}
