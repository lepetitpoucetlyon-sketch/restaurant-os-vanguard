import { logger } from '@/lib/logger';
import { ZReportAutoJob } from './ZReportAutoJob';
import { BirthdayScanJob } from './BirthdayScanJob';
import { ContractExpiryJob } from './ContractExpiryJob';
import { DailyDigestJob } from './DailyDigestJob';
import { PromotionExpiryJob } from './PromotionExpiryJob';
import { MiseEnPlaceJob } from './MiseEnPlaceJob';
import { DraftPOEscalationJob } from './DraftPOEscalationJob';
import { StaffingPlannerJob } from './StaffingPlannerJob';
import { toError } from "@/lib/toError";

export interface CronJobDefinition {
  name: string;
  schedule: string;
  runForTenant: (tenantId: string) => Promise<void>;
}

/**
 * CronScheduler (P0-2.1)
 * Moteur central d'exécution et d'orchestration des jobs cron pour tous les tenants de la flotte.
 * Intégré au cycle de vie de l'application.
 */
import { NoShowDetectorJob } from './NoShowDetectorJob';
import { ReservationReminderJob } from './ReservationReminderJob';

export const CronScheduler = {
  jobs: [
    ZReportAutoJob,
    BirthdayScanJob,
    ContractExpiryJob,
    DailyDigestJob,
    PromotionExpiryJob,
    MiseEnPlaceJob,
    DraftPOEscalationJob,
    StaffingPlannerJob,
    {
      name: 'NoShowDetectorJob',
      schedule: '*/5 * * * *',
      runForTenant: async (_tenantId: string) => {
        await NoShowDetectorJob.run();
      },
    },
    {
      name: 'ReservationReminderJob',
      schedule: '0 * * * *',
      runForTenant: async (_tenantId: string) => {
        await ReservationReminderJob.run();
      },
    },
  ] as CronJobDefinition[],

  activeIntervals: [] as Array<ReturnType<typeof setInterval>>,

  start(tenantIds: string[]): void {
    logger.info(`[CronScheduler] Démarrage du moteur Cron central pour ${tenantIds.length} tenants active(s).`);

    // Pour chaque tenant, exécuter un cycle périodique de vérification
    const interval = setInterval(async () => {
      for (const tenantId of tenantIds) {
        for (const job of CronScheduler.jobs) {
          try {
            // Exécution sécurisée sans crash
            await job.runForTenant(tenantId);
          } catch (err) {
            logger.error(`[CronScheduler] Erreur job ${job.name} pour tenant ${tenantId}`, toError(err).message);
          }
        }
      }
    }, 15 * 60 * 1000); // Exécution de contrôle toutes les 15 minutes

    CronScheduler.activeIntervals.push(interval);
  },

  stop(): void {
    CronScheduler.activeIntervals.forEach(clearInterval);
    CronScheduler.activeIntervals = [];
    logger.info('[CronScheduler] CronScheduler arrêté.');
  },
};
