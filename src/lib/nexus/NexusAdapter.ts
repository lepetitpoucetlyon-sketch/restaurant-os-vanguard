import { logger } from '@/lib/logger';
import { SovereignGuard } from '@nexus/guards/SovereignGuard';

/**
 * 🛰️ INexusAdapter - Restaurant OS (Grade VI)
 * Data Abstraction Layer for total portability and high-speed testing.
 */

export type NexusQueryOperator = 
    | '==' | '!=' | '<' | '<=' | '>' | '>=' 
    | 'array-contains' | 'array-contains-any' 
    | 'in' | 'not-in';

export interface INexusQueryOptions {
    orderBy?: { field: string; direction: 'asc' | 'desc' };
    limit?: number;
    where?: { field: string; operator: NexusQueryOperator; value: string | number | boolean | string[] | number[] }[];
}

export interface INexusBatch {
    set<T = import('@shared/nexus-contract').SovereignData>(path: string, data: T): void;
    update<T = import('@shared/nexus-contract').SovereignData>(path: string, data: Partial<T>): void;
    increment(path: string, field: string, amount: number): void;
    delete(path: string): void;
    commit(): Promise<void>;
}

export interface INexusAdapter {
    get<T = import('@shared/nexus-contract').SovereignData>(path: string): Promise<T | null>;
    query<T = import('@shared/nexus-contract').SovereignData>(collectionPath: string, options?: INexusQueryOptions): Promise<T[]>;
    onSnapshot<T = import('@shared/nexus-contract').SovereignData>(
        path: string, 
        callback: (data: T) => void, 
        options?: INexusQueryOptions & { onError?: (error: Error) => void }
    ): () => void;
    batch(): INexusBatch;
    set<T = import('@shared/nexus-contract').SovereignData>(path: string, data: T, options?: { merge?: boolean }): Promise<void>;
    update<T = import('@shared/nexus-contract').SovereignData>(path: string, data: Partial<T>): Promise<void>;
    increment(path: string, field: string, amount: number): Promise<void>;
    create<T = import('@shared/nexus-contract').SovereignData>(path: string, data: T): Promise<void>;
    delete(path: string): Promise<void>;
    generateId(collectionPath: string): string;
}

/**
 * 🏛️ Nexus Singleton Manager
 */
class NexusManager {
    private _adapter: INexusAdapter | null = null;
    private _realAdapter: INexusAdapter | null = null;
    private _isSimulacraActive: boolean = false;
    private _tenantOverride: string | null = null;

    set adapter(adapter: INexusAdapter) {
        this._adapter = adapter;
        if (!this._isSimulacraActive) {
            this._realAdapter = adapter;
        }
        logger.info(`[Nexus] Adapter registered: ${adapter.constructor.name}`);
    }

    get adapter(): INexusAdapter {
        if (!this._adapter) {
            throw new Error('[Nexus] CRITICAL: No adapter registered.');
        }
        return this._adapter;
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
        this._adapter = new SimulacraAdapter(this._realAdapter, forkId);
        this._isSimulacraActive = true;
        
        logger.warn(`[Nexus] ⚠️ FORK ACTIVE: System entered Parallel Reality [${forkId}]. Firestore is now Read-Only.`);
    }

    deactivateSimulacraMode() {
        if (!this._isSimulacraActive || !this._realAdapter) return;
        
        this._adapter = this._realAdapter;
        this._isSimulacraActive = false;
        
        logger.info("[Nexus] Reality Restored: System returned to Firestore production stream.");
    }

    isSimulacraActive(): boolean {
        return this._isSimulacraActive;
    }

    set tenantOverride(tenantId: string | null) {
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
                         (typeof window !== 'undefined' ? localStorage.getItem('nexus_tenant_id') : null);

        let resolvedPath = relativePath;
        if (tenantId && tenantId !== 'restaurant-os' && tenantId !== 'main') {
            resolvedPath = `tenants/${tenantId}/${relativePath}`;
        }

        // 🛡️ SOVEREIGN GUARD - Final Barrier
        // Ensures that the resulting path is compatible with the current anchored session.
        SovereignGuard.validateAccess(resolvedPath, this._tenantOverride || undefined);

        return resolvedPath;
    }
}

export const Nexus = new NexusManager();
