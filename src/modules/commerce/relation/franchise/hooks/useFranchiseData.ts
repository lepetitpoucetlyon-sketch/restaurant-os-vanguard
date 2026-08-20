"use client";

import { useState, useEffect, useCallback } from 'react';
import { authedFetch } from '@/lib/client/authedFetch';
import { useTenant } from '@/shared/hooks';
import type {
    FranchiseSiteOverview,
    FranchiseConsolidatedMetrics,
    InterSiteTransfer,
} from '@/shared/nexus/contracts/franchise.types';

export interface UseFranchiseDataResult {
    sites: FranchiseSiteOverview[];
    consolidated: FranchiseConsolidatedMetrics | null;
    transfers: InterSiteTransfer[];
    isLoading: boolean;
    tenantId: string | undefined;
    switchTenant: (id: string) => void;
    refresh: () => Promise<void>;
    createTransfer: (params: {
        targetTenantId: string;
        itemName: string;
        quantity: number;
    }) => Promise<void>;
    executeTransfer: (transfer: InterSiteTransfer) => Promise<void>;
}

export function useFranchiseData(): UseFranchiseDataResult {
    const { tenantId, switchTenant } = useTenant();
    const [sites, setSites] = useState<FranchiseSiteOverview[]>([]);
    const [consolidated, setConsolidated] = useState<FranchiseConsolidatedMetrics | null>(null);
    const [transfers, setTransfers] = useState<InterSiteTransfer[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await authedFetch('/api/tenant/franchise/overview');
            if (res.ok) {
                const data = (await res.json()) as {
                    sites: FranchiseSiteOverview[];
                    consolidated: FranchiseConsolidatedMetrics;
                };
                setSites(data.sites || []);
                setConsolidated(data.consolidated || null);
            }
        } catch {
            /* silently handled */
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const createTransfer = useCallback<UseFranchiseDataResult['createTransfer']>(
        async ({ targetTenantId, itemName, quantity }) => {
            if (!targetTenantId) return;
            const targetSite = sites.find((s) => s.tenantId === targetTenantId);
            const sourceSite = sites.find((s) => s.tenantId === tenantId) || sites[0];

            const res = await authedFetch('/api/tenant/franchise/transfers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetTenantId,
                    targetTenantName: targetSite?.name || targetTenantId,
                    sourceTenantName: sourceSite?.name || tenantId,
                    items: [
                        {
                            itemId: `item_${itemName.toLowerCase().replace(/\s+/g, '_')}`,
                            itemName,
                            quantity,
                            unit: 'kg',
                        },
                    ],
                    notes: 'Transfert d’urgence pour rééquilibrage de service',
                }),
            });

            if (res.ok) {
                const data = (await res.json()) as { transfer: InterSiteTransfer };
                setTransfers((prev) => [data.transfer, ...prev]);
            }
        },
        [sites, tenantId],
    );

    const executeTransfer = useCallback(async (transfer: InterSiteTransfer) => {
        const res = await authedFetch('/api/tenant/franchise/transfers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'execute', transfer }),
        });
        if (res.ok) {
            const data = (await res.json()) as { transfer: InterSiteTransfer };
            setTransfers((prev) => prev.map((t) => (t.id === data.transfer.id ? data.transfer : t)));
        }
    }, []);

    return {
        sites,
        consolidated,
        transfers,
        isLoading,
        tenantId,
        switchTenant,
        refresh,
        createTransfer,
        executeTransfer,
    };
}
