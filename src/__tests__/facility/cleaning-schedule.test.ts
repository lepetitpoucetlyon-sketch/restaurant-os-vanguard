import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CleaningScheduleService } from '@/modules/facility/spaces/services/CleaningScheduleService';
import { Nexus } from '@/lib/nexus/NexusAdapter';

describe('Zone 9 Facility : Check-list Ménage & Traçabilité Hygiène PND', () => {
  const tenantId = 'brasserie-nantes';
  const businessDate = '2026-08-15';

  beforeEach(async () => {
    vi.clearAllMocks();
    await Nexus.adapter.delete(`tenants/${tenantId}/cleaningDailyLogs/${businessDate}`);
  });

  it('devrait enregistrer une tâche de nettoyage exécutée et permettre la contre-signature superviseur', async () => {
    // 1. Enregistrement par le commis
    const entry = await CleaningScheduleService.recordCleaningExecution(tenantId, {
      taskId: 'task_kitchen_surfaces_close',
      area: 'KITCHEN',
      businessDate,
      executedBy: 'commis-antoine',
      status: 'COMPLETED',
      notes: 'Tous les plans inox désinfectés à 60°C',
    });

    expect(entry.id).toBeDefined();
    expect(entry.status).toBe('COMPLETED');
    expect(entry.supervisorValidatedBy).toBeUndefined();

    // 2. Contre-signature par le second de cuisine
    const validated = await CleaningScheduleService.validateBySupervisor(
      tenantId,
      businessDate,
      'task_kitchen_surfaces_close',
      'chef-damien'
    );

    expect(validated.supervisorValidatedBy).toBe('chef-damien');
    expect(validated.supervisorValidatedAt).toBeDefined();
  });

  it('devrait calculer le taux de conformité journalier HACCP', async () => {
    // Enregistrement des 3 tâches obligatoires
    const tasks = CleaningScheduleService.getProtocolTasks();

    for (const task of tasks) {
      await CleaningScheduleService.recordCleaningExecution(tenantId, {
        taskId: task.id,
        area: task.area,
        businessDate,
        executedBy: 'equipe-fermeture',
        status: 'COMPLETED',
      });
    }

    const report = await CleaningScheduleService.getDailyCompliance(tenantId, businessDate);

    expect(report.completedCount).toBe(3);
    expect(report.complianceRatePercent).toBe(100);
    expect(report.isFullyCompliant).toBe(true);
  });
});
