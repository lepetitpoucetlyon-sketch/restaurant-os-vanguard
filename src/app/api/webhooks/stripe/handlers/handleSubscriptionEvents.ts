import crypto from 'crypto';
import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MosyleClient } from '@/lib/MosyleClient';
import type { StripeSubscription } from './stripeWebhookTypes';
import {
  PLAN_FEATURES,
  resolvePlanFromSubscription,
  extractTenantId,
} from './stripeWebhookTypes';

export async function handleSubscriptionEvent(
  eventType: 'customer.subscription.deleted' | 'customer.subscription.updated',
  subscription: StripeSubscription
): Promise<void> {
  const tenantId = extractTenantId(subscription);

  if (!tenantId) {
    logger.warn(
      `[Stripe Webhook] tenantId introuvable dans les métadonnées pour subscription ${subscription.id}`
    );
    return;
  }

  // ── P12-D / P12-J: subscription active → auto-enable features ──
  if (
    eventType === 'customer.subscription.updated' &&
    subscription.status === 'active'
  ) {
    const plan = resolvePlanFromSubscription(subscription);
    if (plan) {
      const features = PLAN_FEATURES[plan] ?? [];
      const previousFeatures = (await Nexus.adapter.get(
        `tenants/${tenantId}/billing/features`
      )) as { enabled?: string[] } | null;
      const previousEnabled = previousFeatures?.enabled ?? [];

      await Nexus.adapter.set(`tenants/${tenantId}/billing/features`, {
        plan,
        enabled: features,
        updatedAt: Date.now(),
        subscriptionId: subscription.id,
      });

      const newFeatures = features.filter(f => !previousEnabled.includes(f));
      if (newFeatures.length > 0) {
        await Nexus.adapter.set(
          `tenants/${tenantId}/notifications/${crypto.randomUUID()}`,
          {
            type: 'features_unlocked',
            title: 'Nouvelles fonctionnalites disponibles',
            message: `Plan ${plan} active. Nouveaux modules : ${newFeatures.join(', ')}`,
            read: false,
            createdAt: Date.now(),
          }
        );
      }

      logger.info(
        `[Stripe Webhook] Tenant ${tenantId} plan=${plan} features=[${features.join(',')}] (sub: ${subscription.id})`
      );
    } else {
      logger.warn(
        `[Stripe Webhook] Active subscription ${subscription.id} — unable to resolve plan tier`
      );
    }
    return;
  }

  // ── Subscription non-active or deleted → restrict tenant ──
  await Nexus.adapter.update(
    `tenants/${tenantId}`,
    { status: 'RESTRICTED', restrictedSince: Date.now() },
    { vassalId: tenantId, actorId: 'stripe-webhook' }
  );

  logger.info(
    `[Stripe Webhook] Tenant ${tenantId} restreint (event: ${eventType}, sub: ${subscription.id})`
  );

  // ── P12-E: emit tenant.subscription_expired for GracePeriodHandler ──
  if (eventType === 'customer.subscription.deleted') {
    await Nexus.adapter.set(
      `tenants/${tenantId}/events/subscription_expired_${Date.now()}`,
      {
        type: 'tenant.subscription_expired',
        v: 1,
        tenantId,
        expiredAt: new Date().toISOString(),
        processed: false,
        createdAt: Date.now(),
      }
    );

    await Nexus.adapter.set(
      `tenants/${tenantId}/notifications/${crypto.randomUUID()}`,
      {
        type: 'subscription_expired',
        title: 'Abonnement expire',
        message: 'Votre abonnement a expire. Une periode de grace de 7 jours est active.',
        read: false,
        createdAt: Date.now(),
      }
    );

    logger.info(
      `[Stripe Webhook] tenant.subscription_expired persisted for tenant ${tenantId} (grace period)`
    );
  }

  // Kill switch MDM : verrouiller les iPads du tenant (fire-and-forget)
  if (process.env.MOSYLE_API_KEY) {
    void (async () => {
      try {
        const assignment = (await Nexus.adapter.get(
          `mcc/deviceAssignments/${tenantId}`
        )) as { serialNumbers?: string[] } | null;
        const serials = assignment?.serialNumbers ?? [];
        await Promise.all(serials.map(sn => MosyleClient.lockDevice(sn)));
        if (serials.length > 0) {
          logger.info(`[MDM Kill Switch] ${serials.length} device(s) verrouillé(s) pour tenant ${tenantId}`);
        }
      } catch (err) {
        logger.error(`[MDM Kill Switch] Erreur verrouillage devices tenant ${tenantId}`, err);
      }
    })();
  }
}
