import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DistributedCronLock } from '@/lib/cron/DistributedCronLock';
import { CronScheduler } from '@/lib/cron/CronScheduler';
import { Nexus } from '@/lib/nexus/NexusAdapter';

describe('⏰ Distributed Cron Locking & Catch-up (Phase 4)', () => {
  const tenantId = 'tenant_lock_test_1';
  const jobName = 'test_cron_task';
  const windowKey = '2026-09-05T12-00';

  beforeEach(async () => {
    vi.restoreAllMocks();
  });

  it('permet à un seul worker d acquérir le bail pour une même fenêtre temporelle', async () => {
    const worker1 = 'worker_node_1';
    const worker2 = 'worker_node_2';

    // Worker 1 tente d'acquérir le lock
    const res1 = await DistributedCronLock.acquireLock(jobName, tenantId, windowKey, worker1, 10_000);
    expect(res1.acquired).toBe(true);

    // Worker 2 tente immédiatement sur la même fenêtre
    const res2 = await DistributedCronLock.acquireLock(jobName, tenantId, windowKey, worker2, 10_000);
    expect(res2.acquired).toBe(false);
    expect(res2.reason).toBe('CURRENTLY_RUNNING');

    // Worker 1 termine son exécution
    await DistributedCronLock.completeLock(jobName, tenantId, windowKey, worker1);

    // Un autre essai dans la même fenêtre doit refuser l'exécution car déjà achevée
    const res3 = await DistributedCronLock.acquireLock(jobName, tenantId, windowKey, worker2, 10_000);
    expect(res3.acquired).toBe(false);
    expect(res3.reason).toBe('ALREADY_COMPLETED');
  });

  it('autorise la reprise si le bail a expiré suite au crash d un worker', async () => {
    const workerCrash = 'worker_crashed';
    const workerRescue = 'worker_rescue';
    const shortTtlMs = 50; // TTL très court pour le test

    // Worker initial prend le lock avec TTL 50ms
    const res1 = await DistributedCronLock.acquireLock(jobName, tenantId, 'window_crash_test', workerCrash, shortTtlMs);
    expect(res1.acquired).toBe(true);

    // On simule le passage du temps (expiration du TTL)
    await new Promise((resolve) => setTimeout(resolve, 60));

    // Le worker de secours doit pouvoir récupérer le lock abandonné
    const res2 = await DistributedCronLock.acquireLock(jobName, tenantId, 'window_crash_test', workerRescue, 5000);
    expect(res2.acquired).toBe(true);
  });

  it('empêche la double exécution lors d un double tick simultané de CronScheduler', async () => {
    // Créer un tenant de test dans Nexus
    await Nexus.adapter.set(`tenants/${tenantId}`, { id: tenantId, name: 'Test Tenant Lock' });

    let executionCount = 0;
    const dummyJob = {
      name: 'dummy_counted_job',
      schedule: '* * * * *', // due chaque minute
      runForTenant: async () => {
        executionCount++;
        await new Promise((r) => setTimeout(r, 10));
      },
    };

    const originalJobs = CronScheduler.jobs;
    CronScheduler.jobs = [dummyJob];

    try {
      const fixedDate = new Date('2026-09-05T14:30:00Z');

      // Deux appels concurrents à runDue pour la même fenêtre
      const [run1, run2] = await Promise.all([
        CronScheduler.runDue(fixedDate, 5),
        CronScheduler.runDue(fixedDate, 5),
      ]);

      // Un seul run a exécuté le job
      expect(executionCount).toBe(1);
      expect(run1.ran + run2.ran).toBe(1);
    } finally {
      CronScheduler.jobs = originalJobs;
    }
  });

  it('rejoue activement une fenêtre manquée lorsqu un historique existe pour ce tenant', async () => {
    const executedWindows: string[] = [];
    const jobWithReplay = {
      name: 'job_with_replay',
      schedule: '* * * * *',
      runForTenant: async () => {
        executedWindows.push(new Date().toISOString());
      },
    };

    const originalJobs = CronScheduler.jobs;
    CronScheduler.jobs = [jobWithReplay];

    try {
      // Simuler une exécution passée à 14:00 (fenêtre 14-00)
      const oldWindow = '2026-09-05T14-00';
      const historyPath = DistributedCronLock.getHistoryPath(jobWithReplay.name, tenantId);
      await Nexus.adapter.set(historyPath, {
        jobName: 'job_with_replay',
        tenantId,
        lastCompletedWindow: oldWindow,
        lastCompletedAt: Date.now() - 15 * 60 * 1000,
      });

      // Maintenant à 14:10, la fenêtre précédente était 14:05 (non complétée)
      const testNow = new Date('2026-09-05T14:10:00Z');
      const result = await CronScheduler.runDue(testNow, 5);

      // Doit avoir exécuté à la fois le rattrapage (14:05) et la fenêtre courante (14:10)
      expect(result.ran).toBe(2);
      expect(executedWindows.length).toBe(2);
    } finally {
      CronScheduler.jobs = originalJobs;
    }
  });
});
