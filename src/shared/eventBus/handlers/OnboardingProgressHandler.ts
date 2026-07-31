import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export class OnboardingProgressHandler {
  static register() {
    return NexusEventBus.on('tenant.onboarding_step_completed', async (payload) => {
      if (payload.isSimulation) return;
      const { tenantId, stepId } = payload;
      logger.info(`[Onboarding] Tenant ${tenantId} completed step ${stepId}`);

      try {
        await Nexus.adapter.update(`tenants/${tenantId}/mcc/onboarding/${stepId}`, {
            status: 'completed',
            completedAt: Date.now()
        });

        empireAudit.log({
            module: 'system',
            action: 'TENANT_ONBOARDING_STEP',
            userId: 'system',
            instanceId: tenantId,
            details: { stepId },
            severity: 'low',
            timestamp: new Date(),
        });
      } catch (err) {
        logger.error('[OnboardingProgressHandler] Error updating onboarding step', String(err));
      }
    }, { id: 'onboarding-progress', priority: 'BACKGROUND' });
  }
}
