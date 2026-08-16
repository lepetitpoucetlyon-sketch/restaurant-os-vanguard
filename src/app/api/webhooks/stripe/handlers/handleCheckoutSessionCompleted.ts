import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { TenantProvisioningService } from '@/lib/mcc/provisioning/TenantProvisioningService';
import type { StripeCheckoutSession } from './stripeWebhookTypes';

export async function handleCheckoutSessionCompleted(session: StripeCheckoutSession): Promise<void> {
  if (session.payment_status !== 'paid') {
    logger.info(`[Stripe Webhook] checkout.session.completed ignoré — payment_status=${session.payment_status}`);
    return;
  }

  const meta = session.metadata ?? {};
  const { companyName, siret, ownerName, planId, primaryColor, logoUrl } = meta;
  const ownerEmail = session.customer_details?.email ?? null;

  if (!companyName || !siret || !ownerEmail) {
    logger.error(
      `[Stripe Webhook] checkout.session.completed — métadonnées manquantes (companyName, siret, ownerEmail requis). Session: ${session.id}`
    );
    return;
  }

  const existingConfig = await Nexus.adapter.get(`tenants/tenant_${siret}/tenantConfig`).catch(() => null);
  if (existingConfig) {
    logger.info(`[Stripe Webhook] Tenant tenant_${siret} déjà provisionné — session ${session.id} ignorée (idempotence)`);
    return;
  }

  logger.info(`[Stripe Webhook] Lancement provisionnement B2B pour ${companyName} (${siret})`);

  void (async () => {
    try {
      const result = await TenantProvisioningService.provisionNewClient({
        ownerEmail,
        ownerName: ownerName ?? ownerEmail,
        companyName,
        siret,
        planId: planId ?? 'STANDARD',
        branding: {
          primaryColor: primaryColor ?? '#6366f1',
          logoUrl: logoUrl ?? undefined,
        },
      });
      logger.info(`[Stripe Webhook] Provisionnement terminé: tenantId=${result.tenantId} stripe=${result.stripeCustomerId}`);
    } catch (err) {
      logger.error(`[Stripe Webhook] Échec provisionnement pour ${companyName} (${siret})`, err);
    }
  })();
}
