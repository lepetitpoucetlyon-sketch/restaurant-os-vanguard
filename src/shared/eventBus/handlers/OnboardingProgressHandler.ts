import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

export class OnboardingProgressHandler {
  static register() {
    return NexusEventBus.on('tenant.onboarding_step_completed', async (payload) => {
      if (payload.isSimulation) return;
      const { tenantId, stepId } = payload;
      logger.info(`[Onboarding] Tenant ${tenantId} completed step ${stepId}`);

      empireAudit.log({
        module: 'system',
        action: 'TENANT_ONBOARDING_STEP',
        userId: 'system',
        instanceId: tenantId,
        details: { stepId },
        severity: 'low',
        timestamp: new Date(),
      });
    });
  }
}
