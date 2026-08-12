/* eslint-disable no-restricted-imports -- tolerated structural inversion */
"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSetAtom } from 'jotai';
import { NexusSutures } from '@/store/nexusSutures';
import { getTenantConfig } from '@/instances';
import { DEFAULT_TENANT_ID } from '@/config/instance';
import { logger } from '@/lib/axiom';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { FirestoreAdapter } from '@/lib/adapters/FirestoreAdapter';
// LLMManager + GeminiProvider chargés par dynamic import (évite shared→modules)

import { StorageManager } from '@/infrastructure/services/storage';
import { FirebaseStorageProvider } from '@/lib/storage/FirebaseStorageProvider';
import { NexusTelemetryEngine } from '@nexus/engines/NexusTelemetryEngine';
import { tenantConfigAtom } from '@/store/pillars/sovereign';
import { fetchRbacConfigAtom } from '@/store/pillars/rbac';
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
    const fetchRbac = useSetAtom(fetchRbacConfigAtom);

    const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
    const [activeTenantConfig, setActiveTenantConfig] = useState<TenantConfig | null>(null);

    useEffect(() => {
        try {
            Nexus.adapter = new FirestoreAdapter();
            // Dynamic import pour éviter l'inversion shared→modules
            import('@/modules/intelligence').then(({ LLMManager, GeminiProvider }) => {
                LLMManager.provider = new GeminiProvider();
            }).catch(() => { /* LLM non disponible — dégradation gracieuse */ });
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
        NexusTelemetryEngine.initSession(tenantId, config.variant ?? 'restaurant');
        fetchRbac(tenantId);
        
        // Auto-provision Demo Mode — URL param OU dev local sans Firebase réel
        if (typeof window !== 'undefined') {
            const isSimulacra =
                new URLSearchParams(window.location.search).get('simulacra') === 'true' ||
                (process.env.NODE_ENV !== 'production' && !process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
            if (isSimulacra) {
                Nexus.activateSimulacraMode(tenantId).then(() => {
                    DemoSeeder.provision(tenantId).catch(err => {
                        logger.error('Failed to provision demo data', { error: err.message });
                    });
                }).catch(err => {
                    // Simulacra peut échouer si l'adapter Firestore n'est pas encore initialisé
                    logger.warn('[SimulacraMode] Activation différée :', err.message);
                });
            }
        }
    }, [setGlobalTenantConfig, fetchRbac]);

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
