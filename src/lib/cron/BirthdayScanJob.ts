import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@orchestration/NexusEventBus';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

interface CustomerRecord {
  id: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string; // Format YYYY-MM-DD ou MM-DD
}

/**
 * BirthdayScanJob (P0-2.3)
 * Se déclenche quotidiennement à 10h00.
 * Scanne les profils CRM pour identifier les clients fêtant leur anniversaire dans les 7 jours (J+7)
 * et émet `crm.birthday_approaching`.
 */
export const BirthdayScanJob = {
  name: 'BirthdayScanJob',
  schedule: '0 10 * * *', // 10h00 chaque jour
  async runForTenant(tenantId: string): Promise<void> {
    try {
      const customers = await Nexus.adapter.query<CustomerRecord>(`tenants/${tenantId}/crms`);
      const today = new Date();

      for (const customer of customers) {
        if (!customer.birthDate) continue;
        
        const bdate = new Date(customer.birthDate);
        if (isNaN(bdate.getTime())) continue;

        // Calcul différence en jours
        const nextBday = new Date(today.getFullYear(), bdate.getMonth(), bdate.getDate());
        if (nextBday < today) {
          nextBday.setFullYear(today.getFullYear() + 1);
        }

        const diffDays = Math.ceil((nextBday.getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 7) {
          logger.info(`[BirthdayScanJob] Anniversaire proche (J+${diffDays}) pour client ${customer.id} (${customer.firstName} ${customer.lastName})`);
          await NexusEventBus.emitDurable('crm.birthday_approaching', {
            v: 1,
            tenantId,
            customerId: customer.id,
            birthdayAt: customer.birthDate,
            daysUntil: diffDays,
          });
        }
      }
    } catch (err) {
      logger.error(`[BirthdayScanJob] Échec du scan anniversaires pour tenant ${tenantId}`, toError(err).message);
    }
  },
};
