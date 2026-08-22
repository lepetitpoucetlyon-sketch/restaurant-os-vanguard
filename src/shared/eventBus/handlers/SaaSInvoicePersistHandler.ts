import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';

/**
 * SaaSInvoicePersistHandler
 * Écoute `fleet.saas_billing_invoiced` — émis par MultiTenantBillingEngineService
 * après calcul de la facture SaaS mensuelle. Sans ce handler, la facture était
 * calculée puis jetée (émission dans le vide) — angle mort Track 2.1.
 */
export async function handleSaaSBillingInvoiced(payload: Record<string, unknown>) {
  const { tenantId, invoiceId, ...rest } = payload as {
    tenantId: string;
    invoiceId: string;
  } & Record<string, unknown>;

  await Nexus.adapter.set(`tenants/${tenantId}/saasInvoices/${invoiceId}`, {
    tenantId,
    invoiceId,
    ...rest,
    persistedAt: new Date().toISOString(),
  });
}

export function registerSaaSInvoicePersistHandler() {
  return NexusEventBus.on(
    'fleet.saas_billing_invoiced',
    handleSaaSBillingInvoiced as Parameters<typeof NexusEventBus.on>[1],
    { id: 'saas-invoice-persist-handler', priority: 'HIGH' }
  );
}
