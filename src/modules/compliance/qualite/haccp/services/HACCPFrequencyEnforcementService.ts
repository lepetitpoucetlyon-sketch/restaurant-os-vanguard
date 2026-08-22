import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance';

export interface HACCPTaskSchedule {
  taskType: 'cold_room_temp' | 'frying_oil_polar' | 'cleaning_disinfection' | 'thawing_check';
  equipmentId: string;
  equipmentName: string;
  requiredFrequencyPerDay: number; // ex: 2x pour chambre froide
  currentLoggedCountToday: number;
}

export interface FrequencyComplianceReport {
  isCompliant: boolean;
  equipmentId: string;
  taskType: string;
  missingLogsCount: number;
  blockProduction: boolean;
  alertMessage?: string;
}

/**
 * HACCPFrequencyEnforcementService — Angle mort E1.
 * Contrôle le respect strict des fréquences de relevés sanitaires obligatoires (chambre froide 2x/jour, friture 1x/jour) avec blocage préventif.
 */
export class HACCPFrequencyEnforcementService {
  static checkCompliance(
    tenantId: string,
    adminId: string,
    schedule: HACCPTaskSchedule
  ): FrequencyComplianceReport {
    const missing = Math.max(0, schedule.requiredFrequencyPerDay - schedule.currentLoggedCountToday);
    const isCompliant = missing === 0;

    if (!isCompliant) {
      NexusEventBus.emit('compliance.haccp_frequency_violated', {
        v: 1,
        tenantId,
        taskType: schedule.taskType,
        equipmentId: schedule.equipmentId,
        requiredFrequencyPerDay: schedule.requiredFrequencyPerDay,
        actualLoggedCount: schedule.currentLoggedCountToday,
        alertedAt: Date.now(),
      });

      AuditLogger.logAction({
        adminId,
        action: 'HACCP_FREQUENCY_MISSED',
        targetId: schedule.equipmentId,
        ipAddress: '127.0.0.1',
        metadata: {
          taskType: schedule.taskType,
          missingLogsCount: missing,
        },
      });

      return {
        isCompliant: false,
        equipmentId: schedule.equipmentId,
        taskType: schedule.taskType,
        missingLogsCount: missing,
        blockProduction: missing >= schedule.requiredFrequencyPerDay, // Si aucun relevé fait
        alertMessage: `⚠️ Non-conformité HACCP : ${missing} relevé(s) manquant(s) aujourd'hui pour ${schedule.equipmentName}`,
      };
    }

    return {
      isCompliant: true,
      equipmentId: schedule.equipmentId,
      taskType: schedule.taskType,
      missingLogsCount: 0,
      blockProduction: false,
    };
  }
}
