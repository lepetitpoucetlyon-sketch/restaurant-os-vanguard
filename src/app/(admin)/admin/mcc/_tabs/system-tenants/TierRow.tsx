'use client';

import React, { useState, useCallback } from 'react';
import {
    Eye, RefreshCw, ArrowUpCircle, Archive, Loader2,
} from 'lucide-react';
import type { PlatformVariant } from '@/modules/system';
import { getSystemTenantId } from '@/lib/mcc/SystemTenantRegistry';
import { toast } from 'sonner';
import { authedFetch } from '@/lib/client/authedFetch';
import { toError } from "@/lib/toError";

export type TierInfo = {
    tier: 'DEMO' | 'TEST' | 'REFERENCE';
    label: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
    badge: string;
    actions: ('view' | 'reset' | 'promote' | 'snapshots')[];
};

export function TierRow({ variant, tierCfg, onPromote }: {
    variant: PlatformVariant;
    tierCfg: TierInfo;
    onPromote: () => void;
}) {
    const [loading, setLoading] = useState<string | null>(null);
    const tenantId = getSystemTenantId(variant, tierCfg.tier);

    const handleView = () => {
        window.open(`/?tenant=${tenantId}`, '_blank');
    };

    const handleReset = useCallback(async () => {
        if (!confirm(`Réinitialiser ${tenantId} ? Toutes les données fictives seront effacées et re-générées.`)) return;
        setLoading('reset');
        try {
            const endpoint = tierCfg.tier === 'DEMO'
                ? '/api/admin/mcc/system-tenants/reset-demo'
                : '/api/admin/mcc/system-tenants/reset-test';
            const res = await authedFetch(endpoint, {
                method: 'POST',
                body: JSON.stringify({ variant }),
            });
            if (!res.ok) throw new Error(await res.text());
            toast.success(`${tenantId} réinitialisé ✓`);
        } catch (err) {
            toast.error(`Erreur reset : ${toError(err).message}`);
        } finally {
            setLoading(null);
        }
    }, [tenantId, tierCfg.tier, variant]);

    return (
        <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${tierCfg.bg} gap-4`}>
            <div className="flex items-center gap-3 min-w-0">
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-nano font-bold uppercase tracking-widest ${tierCfg.badge}`}>
                    {tierCfg.icon}
                    {tierCfg.label}
                </span>
                <span className={`text-xs font-mono truncate ${tierCfg.color}`}>{tenantId}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <button onClick={handleView} title="Ouvrir dans un onglet" className="p-1.5 rounded-lg text-muted hover:text-text-primary hover:bg-surface-glass transition-all">
                    <Eye className="w-3.5 h-3.5" />
                </button>

                {tierCfg.actions.includes('reset') && (
                    <button
                        onClick={handleReset}
                        disabled={loading === 'reset'}
                        title={tierCfg.tier === 'DEMO' ? 'Reset snapshot DEMO' : 'Reset TEST → DNA REFERENCE'}
                        className="p-1.5 rounded-lg text-muted hover:text-blue-400 hover:bg-surface-glass transition-all disabled:opacity-50"
                    >
                        {loading === 'reset'
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <RefreshCw className="w-3.5 h-3.5" />
                        }
                    </button>
                )}

                {tierCfg.actions.includes('promote') && (
                    <button
                        onClick={onPromote}
                        title="Promouvoir vers REFERENCE"
                        className="p-1.5 rounded-lg text-muted hover:text-brand hover:bg-surface-glass transition-all flex items-center gap-1 text-nano font-bold"
                    >
                        <ArrowUpCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Promouvoir</span>
                    </button>
                )}

                {tierCfg.actions.includes('snapshots') && (
                    <button title="Voir les snapshots" className="p-1.5 rounded-lg text-muted hover:text-text-primary hover:bg-surface-glass transition-all">
                        <Archive className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}
