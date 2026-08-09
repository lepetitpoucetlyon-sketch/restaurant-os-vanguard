import { logger } from '@/lib/logger';
import { NexusInterceptor } from './NexusInterceptor';
import { SovereignGuard } from '@nexus/guards/SovereignGuard';
import { SovereignStorage } from '@/shared/services/SovereignStorage';
import { TenantIdSchema } from '@/shared/schemas/ui';

import { buildTenantPath } from './utils/tenantPath';

/**
 * 🛰️ INexusAdapter - Restaurant OS (Grade VI)
 * Data Abstraction Layer for total portability and high-speed testing.
 */

import { INexusAdapter, INexusQueryOptions, INexusBatch, NexusContext } from './types';
export type { INexusAdapter, INexusQueryOptions, INexusBatch, NexusContext };


/**
 * 🏛️ Nexus Singleton Manager
 */
class NexusManager {
    private _adapter: INexusAdapter | null = null;
    private _realAdapter: INexusAdapter | null = null;
    private _isSimulacraActive: boolean = false;
    private _tenantOverride: string | null = null;

    set adapter(adapter: INexusAdapter) {
        // 🛡️ SHIELD: Automatically wrap any adapter with the Sovereign Interceptor
        this._adapter = new NexusInterceptor(adapter, SovereignGuard, () => this.activeTenant);
        
        if (!this._isSimulacraActive) {
            this._realAdapter = adapter;
        }
        logger.info(`[Nexus] Adapter registered and shielded: ${adapter.constructor.name}`);
    }

    get adapter(): INexusAdapter {
        if (!this._adapter) {
            throw new Error('[Nexus] CRITICAL: No adapter registered.');
        }
        return this._adapter;
    }

    /**
     * 🛰️ Enregistre un adapter SERVEUR brut (sans NexusInterceptor / SovereignGuard).
     * Côté serveur, l'isolation multi-tenant est assurée par `adminAuthGuard`
     * (tenantId du JWT) + les chemins `tenants/{tenantId}/…` explicites, et l'Admin
     * SDK outrepasse les règles Firestore. Le garde client (store Jotai, fail-safe
     * logout, MessageChannel) n'a aucun sens hors navigateur — on ne l'applique donc pas.
     */
    registerServerAdapter(adapter: INexusAdapter) {
        this._adapter = adapter;
        this._realAdapter = adapter;
        logger.info(`[Nexus] Server adapter registered (raw, no interceptor): ${adapter.constructor.name}`);
    }

    /**
     * 🌀 SIMULACRA MODE (Grade X)
     * Enters a parallel reality where all writes are redirected to IndexedDB.
     */
    async activateSimulacraMode(forkId: string = 'default') {
        if (this._isSimulacraActive) return;
        
        if (!this._realAdapter && this._adapter) {
            this._realAdapter = this._adapter;
        }

        if (!this._realAdapter) {
            throw new Error('[Nexus] Cannot enter Simulacra mode without a real adapter.');
        }

        const { SimulacraAdapter } = await import('@/lib/nexus/adapters/SimulacraAdapter');
        
        const simulacra = new SimulacraAdapter(this._realAdapter, forkId);
        this._adapter = new NexusInterceptor(simulacra, SovereignGuard, () => this.activeTenant);
        this._isSimulacraActive = true;
        
        logger.warn(`[Nexus] ⚠️ FORK ACTIVE: System entered Parallel Reality [${forkId}]. Firestore is now Read-Only.`);
    }

    deactivateSimulacraMode() {
        if (!this._isSimulacraActive || !this._realAdapter) return;
        
        // Restore the shielded version
        this._adapter = new NexusInterceptor(this._realAdapter, SovereignGuard, () => this.activeTenant);
        this._isSimulacraActive = false;
        
        logger.info("[Nexus] Reality Restored: System returned to Firestore production stream.");
    }

    isSimulacraActive(): boolean {
        return this._isSimulacraActive;
    }

    /**
     * Ancrage tenant du singleton — **client uniquement**.
     *
     * Côté serveur, `Nexus` est partagé par toutes les requêtes concurrentes du
     * même process Node : entre l'affectation et le premier `await`, une requête
     * d'un autre tenant peut écraser l'ancrage et provoquer une écriture
     * cross-tenant. Passer le tenant par appel — `NexusContext.vassalId` — qui
     * scope le chemin et alimente SovereignGuard :
     *
     *     Nexus.adapter.query(col, options, { vassalId: tenantId, actorId });
     */
    set tenantOverride(tenantId: string | null) {
        if (typeof window === 'undefined') {
            throw new Error(
                '[Nexus] tenantOverride est interdit côté serveur : le singleton est partagé ' +
                'entre requêtes concurrentes (fuite cross-tenant). Passer le tenant par appel ' +
                'via NexusContext.vassalId.'
            );
        }
        this._tenantOverride = tenantId;
    }

    get activeTenant(): string | null {
        return this._tenantOverride;
    }

    /**
     * 🛰️ DIGITAL TWIN ROUTING
     * Resolves the full persistence path based on tenant isolation rules.
     * Includes SovereignGuard validation to prevent cross-tenant bleeding.
     */
    getTenantPath(relativePath: string, tenantIdOverride?: string): string {
        // Priority: Explicit Override > Server Override > URL Search > LocalStorage > Default
        const tenantId = tenantIdOverride || 
                         this._tenantOverride || 
                         (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tenant') : null) ||
                         SovereignStorage.get('nexus_tenant_id', TenantIdSchema, 'restaurant-os').data;

        const resolvedPath = buildTenantPath(tenantId, relativePath);

        // 🛡️ NOTE: Access validation is handled by NexusInterceptor.intercept()
        // which properly awaits the async SovereignGuard. Calling it here (sync context)
        // would cause unhandled promise rejections on tenant mismatches.

        return resolvedPath;
    }
}

export const Nexus = new NexusManager();
