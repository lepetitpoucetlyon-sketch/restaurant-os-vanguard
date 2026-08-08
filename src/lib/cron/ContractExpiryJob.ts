import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

interface EmployeeRecord {
  id: string;
  name?: string;
  contractEndDate?: string; // YYYY-MM-DD
  medicalVisitDate?: string; // YYYY-MM-DD
}

/**
 * ContractExpiryJob (P0-2.4)
 * Se déclenche chaque lundi à 07h00.
 * Scanne les contrats d'employés expirant dans les 30 jours et les visites médicales obsolètes.
 */
export const ContractExpiryJob = {
  name: 'ContractExpiryJob',
  schedule: '0 7 * * 1', // 07h00 chaque lundi
  async runForTenant(tenantId: string): Promise<void> {
    try {
      const employees = await Nexus.adapter.query<EmployeeRecord>(`tenants/${tenantId}/users`);
      const now = Date.now();
      const in30Days = now + 30 * 24 * 60 * 60 * 1000;

      for (const emp of employees) {
        // 1. Contrôle fin de contrat
        if (emp.contractEndDate) {
          const endDate = new Date(emp.contractEndDate).getTime();
          if (!isNaN(endDate) && endDate <= in30Days && endDate >= now) {
            const daysRemaining = Math.ceil((endDate - now) / (1000 * 3600 * 24));
            logger.warn(`[ContractExpiryJob] Contrat expirant dans ${daysRemaining}j pour employé ${emp.id} (${emp.name})`);
            
            await NexusEventBus.emitDurable('hr.contract_expiring', {
              v: 1,
              tenantId,
              userId: emp.id,
              contractId: `ct_${emp.id}`,
              daysRemaining,
              expiryDate: emp.contractEndDate,
            });
          }
        }

        // 2. Contrôle visite médicale HCR (périmée après 1 an)
        if (emp.medicalVisitDate) {
          const visitDate = new Date(emp.medicalVisitDate).getTime();
          const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
          if (!isNaN(visitDate) && visitDate <= oneYearAgo) {
            const daysOverdue = Math.ceil((now - visitDate) / (1000 * 3600 * 24));
            logger.warn(`[ContractExpiryJob] Visite médicale RH obsolète pour employé ${emp.id} (${emp.name})`);

            await NexusEventBus.emitDurable('hr.medical_visit_expired', {
              v: 1,
              tenantId,
              userId: emp.id,
              expiryDate: emp.medicalVisitDate,
              daysOverdue,
            });
          }
        }
      }
    } catch (err) {
      logger.error(`[ContractExpiryJob] Échec du scan contrats pour tenant ${tenantId}`, toError(err).message);
    }
  },
};
