import { isBefore, parseISO } from 'date-fns';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export interface SafetyEquipment {
  equipmentId: string;
  type: 'EXTINGUISHER' | 'ALARM_SYSTEM' | 'HOOD_EXTRACTION' | 'ELECTRICAL_PANEL';
  lastInspectionDateIso: string;
  nextInspectionDueDateIso: string;
  inspectorCompany: string; // e.g. "Socotec", "Apave"
}

export interface SafetyStatusResult {
  equipmentId: string;
  isCompliant: boolean;
  daysRemaining: number;
  urgency: 'OK' | 'WARNING_SOON' | 'NON_COMPLIANT_OVERDUE';
}

/**
 * 🧯 ErpSafetyRegister (Item 7.3)
 * Registre dématérialisé de sécurité ERP (Établissement Recevant du Public) et contrôle incendie.
 * Alerte le directeur 30 jours avant expiration de la vérification annuelle obligatoire.
 */
export class ErpSafetyRegister {
  static evaluateSafetyEquipment(equipment: SafetyEquipment): SafetyStatusResult {
    const dueDate = parseISO(equipment.nextInspectionDueDateIso);
    const now = new Date();
    const isOverdue = isBefore(dueDate, now);

    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

    let urgency: SafetyStatusResult['urgency'] = 'OK';
    if (isOverdue) {
      urgency = 'NON_COMPLIANT_OVERDUE';
    } else if (diffDays <= 30) {
      urgency = 'WARNING_SOON';
    }

    logger.info(`[ErpSafetyRegister] Équipement ${equipment.equipmentId} (${equipment.type}) -> Urgence: ${urgency} (${diffDays}j restants)`);

    if (urgency !== 'OK') {
      empireAudit.log({
        module: 'compliance',
        action: 'ERP_SAFETY_INSPECTION_ALERT',
        details: { equipmentId: equipment.equipmentId, type: equipment.type, diffDays, urgency },
        severity: urgency === 'NON_COMPLIANT_OVERDUE' ? 'critical' : 'high',
        timestamp: now,
      });
    }

    return {
      equipmentId: equipment.equipmentId,
      isCompliant: !isOverdue,
      daysRemaining: diffDays,
      urgency,
    };
  }
}
