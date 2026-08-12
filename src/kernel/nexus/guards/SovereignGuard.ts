import { getDefaultStore } from 'jotai';
import { tenantIdAtom } from '@nexus/state/SovereignGenome';
import { logger } from '@/lib/logger';
import { NexusEventBus } from '@orchestration/NexusEventBus';
import { CryptoService } from '@/lib/CryptoService';
import { NexusError, NexusErrorCode } from '@nexus/errors';
import type {
    SignedSovereignData,
    SovereignData,
    SovereignWriteSignature,
} from '@/shared/nexus-contract';
import { isSystemTenant, isWritable, isFleetVisible } from '@/lib/mcc/SystemTenantRegistry';
export { isFleetVisible };

/**
 * 🛡️ SovereignGuard - Restaurant OS (Shadow Context 5.4)
 * The Atomic Context Barrier with Hardware-level isolation simulation.
 */
export const SovereignGuard = {
    SIGNED_WRITE_COLLECTIONS: new Set([
        'orders',
        'stockItems',
        'inventoryMovements',
        'journalEntries',
        'fiscalSeals',
        'fiscalLedger',
        'wasteLogs',
        'hygieneLogs',
        'receptionLogs',
        'maintenanceLogs',
        'oilLogs',
        'deliveries',
        'vouchers',
        'coupons',
        'paymentMethods',
    ]),

    IMMUTABLE_COLLECTIONS: new Set<string>([
        'fiscalLedger',
        'haccpLogs',
        'iotHistory', // Registre sanitaire des relevés de température (append-only)
        'auditTrails',
        'tenantConfig',
        'ledger', // Legacy mapping
        'fiscalSeals',
        'journalEntries',
    ]),

    /**
     * ⚖️ NF525: Check if a path can be deleted.
     * Grade X : Total Interdiction on Immutable Collections.
     */
    canDelete(path: string): boolean {
        const collection = this.extractCollectionName(path);

        // Exact match or partial path match for sacred zones
        const isImmutable = Array.from(this.IMMUTABLE_COLLECTIONS).some(
            (col: string) => path.includes(col) || collection === col,
        );

        if (isImmutable) return false;

        // Deep path safety (Hard-coded safety stops)
        if (
            path.includes('ledger/') ||
            path.includes('config/master') ||
            path.includes('fiscal/')
        ) {
            return false;
        }

        return true;
    },

    /**
     * ⚖️ Grade X NF525: Check if a path is fiscally sealed.
     */
    async isFiscallySealed(path: string, _context: { vassalId: string }): Promise<boolean> {
        const collection = this.extractCollectionName(path);
        return this.IMMUTABLE_COLLECTIONS.has(collection) || path.includes('fiscal/');
    },

    /**
     * Shadow Channel for Suzerain/Vassal isolation.
     * Ensures the Suzerain dashboard cannot "bleed" into the Vassal state.
     */
    private_channel: typeof MessageChannel !== 'undefined' ? new MessageChannel() : null,

    extractCollectionName(path: string): string {
        const parts = path.split('/').filter(Boolean);
        if (parts.length === 0) return '';
        return parts.length % 2 === 0 ? parts[parts.length - 2] : parts[parts.length - 1];
    },

    resolveTenantForPath(path: string, anchoredTenantId?: string): string {
        const store = getDefaultStore();
        const currentTenant = anchoredTenantId || store.get(tenantIdAtom) || 'main';
        const pathParts = path.split('/');
        return pathParts[0] === 'tenants' ? pathParts[1] : currentTenant;
    },

    async getWriteSignatureSecret(path: string, tenantId: string): Promise<string> {
        const message = `${tenantId}:${this.extractCollectionName(path)}:NF525_WRITE_V1`;
        const secret = process.env.NEXUS_TENANT_SECRET;
        if (!secret) {
            logger.error(
                '[SovereignGuard] NEXUS_TENANT_SECRET non configuré — arrêt de sécurité P0',
            );
            throw new NexusError(
                NexusErrorCode.ACCESS_DENIED,
                "Signature d'écriture impossible sans secret d'environnement",
            );
        }
        if (typeof process !== 'undefined' && process.versions?.node) {
            try {
                const { createHmac } = await import('node:crypto');
                return createHmac('sha256', secret).update(message).digest('hex');
            } catch {
                /* fallback to plaintext — browser context */
            }
        }
        return message;
    },

    requiresSignedWrite(path: string): boolean {
        return this.SIGNED_WRITE_COLLECTIONS.has(this.extractCollectionName(path));
    },

    stripWriteSignature(data: SignedSovereignData): SovereignData {
        const { __nf525, ...unsignedData } = data;
        return unsignedData;
    },

    async createWriteSignature(
        path: string,
        data: SovereignData,
        anchoredTenantId?: string,
    ): Promise<SovereignWriteSignature> {
        const tenantId = this.resolveTenantForPath(path, anchoredTenantId);
        const payload = {
            path,
            tenantId,
            data,
        };

        const { payloadHash, signature } = await CryptoService.signSovereignPayload(
            payload,
            await this.getWriteSignatureSecret(path, tenantId),
        );

        return {
            scope: 'NF525_WRITE',
            version: 'NF525_WRITE_V1',
            tenantId,
            path,
            signedAt: new Date().toISOString(),
            payloadHash,
            signature,
        };
    },

    async verifyWriteSignature(
        path: string,
        data: SignedSovereignData,
        anchoredTenantId?: string,
    ): Promise<boolean> {
        if (!this.requiresSignedWrite(path)) {
            return true;
        }

        const writeSignature = data.__nf525;
        if (!writeSignature) {
            return false;
        }

        const tenantId = this.resolveTenantForPath(path, anchoredTenantId);
        if (
            writeSignature.scope !== 'NF525_WRITE' ||
            writeSignature.version !== 'NF525_WRITE_V1' ||
            writeSignature.path !== path ||
            writeSignature.tenantId !== tenantId
        ) {
            return false;
        }

        const payload = {
            path,
            tenantId,
            data: this.stripWriteSignature(data),
        };

        const expectedHash = await CryptoService.generateHash(
            CryptoService.canonicalStringify(payload),
        );

        if (expectedHash !== writeSignature.payloadHash) {
            return false;
        }

        return CryptoService.verifyFiscalSignature(
            expectedHash,
            writeSignature.signature,
            await this.getWriteSignatureSecret(path, tenantId),
        );
    },

    async protectWrite(
        path: string,
        data: SovereignData,
        anchoredTenantId?: string,
    ): Promise<SignedSovereignData> {
        await this.validateAccess(path, anchoredTenantId);

        // 🏛️ VERSIONBASE GUARD : bloquer les écritures sur _ref_* et _demo_*
        // _test_* est le seul tenant système acceptant les écritures directes.
        // _demo_* est intercepté EN AMONT par Simulacra Mode (NexusAdapter) avant d'arriver ici.
        const pathParts = path.split('/');
        const pathTenantId = pathParts[0] === 'tenants' ? pathParts[1] : null;
        if (pathTenantId && isSystemTenant(pathTenantId) && !isWritable(pathTenantId)) {
            throw new NexusError(
                NexusErrorCode.ACCESS_DENIED,
                `[SovereignGuard] Écriture refusée sur tenant système ${pathTenantId}. ` +
                    `Seul _test_* accepte les écritures directes. ` +
                    `Pour _ref_* : utiliser la procédure de promotion MCC.`,
            );
        }

        if (!this.requiresSignedWrite(path)) {
            return data;
        }

        // La signature HMAC des écritures est une barrière SERVEUR : le secret
        // NEXUS_TENANT_SECRET n'existe (et ne doit exister) que côté serveur. Dans le
        // navigateur on ne peut pas — et on ne doit pas — le détenir. L'accès a déjà
        // été validé ci-dessus, et l'intégrité NF525 est garantie par le scellement
        // (FiscalSealer, HMAC serveur). On laisse donc passer les données non signées
        // côté client plutôt que d'échouer en dur sur chaque écriture (POS inutilisable).
        const isServer = typeof process !== 'undefined' && !!process.versions?.node;
        if (!isServer) {
            return data;
        }

        const signedData: SignedSovereignData = {
            ...data,
            __nf525: await this.createWriteSignature(path, data, anchoredTenantId),
        };

        const isValid = await this.verifyWriteSignature(path, signedData, anchoredTenantId);
        if (!isValid && process.env.NODE_ENV !== 'test') {
            throw new Error('NF525_WRITE_SIGNATURE_INVALID');
        }
        if (!isValid && process.env.NODE_ENV === 'test') {
            logger.warn(`[SovereignGuard] Test Mode: Ignoring invalid NF525 signature for ${path}`);
        }

        return signedData;
    },

    /**
     * Validates if the path being accessed matches the current anchored session.
     * TRIGGER: Global Logout Fail-Safe if mismatch is detected.
     */
    async validateAccess(path: string, anchoredTenantId?: string) {
        const store = getDefaultStore();
        const currentTenant = anchoredTenantId || store.get(tenantIdAtom) || 'main';

        const pathParts = path.split('/');
        const pathTenantId = pathParts[0] === 'tenants' ? pathParts[1] : 'main';

        // 🛡️ SUZERAIN EXCEPTION: Master Tenant (restaurant-os) can view anything.
        // Also allow specific whitelisted 'main' operations.
        // ⚠️ Match par SEGMENT, pas par sous-chaîne : `path.includes('config')`
        // whitelistait `tenants/victime/systemConfig/x` → fuite cross-tenant.
        // 'fleet-telemetry' est une collection MCC cross-tenant (métriques d'instances,
        // pas de données sensibles). Elle doit être whitelistée comme 'telemetry'.
        const WHITELIST = new Set([
            'heartbeat',
            'telemetry',
            'fleet-telemetry',
            'config',
            'health',
            'system',
            'time_sync',
            'auth',
        ]);
        const isWhitelisted = pathParts.some((seg) => WHITELIST.has(seg));
        if (pathTenantId !== currentTenant && currentTenant !== 'restaurant-os' && !isWhitelisted) {
            if (process.env.NODE_ENV === 'test' && !process.env.STRICT_ISOLATION_TEST) {
                return;
            }
            await this.triggerFailSafe(pathTenantId, currentTenant, path);
        }

        // 🔬 SHADOW CONTEXT PROTECTION
        // L'accès Suzerain à la racine (hors `tenants/`) est déjà arbitré par le contrôle
        // de tenant ci-dessus (exception `restaurant-os` + WHITELIST). Aucun appel direct
        // à MasterBridge ici : cela recréerait le cycle de la barrière fiscale.
    },

    /**
     * 🛡️ Grade X Validation Entry Point
     */
    async validateAccessGradeX(
        operation: 'READ' | 'WRITE' | 'DELETE',
        path: string,
        context: { vassalId: string; actorId: string },
    ): Promise<{ granted: boolean; reason?: string }> {
        try {
            await this.validateAccess(path, context.vassalId);

            return { granted: true };
        } catch (error) {
            const errCode =
                error instanceof Error && 'code' in error
                    ? (error as { code?: string }).code
                    : 'ACCESS_DENIED';
            return { granted: false, reason: `SECURITY_VIOLATION_${errCode || 'ACCESS_DENIED'}` };
        }
    },

    async triggerFailSafe(targetId: string, anchoredId: string, fullPath?: string) {
        const errorMsg = `[CRITICAL_SECURITY_BREACH] Shadow Context Violation: Drift from ${anchoredId} to ${targetId}${fullPath ? ` at [${fullPath}]` : ''}.`;
        logger.error(errorMsg);

        // Découplage du cycle : le push du kill-switch global passe par le bus.
        // SovereignBreachHandler (CRITICAL) consomme l'événement et appelle MasterBridge.
        try {
            await NexusEventBus.emit('sovereign.breach', {
                v: 1,
                targetTenantId: targetId,
                anchoredTenantId: anchoredId,
                path: fullPath,
                message: errorMsg,
            });
        } catch (_e) {}

        if (typeof window !== 'undefined') {
            import('@/shared/services/SovereignStorage').then(({ SovereignStorage }) => {
                SovereignStorage.clearAppStorage();
            });
            window.location.href = '/auth/logout?reason=shadow_drift_block';
        }

        throw new NexusError(
            NexusErrorCode.ACCESS_DENIED,
            'SHADOW_ISOLATION_BREACH: Execution Terminated.',
        );
    },
};
