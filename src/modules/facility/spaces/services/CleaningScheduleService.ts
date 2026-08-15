import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

export type CleaningArea = 'KITCHEN' | 'DINING_ROOM' | 'RESTROOMS' | 'DISHWASHING' | 'STORAGE';
export type CleaningFrequency = 'DAILY_OPENING' | 'DAILY_CLOSING' | 'WEEKLY' | 'MONTHLY';

export interface CleaningProtocolTask {
  id: string;
  area: CleaningArea;
  title: string;
  description: string;
  frequency: CleaningFrequency;
  requiredProducts: string[];
  isCriticalHaccp: boolean;
}

export interface CleaningLogEntry {
  id: string;
  tenantId: string;
  taskId: string;
  area: CleaningArea;
  businessDate: string; // YYYY-MM-DD
  executedBy: string;
  executedAt: number;
  status: 'COMPLETED' | 'FLAGGED';
  supervisorValidatedBy?: string;
  supervisorValidatedAt?: number;
  photoEvidenceUrl?: string;
  notes?: string;
}

export interface DailyCleaningReport {
  businessDate: string;
  totalRequired: number;
  completedCount: number;
  complianceRatePercent: number;
  isFullyCompliant: boolean;
}

/** Protocoles standards de nettoyage HACCP */
const STANDARD_TASKS: CleaningProtocolTask[] = [
  {
    id: 'task_kitchen_surfaces_close',
    area: 'KITCHEN',
    title: 'Désinfection plans de travail & pianos de cuisson',
    description: 'Dégraissage à chaud, rinçage eau claire et application désinfectant contact alimentaire',
    frequency: 'DAILY_CLOSING',
    requiredProducts: ['Dégraissant Pro D10', 'Désinfectant D4'],
    isCriticalHaccp: true,
  },
  {
    id: 'task_restrooms_open',
    area: 'RESTROOMS',
    title: 'Désinfection complète sanitaires & recharge consommables',
    description: 'Nettoyage cuvettes, lavabos, miroirs, sol et recharge savon / essuie-mains',
    frequency: 'DAILY_OPENING',
    requiredProducts: ['Gel javel WC', 'Nettoyant vitres'],
    isCriticalHaccp: false,
  },
  {
    id: 'task_dishwashing_filter_close',
    area: 'DISHWASHING',
    title: 'Vidange et nettoyage des filtres de lave-vaisselle',
    description: 'Démontage bras de lavage, vidange bac et détartrage',
    frequency: 'DAILY_CLOSING',
    requiredProducts: ['Détartrant machine'],
    isCriticalHaccp: true,
  },
];

/**
 * 🧹 CleaningScheduleService — Zone 9 Facility & HACCP
 * Traçabilité du Plan de Nettoyage et Désinfection (PND) par zone et validation superviseur.
 */
export class CleaningScheduleService {
  /**
   * Retourne la liste des tâches réglementaires de nettoyage.
   */
  static getProtocolTasks(): CleaningProtocolTask[] {
    return STANDARD_TASKS;
  }

  /**
   * Enregistre l'exécution d'une tâche de nettoyage par un équipier.
   */
  static async recordCleaningExecution(
    tenantId: string,
    data: Omit<CleaningLogEntry, 'id' | 'tenantId' | 'executedAt'>
  ): Promise<CleaningLogEntry> {
    const id = `clean_${Date.now()}_${data.taskId}`;
    const now = Date.now();

    const entry: CleaningLogEntry = {
      ...data,
      id,
      tenantId,
      executedAt: now,
    };

    const current = (await Nexus.adapter.get<Record<string, CleaningLogEntry>>(`tenants/${tenantId}/cleaningDailyLogs/${data.businessDate}`)) || {};
    current[data.taskId] = entry;
    await Nexus.adapter.set(`tenants/${tenantId}/cleaningDailyLogs/${data.businessDate}`, current);

    empireAudit.log({
      module: 'facility',
      action: 'CLEANING_TASK_COMPLETED',
      details: { taskId: data.taskId, area: data.area, executedBy: data.executedBy, date: data.businessDate },
      severity: 'low',
      timestamp: new Date(now),
    });

    logger.info(`[Facility] Tâche de nettoyage ${data.taskId} validée par ${data.executedBy} (${data.businessDate})`);
    return entry;
  }

  /**
   * Validation / contre-signature d'une tâche de nettoyage par un superviseur / chef de cuisine.
   */
  static async validateBySupervisor(
    tenantId: string,
    businessDate: string,
    taskId: string,
    supervisorId: string
  ): Promise<CleaningLogEntry> {
    const current = (await Nexus.adapter.get<Record<string, CleaningLogEntry>>(`tenants/${tenantId}/cleaningDailyLogs/${businessDate}`)) || {};
    const log = current[taskId];

    if (!log) {
      throw new Error(`Entrée de nettoyage introuvable pour la tâche: ${taskId}`);
    }

    const updated: CleaningLogEntry = {
      ...log,
      supervisorValidatedBy: supervisorId,
      supervisorValidatedAt: Date.now(),
    };

    current[taskId] = updated;
    await Nexus.adapter.set(`tenants/${tenantId}/cleaningDailyLogs/${businessDate}`, current);
    logger.info(`[Facility] Nettoyage ${taskId} validé par superviseur ${supervisorId}`);

    return updated;
  }

  /**
   * Calcule le taux de conformité journalier du Plan de Nettoyage et Désinfection.
   */
  static async getDailyCompliance(tenantId: string, businessDate: string): Promise<DailyCleaningReport> {
    const logs = (await Nexus.adapter.get<Record<string, CleaningLogEntry>>(`tenants/${tenantId}/cleaningDailyLogs/${businessDate}`)) || {};
    const executedEntries = Object.values(logs).filter(l => l && l.status === 'COMPLETED');

    const totalRequired = STANDARD_TASKS.length;
    const completedCount = executedEntries.length;
    const complianceRatePercent = Math.min(100, Math.round((completedCount / totalRequired) * 100));

    return {
      businessDate,
      totalRequired,
      completedCount,
      complianceRatePercent,
      isFullyCompliant: completedCount >= totalRequired,
    };
  }
}
