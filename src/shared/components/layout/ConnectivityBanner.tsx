'use client';

import { useState, useEffect, useCallback } from 'react';
import { WifiOff, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { useConnectivity } from '@/lib/offline/connectivity-hooks';
import { useTenant } from '@/shared/hooks';
import { OfflineMasteryEngine } from '@/lib/OfflineMasteryEngine';

type SyncState = 'online' | 'offline' | 'syncing' | 'synced' | 'error';

export function ConnectivityBanner() {
    const isOnline = useConnectivity();
    const { tenantId } = useTenant();
    const [syncState, setSyncState] = useState<SyncState>(isOnline ? 'online' : 'offline');
    const [wasOffline, setWasOffline] = useState(false);
    const [syncResult, setSyncResult] = useState<{ synced: number; failed: number } | null>(null);

    const runReconciliation = useCallback(async () => {
        if (!tenantId) return;
        setSyncState('syncing');
        try {
            const result = await OfflineMasteryEngine.reconcileFleet(tenantId);
            setSyncResult({ synced: result.synced, failed: result.failed });
            setSyncState(result.failed > 0 ? 'error' : 'synced');
            if (result.failed === 0) {
                setTimeout(() => setSyncState('online'), 3000);
            }
        } catch {
            setSyncState('error');
        }
    }, [tenantId]);

    useEffect(() => {
        if (!isOnline) {
            setWasOffline(true);
            setSyncState('offline');
            return;
        }

        if (wasOffline) {
            runReconciliation();
            setWasOffline(false);
        } else {
            setSyncState('online');
        }
    }, [isOnline, wasOffline, runReconciliation]);

    if (syncState === 'online') return null;

    return (
        <div className={cn(
            'flex items-center justify-center gap-3 px-4 py-2 text-micro font-bold tracking-wider transition-all',
            syncState === 'offline' && 'bg-status-error/10 text-status-error border-b border-status-error/20',
            syncState === 'syncing' && 'bg-action-primary/10 text-amber-600 dark:text-action-primary border-b border-action-primary/20',
            syncState === 'synced' && 'bg-status-success/10 text-status-success border-b border-status-success/20',
            syncState === 'error' && 'bg-status-error/10 text-status-error border-b border-status-error/20',
        )}>
            {syncState === 'offline' && (
                <>
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>Mode hors-ligne — les ventes sont scellées localement</span>
                </>
            )}
            {syncState === 'syncing' && (
                <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Reconnexion — synchronisation en cours...</span>
                </>
            )}
            {syncState === 'synced' && (
                <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Synchronisation terminée — {syncResult?.synced ?? 0} opération{(syncResult?.synced ?? 0) > 1 ? 's' : ''} réconciliée{(syncResult?.synced ?? 0) > 1 ? 's' : ''}</span>
                </>
            )}
            {syncState === 'error' && (
                <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{syncResult?.failed ?? 0} opération{(syncResult?.failed ?? 0) > 1 ? 's' : ''} en échec</span>
                    <button
                        onClick={runReconciliation}
                        className="ml-2 px-3 py-1 rounded-full bg-status-error/20 hover:bg-status-error/30 transition-colors text-nano font-black uppercase"
                    >
                        Réessayer
                    </button>
                </>
            )}
        </div>
    );
}
