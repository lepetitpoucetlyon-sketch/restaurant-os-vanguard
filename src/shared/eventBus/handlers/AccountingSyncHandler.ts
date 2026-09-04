import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { decryptCredentials } from '@/lib/server/credentialCipher';
import { AccountingProviderFactory } from '@/modules/finance';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';
import type { ConnectorState } from '@/shared/connector-manifest';

const ACCOUNTING_CONNECTOR_IDS = ['pennylane'] as const;


/**
 * Résout le provider comptable actif du tenant (le premier connecteur actif
 * de catégorie 'accounting'). Renvoie null si aucun connecteur actif.
 * Silent skip = comportement voulu : tant que le resto n'a pas branché Pennylane,
 * on ne pousse rien mais on ne throw pas.
 */
async function resolveActiveAccountingProvider(tenantId: string): Promise<{
    providerId: string;
    credentials: Record<string, string>;
} | null> {
    for (const id of ACCOUNTING_CONNECTOR_IDS) {
        const stored = await Nexus.adapter.get<ConnectorState & { credentials?: string }>(
            `tenants/${tenantId}/connectors/${id}`
        );
        if (stored?.status === 'active') {
            return {
                providerId: id,
                credentials: stored.credentials ? decryptCredentials(stored.credentials) : {},
            };
        }
    }
    return null;
}

/**
 * AccountingSyncHandler — pousse chaque vente encaissée et chaque facture
 * fournisseur validée vers le connecteur comptable actif du tenant.
 *
 * AVANT : AccountingProviderFactory + PennylaneProvider existaient mais
 * n'étaient jamais appelés — connecteur posé, jamais raccordé.
 *
 * MAINTENANT : ce handler écoute `order.paid` et `supplier.invoice_processed`,
 * et pousse vers le provider actif du tenant. Silent skip si aucun connecteur
 * n'est activé (comportement voulu : la majorité des restos n'auront pas de
 * comptable externe branché).
 *
 * Priorité BACKGROUND : la vente NF525 n'attend jamais Pennylane.
 */
import { IdempotencyGuard } from '../IdempotencyGuard';

export function registerAccountingSyncHandler(): () => void {
    const unsubOrder = NexusEventBus.on(
        'order.paid',
        IdempotencyGuard.withIdempotencyGuard(
            'accounting-sync-order-paid',
            'order.paid',
            async (payload) => {
                try {
                    const active = await resolveActiveAccountingProvider(payload.tenantId);
                    if (!active) return;

                    const provider = AccountingProviderFactory.get(active.providerId, active.credentials);
                    // Pennylane travaille en euros (float), notre bus en microunits.
                    const amountEuros = payload.totalInMicrounits / 1_000_000;
                    const saleDate = payload.businessDay ?? (payload.occurredAt ? payload.occurredAt.slice(0, 10) : new Date().toISOString().slice(0, 10));

                    await provider.pushEntry({
                        id: payload.orderId,
                        amount: amountEuros,
                        label: `Vente POS ${payload.orderId}`,
                        date: saleDate,
                        type: 'credit',
                        accountCode: '70100000',
                    });

                    logger.info(
                        `[AccountingSync] order.paid → ${active.providerId} orderId=${payload.orderId} tenantId=${payload.tenantId} date=${saleDate}`
                    );
                } catch (err) {
                    // On log mais on ne throw pas — la vente NF525 est déjà scellée,
                    // Pennylane est un canal secondaire.
                    logger.error(
                        `[AccountingSync] order.paid push failed tenantId=${payload.tenantId} orderId=${payload.orderId}`,
                        toError(err).message
                    );
                }
            }
        ),
        // `idempotent: false` = opt-out EXPLICITE de l'auto-emballage du bus (mutationEvents) :
        // l'idempotence est déjà assurée par le `withIdempotencyGuard` manuel ci-dessus.
        { id: 'accounting-sync-order-paid', priority: 'BACKGROUND', idempotent: false }
    );

    const unsubSupplier = NexusEventBus.on(
        'supplier.invoice_processed',
        async (payload) => {
            try {
                const active = await resolveActiveAccountingProvider(payload.tenantId);
                if (!active) return;

                const provider = AccountingProviderFactory.get(active.providerId, active.credentials);
                const totalMicrounits = payload.lines.reduce(
                    (acc, l) => acc + (l.unitCostInMicrounits || 0),
                    0
                );

                await provider.pushExpense({
                    id: payload.invoiceId,
                    amount: totalMicrounits / 1_000_000,
                    vendor: payload.supplierId,
                    date: new Date(payload.processedAt).toISOString().slice(0, 10),
                });

                logger.info(
                    `[AccountingSync] supplier.invoice_processed → ${active.providerId} invoiceId=${payload.invoiceId} tenantId=${payload.tenantId}`
                );
            } catch (err) {
                logger.error(
                    `[AccountingSync] supplier.invoice_processed push failed tenantId=${payload.tenantId} invoiceId=${payload.invoiceId}`,
                    toError(err).message
                );
            }
        },
        { id: 'accounting-sync-supplier-invoice', priority: 'BACKGROUND' }
    );

    return () => {
        unsubOrder();
        unsubSupplier();
    };
}
