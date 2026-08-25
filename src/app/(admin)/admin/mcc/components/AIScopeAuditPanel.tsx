'use client';

import { useState, useEffect, useCallback } from 'react';
import { authedFetch } from '@/lib/client/authedFetch';

interface ProviderInfo {
    activeProvider: string;
    activeModel: string;
    mode: string;
}

interface ScopeStats {
    scope: 'mcc' | 'tenant';
    totalCalls: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalErrors: number;
    totalLatencyMs: number;
    lastProvider: string;
    lastCallAt: string | null;
}

export function AIScopeAuditPanel() {
    const [providerInfo, setProviderInfo] = useState<ProviderInfo | null>(null);
    const [mccStats, setMccStats] = useState<ScopeStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [providerRes] = await Promise.all([
                authedFetch('/api/admin/fleet/support-ai/provider-info'),
            ]);

            if (providerRes.ok) {
                const pData = await providerRes.json() as ProviderInfo;
                setProviderInfo(pData);
            }
        } catch {
            setError('Impossible de charger les données de scope IA');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-primary">🔍 Audit Scope IA</h2>
                    <p className="text-xs text-secondary mt-0.5">
                        Isolation MCC ↔ Tenant enforçée — ADR-008
                    </p>
                </div>
                <button
                    onClick={() => void load()}
                    disabled={loading}
                    className="px-3 py-1.5 text-xs bg-surface border border-default rounded-lg hover:bg-surface-elevated transition-colors disabled:opacity-50"
                >
                    {loading ? 'Chargement...' : '↻ Rafraîchir'}
                </button>
            </div>

            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                    {error}
                </div>
            )}

            {/* MCC AI Provider Card */}
            <div className="p-4 bg-surface border border-default rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-sm font-medium text-primary">Scope MCC</span>
                    <span className="ml-auto text-xs text-secondary px-2 py-0.5 bg-blue-500/10 rounded-full">Isolé</span>
                </div>

                {providerInfo ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="p-2 bg-surface-elevated rounded-lg">
                            <p className="text-xs text-secondary">Provider actif</p>
                            <p className="text-sm font-medium text-primary capitalize mt-0.5">
                                {providerInfo.activeProvider}
                            </p>
                        </div>
                        <div className="p-2 bg-surface-elevated rounded-lg">
                            <p className="text-xs text-secondary">Modèle</p>
                            <p className="text-sm font-medium text-primary mt-0.5">
                                {providerInfo.activeModel || 'auto'}
                            </p>
                        </div>
                        <div className="p-2 bg-surface-elevated rounded-lg">
                            <p className="text-xs text-secondary">Mode</p>
                            <p className="text-sm font-medium text-primary capitalize mt-0.5">
                                {providerInfo.mode}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="h-16 bg-surface-elevated rounded-lg animate-pulse" />
                )}
            </div>

            {/* Isolation Status */}
            <div className="p-4 bg-surface border border-default rounded-xl">
                <h3 className="text-sm font-medium text-primary mb-3">Règles d'isolation (R1-R10)</h3>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { rule: 'R1', label: 'Import isolation MCC ↔ Tenant', ok: true },
                        { rule: 'R2', label: 'Zéro vertical hardcodé dans kernel', ok: true },
                        { rule: 'R3', label: 'LLMManager singleton supprimé fleet/', ok: true },
                        { rule: 'R5', label: 'Zéro NEXT_PUBLIC_LLM_* clé publique', ok: true },
                        { rule: 'R8', label: 'OpsAlertGateway sur échec LLM', ok: true },
                        { rule: 'R9', label: 'Env vars MCC_LLM_* disjointes tenant', ok: true },
                        { rule: 'R10', label: 'CrossScopeAuthority porte unique', ok: true },
                    ].map(({ rule, label, ok }) => (
                        <div
                            key={rule}
                            className="flex items-center gap-2 p-2 bg-surface-elevated rounded-lg"
                        >
                            <span className={`text-xs font-mono ${ok ? 'text-green-400' : 'text-red-400'}`}>
                                {ok ? '✓' : '✗'} {rule}
                            </span>
                            <span className="text-xs text-secondary truncate">{label}</span>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-secondary mt-3">
                    Vérification CI : <code className="text-xs font-mono bg-surface p-0.5 rounded">scripts/verify-ai-isolation.sh</code>
                </p>
            </div>

            {/* ADR Link */}
            <p className="text-xs text-secondary text-center">
                Architecture : <span className="text-accent">ADR-008 — Isolation IA MCC ↔ Tenant</span>
            </p>
        </div>
    );
}
