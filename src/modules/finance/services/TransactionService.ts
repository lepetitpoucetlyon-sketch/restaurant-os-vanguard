import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { FiscalEngine, FiscalSeal } from '../fiscalite/FiscalAdapter';
        // FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
        // eslint-disable-next-line vanguard/no-inter-module-imports
import { StockEngine } from '@/modules/logistics';
import { Order, StockItem, Recipe } from '@nexus/contracts';
import { DomainRegistry } from '@nexus/engines/DomainRegistry';
import { OperationalIdentity } from '@/shared/nexus-contract';
import { SovereignMath } from '@/shared/services/SovereignMath';

/**
 * 🏛️ TransactionService - Restaurant OS
 * Centralized Orchestrator for the "Critical Path" (Payment, Stock, Fiscal).
 * Grade X: Molecular Consistency & Domain-Registry Driven.
 */
export class TransactionService {

    /**
     * Processes a full payment flow with extreme data integrity.
     */
    static async processPayment(tenantId: string, orderId: string, options: { isTrainingMode?: boolean } = {}): Promise<{ success: boolean; hash: string }> {
        logger.info(`[TransactionService] Initiating Payment Flow for Order: ${orderId} (Tenant: ${tenantId})`);

        try {
            const batch = Nexus.adapter.batch();
            const timestamp = new Date();

            // 🏛️ RESOLVE DOMAIN PATHS (Grade X)
            const flowsPath = `tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.FLOWS)}`;
            const inventoryPath = `tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.LOGISTICS)}`;
            const resourcePath = `tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.RESOURCES)}`;
            const fiscalPath = `tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.LEDGER)}`;
            const crmPath = `tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.CRM)}`;
            const nodesPath = `tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.NODES)}`;

            const orderPath = `${flowsPath}/${orderId}`;

            // 1. DATA GATHERING
            const [order, recipes, allStock] = await Promise.all([
                Nexus.adapter.get<Order>(orderPath),
                Nexus.adapter.query<Recipe>(resourcePath),
                Nexus.adapter.query<StockItem>(inventoryPath)
            ]);

            if (!order) throw new Error(`Order ${orderId} not found.`);
            if (order.status === 'paid') throw new Error(`Order ${orderId} is already paid.`);

            // Canonical total (Microunits Protocol)
            const totalMicrounits = SovereignMath.orderTotalMicrounits(order);
            const orderTotalInCents = SovereignMath.toCents(BigInt(totalMicrounits));

            // 2. NF525 FISCAL SEALING
            const lastSeals = await Nexus.adapter.query<FiscalSeal>(fiscalPath, {
                orderBy: { field: 'timestamp', direction: 'desc' },
                limit: 1
            });
            const _lastHash = lastSeals.length > 0 ? lastSeals[0].hash : null;

            const seal = await FiscalEngine.sealEntry(order.id, {
                amount: orderTotalInCents,
                timestamp: timestamp.toISOString()
            }, {
                lastSeal: lastSeals.length > 0 ? lastSeals[0] : undefined, 
                instanceId: tenantId,
                isTrainingMode: options.isTrainingMode 
            });

            const sealId = Nexus.adapter.generateId(fiscalPath);
            batch.set(`${fiscalPath}/${sealId}`, seal);

            // 2b. JOURNAL ENTRY CREATION (Double-Entry PCG Accounting)
            const journalEntriesPath = `tenants/${tenantId}/journalEntries`;
            const entryId = Nexus.adapter.generateId(journalEntriesPath);

            batch.set(`${journalEntriesPath}/${entryId}`, {
                id: entryId,
                date: timestamp.getTime(),
                pieceNumber: `REC-${orderId}`,
                description: `Vente Encaissée - Commande #${orderId}`,
                referenceId: orderId,
                referenceType: 'order',
                type: 'revenue',
                amountInMicrounits: totalMicrounits,
                amountInCents: orderTotalInCents,
                isSystemGenerated: true,
                isValidated: true,
                fiscalSealHash: seal.hash,
                sealedAt: timestamp.toISOString(),
                status: 'posted',
                lines: [
                    { accountCode: '512000', accountName: 'Banque / Caisse', debitInMicrounits: totalMicrounits, debitInCents: orderTotalInCents, creditInMicrounits: 0, creditInCents: 0 },
                    { accountCode: '707000', accountName: 'Ventes de marchandises', debitInMicrounits: 0, debitInCents: 0, creditInMicrounits: totalMicrounits, creditInCents: orderTotalInCents }
                ],
                createdAt: timestamp.toISOString(),
                updatedAt: timestamp.toISOString()
            });

            // 3. STOCK DEDUCTION (Powered by StockEngine)
            const stockImpact = await StockEngine.calculateOrderStockImpact(
                order, 
                recipes, 
                allStock, 
                orderId
            );

            // Apply stock updates
            stockImpact.updates.forEach(upd => {
                batch.update(`${inventoryPath}/${upd.id}`, upd.data);
            });

            // Apply inventory movements
            stockImpact.movements.forEach(mov => {
                const movFullPath = `tenants/${tenantId}/inventory_movements`; // Specific audit trail
                const movId = Nexus.adapter.generateId(movFullPath);
                batch.set(`${movFullPath}/${movId}`, { ...mov, id: movId });
            });

            // 4. Customer & LOYALTY
            if (order.customerId) {
                const customerFullPath = `${crmPath}/${order.customerId}`;
                const customer = await Nexus.adapter.get<{ loyaltyPoints?: number; totalRevenue?: number; totalVisits?: number }>(customerFullPath);
                if (customer) {
                    const pointsToAdd = Math.floor(totalMicrounits / 1_000_000);
                    batch.update(customerFullPath, {
                        loyaltyPoints: (customer.loyaltyPoints || 0) + pointsToAdd,
                        totalRevenue: (customer.totalRevenue || 0) + (totalMicrounits / 1_000_000),
                        totalVisits: (customer.totalVisits || 0) + 1,
                        lastVisitDate: timestamp.toISOString(),
                        updatedAt: timestamp.toISOString()
                    });
                }
            }

            // 5. STATUS UPDATES
            batch.update(orderPath, {
                status: 'paid',
                updatedAt: timestamp.toISOString(),
                fiscalSealHash: seal.hash
            });

            if (order.tableId) {
                const tableFullPath = `${nodesPath}/${order.tableId}`;
                batch.update(tableFullPath, {
                    status: 'available',
                    lastCleanedAt: timestamp.toISOString()
                });
            }

            // 6. ATOMIC SECURE COMMIT
            await batch.commit();

            logger.info(`[TransactionService] Transaction Certified & Stock Deducted for Order ${orderId}`);
            return { success: true, hash: seal.hash };

        } catch (error) {
            logger.error(`[TransactionService] CRITICAL: Transaction failed!`, { error, orderId });
            throw error;
        }
    }
}
