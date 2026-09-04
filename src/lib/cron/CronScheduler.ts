import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { isCronDueWithin } from './cronMatch';
import { cronJobs } from './cronJobs';
export type { CronJobDefinition } from './cronJobs';

/**
 * CronScheduler (P0-2.1)
 * Moteur central d'exécution et d'orchestration des jobs cron pour tous les tenants de la flotte.
 * Intégré au cycle de vie de l'application.
 */
export const CronScheduler = {
  jobs: cronJobs,

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
