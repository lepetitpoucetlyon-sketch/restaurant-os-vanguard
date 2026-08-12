import { logger } from '@/lib/logger';
import { db } from "@/lib/offline/offline-store";
import { Order } from '@nexus/contracts';
import { CryptoService } from '@/lib/CryptoService';
import { toError } from "@/lib/toError";

const lazyAudit = () => import('@/modules/compliance').then(m => m.ImmunityAuditLogger);

const GENESIS_HASH = '0'.repeat(64);
const INSTANCE_PREFIX_LENGTH = 4;

interface OfflineSeal {
    id: string;
    receiptNumber: string;
    dataSnapshot: string;
    hash: string;
    previousHash: string;
    timestamp: string;
    synced: boolean;
}

export const OfflineMasteryEngine = {
    _instanceId: '',
    _offlineSeqCounter: 0,
    _lastOfflineHash: GENESIS_HASH,

    getInstanceId(): string {
        if (!this._instanceId) {
            this._instanceId = Math.random().toString(36).slice(2, 2 + INSTANCE_PREFIX_LENGTH).toUpperCase();
        }
        return this._instanceId;
    },

    generateOfflineReceiptNumber(): string {
        this._offlineSeqCounter++;
        const year = new Date().getFullYear();
        const seq = String(this._offlineSeqCounter).padStart(6, '0');
        return `${year}-${this.getInstanceId()}-${seq}`;
    },

    async sealOffline(data: Record<string, unknown>): Promise<OfflineSeal> {
        const receiptNumber = this.generateOfflineReceiptNumber();
        const timestamp = new Date().toISOString();

        const dataSnapshot = CryptoService.canonicalStringify({
            ...data,
            receiptNumber,
            timestamp,
            instanceId: this.getInstanceId(),
        } as import("@nexus/contracts/nexus-contract").SovereignData);

        const hash = await CryptoService.generateHash(dataSnapshot, this._lastOfflineHash);

        const seal: OfflineSeal = {
            id: `offline-${this.getInstanceId()}-${this._offlineSeqCounter}`,
            receiptNumber,
            dataSnapshot,
            hash,
            previousHash: this._lastOfflineHash,
            timestamp,
            synced: false,
        };

        this._lastOfflineHash = hash;

        await db.syncQueue.add({
            type: 'FISCAL_SEAL',
            action: 'SET',
            collection: 'offlineSeals',
            targetId: seal.id,
            payload: seal as unknown as import('@nexus/contracts/nexus-contract').SovereignField,
            status: 'pending',
            timestamp: timestamp,
            priority: 1,
            attempts: 0,
        });

        return seal;
    },

    async bufferTransaction(order: Order) {
        logger.info(`[Offline-Mastery] Buffering Order ${order.id}. Current connectivity: [LOW/NONE]`);
        await db.orders.add(order);

        await this.sealOffline({
            orderId: order.id,
            totalInMicrounits: (order as unknown as { totalInMicrounits?: number }).totalInMicrounits ?? 0,
            operatorId: (order as unknown as { operatorId?: string }).operatorId ?? '',
        });

        lazyAudit().then(a => a.logTechnicalEvent({
            eventType: 'power_outage',
            description: `Vente scellée hors-ligne: ${order.id}`,
            deviceId: this.getInstanceId(),
        })).catch(() => {});
    },

    async verifyChainIntegrity(): Promise<{ valid: boolean; brokenAt?: number }> {
        const seals = await db.syncQueue
            .where('collection').equals('offlineSeals')
            .sortBy('timestamp');

        if (seals.length === 0) return { valid: true };

        let expectedPrev = GENESIS_HASH;
        for (let i = 0; i < seals.length; i++) {
            const seal = seals[i].payload as unknown as OfflineSeal;
            if (seal.previousHash !== expectedPrev) {
                logger.error(`[Offline-Mastery] Chain break at seal index ${i}: expected ${expectedPrev}, got ${seal.previousHash}`);
                lazyAudit().then(a => a.logTechnicalEvent({
                    eventType: 'chain_break',
                    description: `Rupture de chaîne détectée à l'index ${i}`,
                    deviceId: this.getInstanceId(),
                })).catch(() => {});
                return { valid: false, brokenAt: i };
            }
            expectedPrev = seal.hash;
        }
        return { valid: true };
    },

    async reconcileFleet(tenantId: string): Promise<{ synced: number; failed: number; chainValid: boolean }> {
        logger.info(`[Offline-Mastery] Initiating Mass Reconciliation for ${tenantId}...`);

        const chainCheck = await this.verifyChainIntegrity();

        const pending = await db.syncQueue
            .where('status').equals('pending')
            .sortBy('timestamp');

        if (pending.length === 0) return { synced: 0, failed: 0, chainValid: chainCheck.valid };

        logger.info(`[Offline-Mastery] ${pending.length} operations to synchronize (chain ${chainCheck.valid ? 'OK' : 'BROKEN'}).`);

        let synced = 0;
        let failed = 0;

        for (const op of pending) {
            try {
                await db.syncQueue.update(op.id!, { status: 'syncing' });

                const { Nexus } = await import('@/lib/nexus/NexusAdapter');
                await Nexus.adapter.set(
                    `tenants/${tenantId}/${op.collection}/${op.targetId}`,
                    op.payload
                );

                await db.syncQueue.delete(op.id!);
                synced++;
            } catch (err) {
                const attempts = (op.attempts || 0) + 1;
                const status = attempts >= 3 ? 'failed' : 'pending';
                await db.syncQueue.update(op.id!, {
                    status,
                    attempts,
                    lastError: toError(err).message,
                });
                failed++;
                logger.error(`[Offline-Mastery] Sync failed for ${op.targetId}: ${err}`);
            }
        }

        lazyAudit().then(a => a.logTechnicalEvent({
            eventType: 'power_restore',
            description: `Réconciliation terminée: ${synced} sync, ${failed} échoués sur ${pending.length}`,
            deviceId: this.getInstanceId(),
            tenantId,
        })).catch(() => {});

        return { synced, failed, chainValid: chainCheck.valid };
    },
};
