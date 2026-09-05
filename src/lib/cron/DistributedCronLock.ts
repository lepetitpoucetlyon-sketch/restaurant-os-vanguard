import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export type CronLockStatus = 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface CronLockRecord {
  jobName: string;
  tenantId: string;
  windowKey: string;
  workerId: string;
  status: CronLockStatus;
  leasedAt: number;
  leasedUntil: number;
  completedAt?: number;
  failedAt?: number;
  error?: string;
}

export interface AcquireCronLockResult {
  acquired: boolean;
  lockId: string;
  workerId: string;
  reason?: 'ALREADY_COMPLETED' | 'CURRENTLY_RUNNING' | 'TRANSACTION_FAILED';
}

/**
 * 🔒 DistributedCronLock (Phase 4 Audit Remediation)
 *
 * Verrou distribué multi-worker par (job, tenant, fenêtre) garantissant :
 *  1. Zéro double exécution concurrente d'une même tâche sur le même tenant.
 *  2. Reprise sur expiration de bail si un worker crash en cours d'exécution.
 *  3. Clôture protégée par workerId (un worker obsolète ne peut pas écraser un bail repris).
 *  4. Traçabilité des exécutions et rattrapage des fenêtres manquées.
 */
export class DistributedCronLock {
  private static readonly DEFAULT_TTL_MS = 300_000; // 5 minutes

  /**
   * Calcule la clé de fenêtre temporelle normalisée.
   */
  static computeWindowKey(now: Date, windowMinutes: number): string {
    const ms = windowMinutes * 60 * 1000;
    const slot = Math.floor(now.getTime() / ms) * ms;
    return new Date(slot).toISOString().replace(/[:.]/g, '-').slice(0, 16);
  }

  /**
   * Calcule la clé de fenêtre précédente pour vérifier les retards / manques.
   */
  static computePreviousWindowKey(now: Date, windowMinutes: number): string {
    const ms = windowMinutes * 60 * 1000;
    const prevDate = new Date(now.getTime() - ms);
    return this.computeWindowKey(prevDate, windowMinutes);
  }

  static getLockPath(jobName: string, tenantId: string, windowKey: string): string {
    const cleanJob = jobName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanTenant = tenantId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `cron_locks/${cleanJob}__${cleanTenant}__${windowKey}`;
  }

  static getHistoryPath(jobName: string, tenantId: string): string {
    const cleanJob = jobName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanTenant = tenantId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `cron_history/${cleanJob}__${cleanTenant}`;
  }

  /**
   * Tente d'acquérir le bail distribué pour (job, tenant, fenêtre).
   */
  static async acquireLock(
    jobName: string,
    tenantId: string,
    windowKey: string,
    workerId: string = `worker_${Math.random().toString(36).slice(2, 8)}`,
    ttlMs: number = this.DEFAULT_TTL_MS,
  ): Promise<AcquireCronLockResult> {
    const lockPath = this.getLockPath(jobName, tenantId, windowKey);
    const now = Date.now();

    try {
      const acquired = await Nexus.adapter.runTransaction(async (trx) => {
        const existing = await trx.get<CronLockRecord>(lockPath);

        if (existing) {
          if (existing.status === 'COMPLETED') {
            return { acquired: false, reason: 'ALREADY_COMPLETED' as const };
          }
          if (existing.status === 'RUNNING' && now < existing.leasedUntil) {
            return { acquired: false, reason: 'CURRENTLY_RUNNING' as const };
          }
        }

        const newRecord: CronLockRecord = {
          jobName,
          tenantId,
          windowKey,
          workerId,
          status: 'RUNNING',
          leasedAt: now,
          leasedUntil: now + ttlMs,
        };

        await trx.set(lockPath, newRecord);
        return { acquired: true };
      });

      return {
        acquired: acquired.acquired,
        lockId: lockPath,
        workerId,
        reason: acquired.reason,
      };
    } catch (err) {
      logger.error(`[DistributedCronLock] Erreur d'acquisition lock ${lockPath}`, err);
      return {
        acquired: false,
        lockId: lockPath,
        workerId,
        reason: 'TRANSACTION_FAILED',
      };
    }
  }

  /**
   * Clôture avec succès un verrou après exécution de la tâche.
   * Vérifie que le worker qui clôture est bien le détenteur actuel du bail.
   */
  static async completeLock(
    jobName: string,
    tenantId: string,
    windowKey: string,
    workerId: string,
  ): Promise<boolean> {
    const lockPath = this.getLockPath(jobName, tenantId, windowKey);
    const now = Date.now();

    try {
      return await Nexus.adapter.runTransaction(async (trx) => {
        const existing = await trx.get<CronLockRecord>(lockPath);
        if (existing && existing.workerId !== workerId) {
          logger.warn(
            `[DistributedCronLock] Clôture rejetée : bail repris par un autre worker (${workerId} !== ${existing.workerId})`,
          );
          return false;
        }

        const completedRecord: CronLockRecord = {
          ...(existing ?? {
            jobName,
            tenantId,
            windowKey,
            leasedAt: now,
            workerId,
            leasedUntil: now + 60_000,
          }),
          status: 'COMPLETED',
          completedAt: now,
        };
        trx.set(lockPath, completedRecord);

        // Historique du dernier passage pour le monitoring et rattrapage
        const historyPath = this.getHistoryPath(jobName, tenantId);
        trx.set(historyPath, {
          jobName,
          tenantId,
          lastCompletedWindow: windowKey,
          lastCompletedAt: now,
        });
        return true;
      });
    } catch (err) {
      logger.error(`[DistributedCronLock] Échec de completeLock pour ${lockPath}`, err);
      return false;
    }
  }

  /**
   * Marque l'échec d'une exécution pour permettre une relance ou analyse DLQ.
   */
  static async failLock(
    jobName: string,
    tenantId: string,
    windowKey: string,
    workerId: string,
    error: string,
  ): Promise<boolean> {
    const lockPath = this.getLockPath(jobName, tenantId, windowKey);
    try {
      return await Nexus.adapter.runTransaction(async (trx) => {
        const existing = await trx.get<CronLockRecord>(lockPath);
        if (existing && existing.workerId !== workerId) {
          return false;
        }
        const failedRecord: CronLockRecord = {
          ...(existing ?? {
            jobName,
            tenantId,
            windowKey,
            leasedAt: Date.now(),
            workerId,
            leasedUntil: Date.now() + 60_000,
          }),
          status: 'FAILED',
          failedAt: Date.now(),
          error,
        };
        trx.set(lockPath, failedRecord);
        return true;
      });
    } catch {
      return false;
    }
  }

  /**
   * Récupère le dernier historique d'exécution pour analyser d'éventuels retards.
   */
  static async getLastExecution(
    jobName: string,
    tenantId: string,
  ): Promise<{ lastCompletedWindow?: string; lastCompletedAt?: number } | null> {
    const historyPath = this.getHistoryPath(jobName, tenantId);
    return Nexus.adapter.get(historyPath);
  }

  /**
   * Détecte si la fenêtre précédente a été manquée et nécessite un rattrapage.
   */
  static async isWindowCompleted(jobName: string, tenantId: string, windowKey: string): Promise<boolean> {
    const lockPath = this.getLockPath(jobName, tenantId, windowKey);
    const record = await Nexus.adapter.get<CronLockRecord>(lockPath);
    return record?.status === 'COMPLETED';
  }
}
