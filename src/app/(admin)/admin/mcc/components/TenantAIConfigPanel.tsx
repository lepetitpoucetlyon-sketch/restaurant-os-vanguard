'use client';

/**
 * TenantAIConfigPanel — Édition MCC de la configuration IA d'un tenant.
 * ADR-008 — Phase C : chaque tenant peut avoir mode (cloud/souverain/mix),
 * providers par contexte (reasoning/fast/vision), chaîne de fallback.
 *
 * RBAC : mcc_super_admin (POST) / mcc_support (GET).
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Brain, Save, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authedFetch } from '@/lib/client/authedFetch';
import { useNexusFleet } from '@/shared/providers/fleet';
import type { AISettings } from '@/modules/system';
import { Button } from "@/shared/components/ui/Button";

const AI_MODES = ['cloud', 'souverain', 'mix'] as const;
const PROVIDER_NAMES = ['gemini', 'anthropic', 'openai', 'mistral', 'sovereign', 'ollama'] as const;
type Mode = typeof AI_MODES[number];
type ProviderName = typeof PROVIDER_NAMES[number];

const DEFAULT_SETTINGS: AISettings = {
    mode: 'cloud',
    providers: {
        reasoning: { provider: 'anthropic', model: 'claude-sonnet-5' },
        fast: { provider: 'gemini', model: 'gemini-1.5-flash' },
        vision: { provider: 'gemini', model: 'gemini-1.5-flash' },
    },
    fallbackChain: ['gemini', 'anthropic'],
};

export function TenantAIConfigPanel() {
    const { instances } = useNexusFleet();

    const [selectedId, setSelectedId] = useState<string>('');
    const [variant, setVariant] = useState<string | null>(null);
    const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
    const [initial, setInitial] = useState<AISettings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState<{ success: boolean; msg: string } | null>(null);

    const load = useCallback(async (tid: string) => {
        setIsLoading(true);
        setResult(null);
        try {
            const res = await authedFetch(`/api/admin/fleet/tenant-ai-config?tenantId=${tid}`);
            const data = await res.json() as { aiSettings?: AISettings; variant?: string };
            const s = data.aiSettings ?? DEFAULT_SETTINGS;
            setSettings(s);
            setInitial(s);
            setVariant(data.variant ?? null);
        } catch {
            setSettings(DEFAULT_SETTINGS);
            setInitial(DEFAULT_SETTINGS);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedId) void load(selectedId);
    }, [selectedId, load]);

    const dirty = JSON.stringify(settings) !== JSON.stringify(initial);

    const handleSave = async () => {
        if (!selectedId) return;
        setIsSaving(true);
        setResult(null);
        try {
            const res = await authedFetch('/api/admin/fleet/tenant-ai-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId: selectedId, aiSettings: settings }),
            });
            const data = await res.json() as { success?: boolean; error?: string };
            if (data.success) {
                setResult({ success: true, msg: 'Configuration IA appliquée' });
                setInitial(settings);
            } else {
                setResult({ success: false, msg: data.error ?? 'Échec de la sauvegarde' });
            }
        } catch (err) {
            setResult({ success: false, msg: err instanceof Error ? err.message : 'Erreur réseau' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setSettings(initial);
        setResult(null);
    };

    const updateMode = (mode: Mode) => {
        setSettings(s => ({ ...s, mode }));
    };

    const updateProvider = (
        context: 'reasoning' | 'fast' | 'vision',
        field: 'provider' | 'model',
        value: string,
    ) => {
        setSettings(s => {
            const providers = s.providers ?? DEFAULT_SETTINGS.providers!;
            return {
                ...s,
                providers: {
                    ...providers,
                    [context]: {
                        ...providers[context],
                        [field]: value,
                    },
                },
            };
        });
    };

    const toggleFallback = (provider: ProviderName) => {
        setSettings(s => {
            const chain = s.fallbackChain ?? [];
            const next = chain.includes(provider)
                ? chain.filter(p => p !== provider)
                : [...chain, provider];
            return { ...s, fallbackChain: next };
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-accent" />
                <div>
                    <h2 className="text-lg font-semibold text-primary">Configuration IA par Tenant</h2>
                    <p className="text-xs text-secondary">ADR-008 — Isolation MCC ↔ Tenant</p>
                </div>
            </div>

            {/* Tenant selector */}
            <div className="p-4 bg-surface border border-default rounded-xl">
                <label className="text-xs text-secondary uppercase tracking-wide">Tenant cible</label>
                <select
                    value={selectedId}
                    onChange={e => setSelectedId(e.target.value)}
                    className="mt-2 w-full px-3 py-2 bg-surface-elevated border border-default rounded-lg text-sm text-primary"
                >
                    <option value="">— Sélectionner un tenant —</option>
                    {instances.map(t => (
                        <option key={t.id} value={t.id}>
                            {t.name} ({t.id})
                        </option>
                    ))}
                </select>
                {variant && (
                    <p className="mt-2 text-xs text-secondary">
                        Verticale : <span className="font-mono text-primary">{variant}</span> — le prompt vertical
                        sera injecté automatiquement par le blueprint.
                    </p>
                )}
            </div>

            {selectedId && !isLoading && (
                <>
                    {/* Mode */}
                    <div className="p-4 bg-surface border border-default rounded-xl">
                        <h3 className="text-sm font-medium text-primary mb-3">Mode</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {AI_MODES.map(m => (
                                <Button variant="ghost"
                                    key={m}
                                    onClick={() => updateMode(m)}
                                    className={`p-3 rounded-lg text-sm capitalize border ${
                                        settings.mode === m
                                            ? 'bg-accent/10 border-accent text-primary'
                                            : 'bg-surface-elevated border-default text-secondary hover:text-primary'
                                    }`}
                                >
                                    {m}
                                </Button>
                            ))}
                        </div>
                        <p className="mt-3 text-xs text-secondary">
                            {settings.mode === 'cloud' && '☁️ Providers cloud uniquement (Gemini, Claude, GPT, Mistral).'}
                            {settings.mode === 'souverain' && '🏛️ SLM local uniquement (sovereign / ollama).'}
                            {settings.mode === 'mix' && '🔀 Cloud + fallback souverain autorisé.'}
                        </p>
                    </div>

                    {/* Providers par contexte */}
                    <div className="p-4 bg-surface border border-default rounded-xl">
                        <h3 className="text-sm font-medium text-primary mb-3">Providers par contexte</h3>
                        <div className="space-y-3">
                            {(['reasoning', 'fast', 'vision'] as const).map(ctx => {
                                const cfg = settings.providers?.[ctx];
                                return (
                                    <div key={ctx} className="p-3 bg-surface-elevated rounded-lg">
                                        <p className="text-xs text-secondary uppercase tracking-wide mb-2">
                                            {ctx === 'reasoning' && '🧠 Raisonnement'}
                                            {ctx === 'fast' && '⚡ Fast'}
                                            {ctx === 'vision' && '👁️ Vision'}
                                        </p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <select
                                                value={cfg?.provider ?? 'gemini'}
                                                onChange={e => updateProvider(ctx, 'provider', e.target.value)}
                                                className="px-2 py-1.5 bg-surface border border-default rounded text-sm text-primary"
                                            >
                                                {PROVIDER_NAMES.map(p => (
                                                    <option key={p} value={p}>
                                                        {p}
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                type="text"
                                                value={cfg?.model ?? ''}
                                                onChange={e => updateProvider(ctx, 'model', e.target.value)}
                                                placeholder="Modèle (ex: gemini-1.5-flash)"
                                                className="px-2 py-1.5 bg-surface border border-default rounded text-sm text-primary"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Fallback chain */}
                    <div className="p-4 bg-surface border border-default rounded-xl">
                        <h3 className="text-sm font-medium text-primary mb-3">Chaîne de fallback</h3>
                        <div className="flex flex-wrap gap-2">
                            {PROVIDER_NAMES.map(p => {
                                const idx = (settings.fallbackChain ?? []).indexOf(p);
                                const active = idx >= 0;
                                return (
                                    <Button variant="ghost"
                                        key={p}
                                        onClick={() => toggleFallback(p)}
                                        className={`px-3 py-1.5 rounded-full text-xs capitalize border ${
                                            active
                                                ? 'bg-accent/10 border-accent text-primary'
                                                : 'bg-surface-elevated border-default text-secondary'
                                        }`}
                                    >
                                        {active && <span className="mr-1 text-accent">#{idx + 1}</span>}
                                        {p}
                                    </Button>
                                );
                            })}
                        </div>
                        <p className="mt-2 text-xs text-secondary">
                            Ordre déterminé par l'ordre de sélection. Providers incompatibles avec le mode sont
                            filtrés au runtime.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-3">
                        <Button variant="ghost"
                            onClick={handleReset}
                            disabled={!dirty || isSaving}
                            className="flex items-center gap-2 px-3 py-2 bg-surface border border-default rounded-lg text-sm text-secondary hover:text-primary disabled:opacity-50"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Réinitialiser
                        </Button>
                        <Button variant="ghost"
                            onClick={() => void handleSave()}
                            disabled={!dirty || isSaving}
                            className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent rounded-lg text-sm text-primary disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? 'Sauvegarde...' : 'Appliquer'}
                        </Button>
                    </div>

                    {result && (
                        <div
                            className={`flex items-center gap-2 p-3 rounded-lg text-xs ${
                                result.success
                                    ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                            }`}
                        >
                            {result.success ? (
                                <CheckCircle2 className="w-4 h-4" />
                            ) : (
                                <AlertCircle className="w-4 h-4" />
                            )}
                            {result.msg}
                        </div>
                    )}
                </>
            )}

            {isLoading && (
                <div className="h-32 bg-surface animate-pulse rounded-xl" />
            )}
        </div>
    );
}
