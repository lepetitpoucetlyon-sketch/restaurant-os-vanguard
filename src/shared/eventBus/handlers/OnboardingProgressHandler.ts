import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

const ONBOARDING_STEPS = [
  'welcome',
  'restaurant_config',
  'menu_setup',
  'staff_setup',
  'pos_config',
  'payment_setup',
  'haccp_setup',
  'go_live',
] as const;

export class OnboardingProgressHandler {
  static register() {
    return NexusEventBus.on('tenant.onboarding_step_completed', async (payload) => {
      if (payload.isSimulation) return;
      const { tenantId, stepId } = payload;
      logger.info(`[Onboarding] Tenant ${tenantId} completed step ${stepId}`);

      try {
        // Mark current step as completed
        await Nexus.adapter.update(`tenants/${tenantId}/mcc/onboarding/${stepId}`, {
          status: 'completed',
          completedAt: Date.now(),
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

        // Unlock next step in the dependency graph
        const currentIndex = ONBOARDING_STEPS.indexOf(stepId as typeof ONBOARDING_STEPS[number]);
        if (currentIndex >= 0 && currentIndex < ONBOARDING_STEPS.length - 1) {
          const nextStepId = ONBOARDING_STEPS[currentIndex + 1];
          await Nexus.adapter.set(`tenants/${tenantId}/mcc/onboarding/${nextStepId}`, {
            status: 'unlocked',
            unlockedAt: Date.now(),
          }, { merge: true });
          logger.info(`[Onboarding] Tenant ${tenantId} — next step unlocked: ${nextStepId}`);
        }

        // Calculate and persist progress
        const completedSteps = currentIndex >= 0 ? currentIndex + 1 : 0;
        const totalSteps = ONBOARDING_STEPS.length;
        const percentage = Math.round((completedSteps / totalSteps) * 100);

        await Nexus.adapter.set(`tenants/${tenantId}/mcc/onboarding/progress`, {
          completedSteps,
          totalSteps,
          percentage,
          lastCompletedStep: stepId,
          updatedAt: Date.now(),
        });

        // If all steps completed, emit onboarding-complete notification
        if (completedSteps === totalSteps) {
          await Nexus.adapter.set(`tenants/${tenantId}/notifications/${crypto.randomUUID()}`, {
            type: 'onboarding_complete',
            title: 'Onboarding termine',
            message: `Toutes les etapes d'onboarding sont terminees. Votre restaurant est pret !`,
            read: false,
            createdAt: Date.now(),
          });
          logger.info(`[Onboarding] Tenant ${tenantId} — onboarding fully completed (${totalSteps}/${totalSteps})`);
        }
      } catch (err) {
        logger.error('[OnboardingProgressHandler] Error updating onboarding step', String(err));
      }
    }, { id: 'onboarding-progress', priority: 'BACKGROUND' });
  }
}
