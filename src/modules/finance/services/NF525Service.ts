import { getTenantPath } from '@/lib/firebase';
import { Table } from 'dexie';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MasterBridge } from '@/lib/MasterBridge';
import { FiscalEngine, FiscalSeal } from '@/domain/services/FiscalEngine';
import { StockEngine } from '@/domain/services/StockEngine';
import { Order, StockItem, Recipe, InventoryMovement } from '@/types';
import { JournalEntry } from '../types/domain';
import { logger } from '@/lib/logger';
import { db } from '@/lib/offline/offline-store';
import { SyncManager } from '@/lib/offline/sync-manager';
import { checkOnlineStatus } from '@/lib/offline/status';
import { getDefaultStore } from 'jotai';
import { tenantIdAtom } from '@/modules/finance/store/accountingAtoms';
import { SovereignData } from '@/shared/nexus-contract';
import { secureCast } from '@/shared/validation/SchemaRegistry';

export interface FiscalInstruction {
    [key: string]: import('@/shared/nexus-contract').SovereignField | undefined;
    path: string;
    method: 'SET' | 'UPDATE' | 'DELETE';
    data: SovereignData;
}

/**
 * 🏛️ NF525Service - Restaurant OS
 * Secured for Phase 5 (IRM Surgery): Tenant Anchoring & Race Condition Protection.
 */
export class NF525Service {

    /**
     * Executes the payment with strict tenant anchoring.
     */
    static async executeAtomicPayment(orderId: string, options: { isTrainingMode?: boolean } = {}): Promise<void> {
        // 🛡️ ANCHORING: Capture tenantId at the exact start of transaction
        const store = getDefaultStore();
        const anchoredTenantId = store.get(tenantIdAtom);
        const isOnline = checkOnlineStatus();

        try {
            const order = await this.fetchBaseOrder(orderId, isOnline, anchoredTenantId);
            if (!order || order.status === 'paid') return;

            // 🛡️ RACE CONDITION CHECK
            const currentTenantId = store.get(tenantIdAtom);
            if (currentTenantId !== anchoredTenantId) {
                logger.warn(`[NF525] CRITICAL_DRIFT_PREVENTED: Tenant shifted from ${anchoredTenantId} to ${currentTenantId} during signature.`);
                MasterBridge.pushGlobalConfig({ 
                    maintenanceMode: false, 
                    killSwitch: false, 
                    securityLevel: 'high', 
                    globalMessage: `AUDIT: Drift detected for order ${orderId} on ${anchoredTenantId}`,
                    allowedFeatures: [] 
                }).catch(() => {}); // Silent audit log
            }

            const timestamp = new Date();
            const lastSeal = await this.getLastSeal(isOnline, anchoredTenantId);
            const seal = await FiscalEngine.sealEntry(orderId, {
                amount: order.totalInCents,
                timestamp: timestamp.toISOString()
            }, { lastSeal, isTrainingMode: options.isTrainingMode, instanceId: anchoredTenantId });

            const stockImpact = await this.getFiscalStockImpact(order, isOnline, anchoredTenantId);
            const instructions = this.prepareBatchInstructions(order, seal, stockImpact, timestamp, anchoredTenantId);

            await this.executeCommit(instructions, isOnline, orderId, anchoredTenantId);
        } catch (error) {
            logger.error('NF525Service: Atomic payment failed', { orderId, error });
            throw error;
        }
    }

    private static async fetchBaseOrder(orderId: string, isOnline: boolean, tenantId: string): Promise<Order | undefined> {
        let order: Order | undefined;
        if (isOnline) {
            const data = await Nexus.adapter.get(`${getTenantPath('orders', tenantId)}/${orderId}`);
            if (data) order = data as Order;
        }
        if (!order && typeof window !== 'undefined') {
            order = await db.orders.get(orderId);
        }
        return order;
    }

    private static async getFiscalStockImpact(order: Order, isOnline: boolean, tenantId: string): Promise<FiscalInstruction[]> {
        const impact: FiscalInstruction[] = [];
        const allStock = isOnline 
            ? await Nexus.adapter.query(getTenantPath('stockItems', tenantId))
            : (typeof window !== 'undefined' ? await db.stockItems.toArray() : []);
        
        const recipes = isOnline
            ? await Nexus.adapter.query(getTenantPath('recipes', tenantId))
            : (typeof window !== 'undefined' ? await db.recipes.toArray() : []);

        const stockImpact = await StockEngine.calculateOrderStockImpact(
            order, 
            recipes as Recipe[], 
            allStock as StockItem[], 
            order.id
        );

        stockImpact.updates.forEach(u => {
            impact.push({ 
                path: `${getTenantPath('stockItems', tenantId)}/${u.id}`, 
                method: 'UPDATE', 
                data: u.data 
            });
        });

        stockImpact.movements.forEach(m => {
            impact.push({ 
                path: `${getTenantPath('inventoryMovements', tenantId)}/${m.id}`, 
                method: 'SET', 
                data: secureCast<SovereignData<InventoryMovement>>('STOCK', 'movements', m)
            });
        });

        return impact;
    }


