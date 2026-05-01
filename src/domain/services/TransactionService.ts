import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { FiscalEngine, FiscalSeal } from '@/infrastructure/adapters/FiscalAdapter';
import { StockEngine } from '@domain/services/StockEngine';
import { Order, StockItem, Recipe } from '@nexus/contracts';
import { getTenantPath } from '@/lib/firebase';

/**
 * 🏛️ TransactionService - Restaurant OS
 * Centralized Orchestrator for the "Critical Path" (Payment, Stock, Fiscal).
 * Grade VI: Zero Logic in Transport Layers.
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

            // 1. DATA GATHERING (Parallelized for Performance)
            const orderPath = `${getTenantPath('orders', tenantId)}/${orderId}`;
            const [order, recipes, allStock] = await Promise.all([
                Nexus.adapter.get<Order>(orderPath),
                Nexus.adapter.query<Recipe>(getTenantPath('recipes', tenantId)),
                Nexus.adapter.query<StockItem>(getTenantPath('stockItems', tenantId))
            ]);

            if (!order) throw new Error(`Order ${orderId} not found.`);
            if (order.status === 'paid') throw new Error(`Order ${orderId} is already paid.`);

            // 2. NF525 FISCAL SEALING
            const fiscalPath = getTenantPath('fiscalLedger', tenantId);
            const lastSeals = await Nexus.adapter.query<FiscalSeal>(fiscalPath, {
                orderBy: { field: 'timestamp', direction: 'desc' },
                limit: 1
            });
            const lastHash = lastSeals.length > 0 ? lastSeals[0].hash : null;

            const seal = await FiscalEngine.sealEntry(order.id, {
                amount: order.totalInCents, // Correction: changed from totalInCents to amount to match FiscalEngine expected data
                timestamp: timestamp.toISOString()
            }, { 
                lastSeal: lastHash ? { hash: lastHash } as any : undefined, 
                instanceId: tenantId,
                isTrainingMode: options.isTrainingMode 
            });

            const sealId = Nexus.adapter.generateId(fiscalPath);
            batch.set(`${fiscalPath}/${sealId}`, seal);

            // 3. STOCK DEDUCTION (Powered by StockEngine)
            const stockImpact = await StockEngine.calculateOrderStockImpact(
                order, 
                recipes, 
                allStock, 
                orderId
            );

            // Apply stock updates to batch
            stockImpact.updates.forEach(upd => {
                batch.update(`${getTenantPath('stockItems', tenantId)}/${upd.id}`, upd.data);
            });

            // Apply inventory movements to batch
            stockImpact.movements.forEach(mov => {
                const movPath = getTenantPath('inventoryMovements', tenantId);
                const movId = Nexus.adapter.generateId(movPath);
                batch.set(`${movPath}/${movId}`, { ...mov, id: movId });
            });

            // 4. Customer & LOYALTY (Typed Customer Data)
            if (order.customerId) {
                const customerPath = `${getTenantPath('clients', tenantId)}/${order.customerId}`;
                const customer = await Nexus.adapter.get(customerPath) as { loyaltyPoints?: number, totalRevenue?: number, totalVisits?: number } | null;
                if (customer) {
                    const pointsToAdd = Math.floor((order.totalInCents || 0) / 100);
                    batch.update(customerPath, {
                        loyaltyPoints: (customer.loyaltyPoints || 0) + pointsToAdd,
                        totalRevenue: (customer.totalRevenue || 0) + ((order.totalInCents || 0) / 100),
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
                const tablePath = `${getTenantPath('tables', tenantId)}/${order.tableId}`;
                batch.update(tablePath, {
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
