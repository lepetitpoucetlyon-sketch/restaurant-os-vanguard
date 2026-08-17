import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { dispatchServerEvent } from '@/shared/eventBus/ServerEventBus';

export async function handlePaymentFailed(obj: Record<string, unknown>): Promise<void> {
  const meta = (obj.metadata as Record<string, unknown>) || {};
  const tenantId = meta.tenantId as string | undefined;
  if (!tenantId) {
    logger.warn('[Stripe Webhook] payment_failed sans tenantId dans metadata — ignoré');
    return;
  }
  const amount = ((obj.amount_due ?? obj.amount ?? 0) as number) * 10000;

  const payload = {
    v: 1 as const,
    tenantId,
    invoiceId: (obj.id as string) || `inv_${Date.now()}`,
    customerId: (obj.customer as string) || `cust_${tenantId}`,
    amountInMicrounits: amount,
    reason: (obj.last_payment_error as { message?: string })?.message ?? 'Échec paiement Stripe',
  };

  await dispatchServerEvent('finance.payment_failed', payload);

  await Nexus.adapter.set(
    `tenants/${tenantId}/events/payment_failed_${Date.now()}`,
    payload
  );

  logger.warn(`[Stripe Webhook] finance.payment_failed émis et outboxé pour tenant ${tenantId}`);
}

export async function handlePaymentIntentSucceeded(obj: Record<string, unknown>): Promise<void> {
  const meta = (obj.metadata as Record<string, unknown>) || {};
  const tenantId = meta.tenantId as string | undefined;
  if (!tenantId) {
    logger.warn('[Stripe Webhook] payment_intent.succeeded sans tenantId dans metadata — ignoré');
    return;
  }
  const amount = ((obj.amount_received ?? obj.amount ?? 0) as number) * 10000;

  if (meta.type === 'deposit' || meta.type === 'reservation_deposit' || meta.reservationId) {
    const depositPayload = {
      v: 1 as const,
      tenantId,
      depositId: (obj.id as string) || `dep_${Date.now()}`,
      amountInMicrounits: amount,
      reservationId: meta.reservationId as string | undefined,
      customerId: (obj.customer as string) || undefined,
      paidAt: Date.now(),
    };

    await dispatchServerEvent('stripe.deposit_received' as never, depositPayload as never);
    await dispatchServerEvent('commerce.reservation_deposit_paid', depositPayload);
    logger.info(`[Stripe Webhook] commerce.reservation_deposit_paid & stripe.deposit_received émis pour tenant ${tenantId} acompte=${depositPayload.depositId}`);
  }
}