    private static prepareBatchInstructions(order: Order, seal: FiscalSeal, stockImpact: FiscalInstruction[], timestamp: Date, tenantId: string): FiscalInstruction[] {
        const journalId = `je_sale_${order.id}`;
        return [
            { path: `${getTenantPath('orders', tenantId)}/${order.id}`, method: 'UPDATE', data: { status: 'paid', updatedAt: timestamp.toISOString(), fiscalSealHash: seal.hash } as SovereignData },
            { path: `${getTenantPath('journalEntries', tenantId)}/${journalId}`, method: 'SET', data: { id: journalId, date: timestamp.toISOString(), amount: order.totalInCents, fiscalSealHash: seal.hash } as SovereignData },
            { path: `${getTenantPath('fiscalSeals', tenantId)}/${seal.id}`, method: 'SET', data: secureCast<SovereignData<FiscalSeal>>('FISCAL', 'seals', seal) },
            ...stockImpact
        ];
    }

    private static async executeCommit(instructions: FiscalInstruction[], isOnline: boolean, orderId: string, tenantId: string) {
        if (isOnline) {
            try {
                const batch = Nexus.adapter.batch();
                instructions.forEach(ins => {
                    if (ins.method === 'SET') batch.set(ins.path, ins.data);
                    else if (ins.method === 'UPDATE') batch.update(ins.path, ins.data);
                    else if (ins.method === 'DELETE') batch.delete(ins.path);
                });
                await batch.commit();
                return;
            } catch (err) { logger.warn('Online commit failed, using fallback.'); }
        }
        await this.executeOfflineFallback(orderId, instructions);
    }

    private static async getLastSeal(isOnline: boolean, tenantId: string): Promise<FiscalSeal | undefined> {
        if (isOnline) {
            const docs = await Nexus.adapter.query(getTenantPath('fiscalSeals', tenantId), {
                orderBy: { field: 'timestamp', direction: 'desc' },
                limit: 1
            });
            return docs.length > 0 ? secureCast<FiscalSeal>('FISCAL', 'seals', docs[0]) : undefined;
        }
        return typeof window !== 'undefined' ? await db.fiscalSeals.orderBy('timestamp').last() : undefined;
    }

    private static async executeOfflineFallback(orderId: string, instructions: FiscalInstruction[]) {
        if (typeof window === 'undefined') return;
        
        await db.transaction('rw', [db.orders, db.stockItems, db.inventoryMovements, db.journalEntries, db.fiscalSeals, db.syncQueue], async () => {
            for (const ins of instructions) {
                const parts = ins.path.split('/');
                const coll = parts[parts.length - 2];
                const id = parts[parts.length - 1];
                
                // Type-safe table selection (Grade VI)
                if (coll === 'orders') {
                    if (ins.method === 'SET') await db.orders.put(secureCast<Order>('ORDERS', 'orders', ins.data));
                    else if (ins.method === 'UPDATE') await db.orders.update(id, secureCast<Partial<Order>>('ORDERS', 'orders', ins.data));
                    else if (ins.method === 'DELETE') await db.orders.delete(id);
                } else if (coll === 'stockItems') {
                    if (ins.method === 'SET') await db.stockItems.put(secureCast<StockItem>('STOCK', 'items', ins.data));
                    else if (ins.method === 'UPDATE') await db.stockItems.update(id, secureCast<Partial<StockItem>>('STOCK', 'items', ins.data));
                    else if (ins.method === 'DELETE') await db.stockItems.delete(id);
                } else if (coll === 'inventoryMovements') {
                    if (ins.method === 'SET') await db.inventoryMovements.put(secureCast<InventoryMovement>('STOCK', 'movements', ins.data));
                    else if (ins.method === 'UPDATE') await db.inventoryMovements.update(id, secureCast<Partial<InventoryMovement>>('STOCK', 'movements', ins.data));
                    else if (ins.method === 'DELETE') await db.inventoryMovements.delete(id);
                } else if (coll === 'journalEntries') {
                    if (ins.method === 'SET') await db.journalEntries.put(secureCast<JournalEntry>('ACCOUNTING', 'journalEntries', ins.data));
                } else if (coll === 'fiscalSeals') {
                    if (ins.method === 'SET') await db.fiscalSeals.put(secureCast<FiscalSeal>('FISCAL', 'seals', ins.data));
                }
            }
        });
        await SyncManager.enqueue({ 
            type: 'NF525_PAYMENT', 
            action: 'COMMIT_BATCH', 
            targetId: orderId, 
            payload: { instructions }, 
            priority: 1,
            collection: 'orders'
        }); // Suture Grade X Complete
    }
}
