import { SovereignValue, SovereignData } from '@/shared/nexus-contract';

export type NexusQueryOperator = 
    | '==' | '!=' | '<' | '<=' | '>' | '>=' 
    | 'array-contains' | 'array-contains-unknown' 
    | 'in' | 'not-in';

export interface INexusQueryOptions {
    orderBy?: { field: string; direction: 'asc' | 'desc' };
    limit?: number;
    where?: { field: string; operator: NexusQueryOperator; value: SovereignValue }[];
}

export interface INexusBatch {
    set<T = SovereignData>(path: string, data: T): void;
    update<T = SovereignData>(path: string, data: Partial<T>): void;
    delete(path: string): void;
    commit(): Promise<void>;
}

export interface INexusAdapter {
    get<T = SovereignData>(path: string): Promise<T | null>;
    query<T = SovereignData>(collectionPath: string, options?: INexusQueryOptions): Promise<T[]>;
    onSnapshot<T = SovereignData>(
        path: string, 
        callback: (data: T | null) => void, 
        options?: INexusQueryOptions & { onError?: (error: Error) => void }
    ): () => void;
    batch(): INexusBatch;
    set<T = SovereignData>(path: string, data: T, options?: { merge?: boolean }): Promise<void>;
    update<T = SovereignData>(path: string, data: Partial<T>): Promise<void>;
    delete(path: string): Promise<void>;
    generateId(collectionPath: string): string;
    serverTimestamp(): unknown;
}

import { logger } from '@/lib/logger';

/**
 * 🏛️ Nexus Singleton Manager
 * LEAF MODULE: Must not import anything that could loop back to firebase.
 */
class NexusManager {
    private _adapter: INexusAdapter | null = null;
    private _tenantOverride: string | null = null;
    private _validator: ((path: string, tenantId?: string) => void) | null = null;

    set adapter(adapter: INexusAdapter) {
        this._adapter = adapter;
        logger.info(`[Nexus] Adapter registered: ${adapter.constructor.name}`);
    }

    get adapter(): INexusAdapter {
        if (!this._adapter) {
            throw new Error('[Nexus] CRITICAL: No adapter registered.');
        }
        return this._adapter;
    }

    set validator(v: (path: string, tenantId?: string) => void) {
        this._validator = v;
    }

    set tenantOverride(tenantId: string | null) {
        this._tenantOverride = tenantId;
    }

    get activeTenant(): string | null {
        return this._tenantOverride;
    }

    get tenantOverride(): string | null {
        return this._tenantOverride;
    }

    /**
     * 🛰️ DIGITAL TWIN ROUTING
     * Resolves the full persistence path based on tenant isolation rules.
     */
    getTenantPath(relativePath: string, tenantIdOverride?: string): string {
        const tenantId = tenantIdOverride || 
                         this._tenantOverride || 
                         (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tenant') : null) ||
                         (typeof window !== 'undefined' ? localStorage.getItem('nexus_tenant_id') : null);

        let resolvedPath = relativePath;
        if (tenantId && tenantId !== 'restaurant-os' && tenantId !== 'main') {
            resolvedPath = `tenants/${tenantId}/${relativePath}`;
        }

        // 🛡️ SOVEREIGN GUARD - Injection Pattern to break circularity
        if (this._validator) {
            this._validator(resolvedPath, this._tenantOverride || undefined);
        }

        return resolvedPath;
    }
}

export const Nexus = new NexusManager();
