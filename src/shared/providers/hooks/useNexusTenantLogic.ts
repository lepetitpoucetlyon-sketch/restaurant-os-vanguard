"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSetAtom } from 'jotai';
import { NexusSutures } from '@/store/nexusSutures';
import { getTenantConfig } from '@/instances';
import { DEFAULT_TENANT_ID } from '@/config/instance';
import { logger } from '@/lib/axiom';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { FirestoreAdapter } from '@/infrastructure/adapters/FirestoreAdapter';
import { LLMManager } from '@/modules/intelligence/ia/ai';
import { GeminiProvider } from '@/infrastructure/adapters/GeminiProvider';
import { StorageManager } from '@/infrastructure/services/storage';
import { FirebaseStorageProvider } from '@/infrastructure/services/storage/FirebaseStorageProvider';
import { NexusTelemetryEngine } from '@shared/nexus/engines/NexusTelemetryEngine';
import { tenantConfigAtom } from '@/store/pillars/sovereign';
import { DemoSeeder } from '@/infrastructure/services/demo/DemoSeeder';
import type { TenantConfig } from '@/shared/nexus-contract';
import type { NexusTenantState } from '@nexus/contracts/nexus.types';

/**
 * Tenant module (Digital Twin context) extracted from NexusCoreProvider.
 * Owns: tenant state, Firestore adapter bootstrap, telemetry + sutures lifecycle,
 * and the switchTenant flow. Runtime behaviour is identical to the inlined version.
 */
export function useNexusTenantLogic(): NexusTenantState {
    const searchParams = useSearchParams();
    const hasInitialized = useRef(false);
    const setGlobalTenantConfig = useSetAtom(tenantConfigAtom);

    const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
    const [activeTenantConfig, setActiveTenantConfig] = useState<TenantConfig | null>(null);

    useEffect(() => {
        try {
            Nexus.adapter = new FirestoreAdapter();
            LLMManager.provider = new GeminiProvider();
            StorageManager.provider = new FirebaseStorageProvider();
        } catch { }
    }, []);

    useEffect(() => {
        NexusTelemetryEngine.mountChaosMonkeys();
        NexusSutures.init();
        return () => {
            NexusTelemetryEngine.unmountChaosMonkeys();
            NexusSutures.stop();
        };
    }, []);

    const switchTenant = useCallback((tenantIdRaw: string) => {
        const tenantId = tenantIdRaw.replace(/['"]+/g, '');
        logger.info('NexusCore: Switching Digital Twin context', { tenantId });
        const config = getTenantConfig(tenantId);
        if (!config) return;

        setActiveTenantId(tenantId);
        setActiveTenantConfig(config);
        setGlobalTenantConfig(config);
        Nexus.tenantOverride = tenantId;
        NexusTelemetryEngine.initSession(tenantId);
        
        // Auto-provision Demo Mode if requested via URL
        if (typeof window !== 'undefined') {
            const isSimulacra = new URLSearchParams(window.location.search).get('simulacra') === 'true';
            if (isSimulacra) {
                Nexus.activateSimulacraMode(tenantId).then(() => {
                    DemoSeeder.provision(tenantId).catch(err => {
                        logger.error('Failed to provision demo data', { error: err.message });
                    });
                });
            }
        }
    }, [setGlobalTenantConfig]);

    useEffect(() => {
        if (!activeTenantId && !hasInitialized.current) {
            const targetTenant = searchParams.get('tenant') || DEFAULT_TENANT_ID;
            hasInitialized.current = true;
            switchTenant(targetTenant);
        }
    }, [activeTenantId, searchParams, switchTenant]);

    return useMemo(() => ({
        activeTenantId, activeTenantConfig, switchTenant,
        isTenantLoading: !activeTenantId, tenantId: activeTenantId || undefined
    }), [activeTenantId, activeTenantConfig, switchTenant]);
}
