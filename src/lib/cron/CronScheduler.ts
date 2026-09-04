import { logger } from '@/lib/logger';
import { ZReportAutoJob } from './ZReportAutoJob';
import { BirthdayScanJob } from './BirthdayScanJob';
import { ContractExpiryJob } from './ContractExpiryJob';
import { DailyDigestJob } from './DailyDigestJob';
import { PromotionExpiryJob } from './PromotionExpiryJob';
import { MiseEnPlaceJob } from './MiseEnPlaceJob';
import { DraftPOEscalationJob } from './DraftPOEscalationJob';
import { StaffingPlannerJob } from './StaffingPlannerJob';
import { SaaSBillingJob } from './SaaSBillingJob';
import { UrssafVigilanceJob } from './UrssafVigilanceJob';
import { toError } from "@/lib/toError";
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { isCronDueWithin } from './cronMatch';

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
import { ServerDLQRetryJob } from './ServerDLQRetryJob';
import { GrandTotalScheduler } from './GrandTotalScheduler';

/** Helper : label de la période précédente au format ISO tronqué (YYYY-MM ou YYYY). */
function previousPeriodLabel(now: Date, kind: 'monthly' | 'annual'): string {
  if (kind === 'annual') return String(now.getUTCFullYear() - 1);
  const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, '0')}`;
}

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
    SaaSBillingJob,
    UrssafVigilanceJob,
    ServerDLQRetryJob,
    // NF525 Art. 88 CGI — grand total mensuel scellé (audit 2026-09, orphelin trouvé par gate-bootstrap-wired)
    {
      name: 'GrandTotalMonthlyJob',
      schedule: GrandTotalScheduler.scheduleMonthly,
      runForTenant: (tenantId: string) =>
        GrandTotalScheduler.runForTenant(tenantId, 'monthly', previousPeriodLabel(new Date(), 'monthly')),
    },
    // NF525 Art. 88 CGI — grand total annuel scellé
    {
      name: 'GrandTotalAnnualJob',
      schedule: GrandTotalScheduler.scheduleAnnual,
      runForTenant: (tenantId: string) =>
        GrandTotalScheduler.runForTenant(tenantId, 'annual', previousPeriodLabel(new Date(), 'annual')),
    },
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

  /**
   * Exécute UNE passe des jobs dus à `now` (fenêtre `windowMinutes`) pour tous les
   * tenants actifs, en respectant le `schedule` cron de chaque job.
   *
   * Audit S1 : à appeler depuis un déclencheur DURABLE externe (Vercel Cron →
   * `/api/cron/tick`), et NON via un `setInterval` in-process qui ne survit pas au
   * serverless. Les jobs sont idempotents (ZReport/SaaSBilling vérifient l'existant),
   * ce qui protège en défense supplémentaire contre un double-tick.
   */
  async runDue(
    now: Date = new Date(),
    windowMinutes = 5,
  ): Promise<{ ran: number; errors: number; tenants: number }> {
    const tenants = await Nexus.adapter.query<{ id: string }>('tenants');
    const tenantIds = (tenants ?? [])
      .map((t) => t.id)
      .filter((id): id is string => Boolean(id));

    let ran = 0;
    let errors = 0;
    for (const job of CronScheduler.jobs) {
      if (!isCronDueWithin(job.schedule, now, windowMinutes)) continue;
      for (const tenantId of tenantIds) {
        try {
          await job.runForTenant(tenantId);
          ran++;
        } catch (err) {
          errors++;
          logger.error(`[CronScheduler] Erreur job ${job.name} pour tenant ${tenantId}`, toError(err).message);
        }
      }
    }
    logger.info(`[CronScheduler] runDue: ${ran} exécution(s), ${errors} erreur(s) sur ${tenantIds.length} tenant(s).`);
    return { ran, errors, tenants: tenantIds.length };
  },

  /**
   * Ticker in-process — DEV UNIQUEMENT (en prod/serverless, `/api/cron/tick` est le
   * déclencheur durable). Respecte désormais le `schedule` de chaque job via `runDue`.
   */
  start(): void {
    logger.info('[CronScheduler] Ticker in-process démarré (dev) — 1 passe/minute via runDue.');
    const interval = setInterval(() => {
      CronScheduler.runDue(new Date(), 1).catch((err) =>
        logger.error('[CronScheduler] runDue tick échoué', toError(err).message),
      );
    }, 60 * 1000);
    CronScheduler.activeIntervals.push(interval);
  },

  stop(): void {
    CronScheduler.activeIntervals.forEach(clearInterval);
    CronScheduler.activeIntervals = [];
    logger.info('[CronScheduler] CronScheduler arrêté.');
  },
};
