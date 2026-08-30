'use client';

/**
 * PublicAccessPanel — Kill-switch MCC pour l'accès public.
 *
 * Toggles :
 *   - Landing publique (les visiteurs anonymes voient-ils la homepage ?)
 *   - Signup autonome (peut-on créer un compte sans que le MCC intervienne ?)
 *
 * Message custom optionnel affiché aux visiteurs quand une feature est OFF.
 * RBAC POST : mcc_super_admin.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Lock, Unlock, Save, RotateCcw, AlertCircle, CheckCircle2, Globe, UserPlus } from 'lucide-react';
import { authedFetch } from '@/lib/client/authedFetch';
import type { PublicAccessConfig } from '@/lib/mcc/PublicAccessConfig';
import { Button } from "@/shared/components/ui/Button";

const DEFAULTS: PublicAccessConfig = {
    landingEnabled: true,
    signupEnabled: true,
    disabledMessage: '',
};

export function PublicAccessPanel() {
    const [config, setConfig] = useState<PublicAccessConfig>(DEFAULTS);
    const [initial, setInitial] = useState<PublicAccessConfig>(DEFAULTS);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setResult(null);
        try {
            const res = await authedFetch('/api/admin/fleet/public-access');
            const data = await res.json() as { config?: PublicAccessConfig };
            const c = { ...DEFAULTS, ...(data.config ?? {}) };
            setConfig(c);
            setInitial(c);
        } catch {
            setResult({ ok: false, msg: 'Impossible de charger la config' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    const dirty = JSON.stringify(config) !== JSON.stringify(initial);

    const save = async () => {
        setSaving(true);
        setResult(null);
        try {
            const res = await authedFetch('/api/admin/fleet/public-access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    landingEnabled: config.landingEnabled,
                    signupEnabled: config.signupEnabled,
                    disabledMessage: config.disabledMessage ?? '',
                }),
            });
            const data = await res.json() as { success?: boolean; error?: string; config?: PublicAccessConfig };
            if (data.success && data.config) {
                setConfig(data.config);
                setInitial(data.config);
                setResult({ ok: true, msg: 'Configuration appliquée' });
            } else {
                setResult({ ok: false, msg: data.error ?? 'Échec' });
            }
        } catch (err) {
            setResult({ ok: false, msg: err instanceof Error ? err.message : 'Erreur réseau' });
        } finally {
            setSaving(false);
        }
    };

    const reset = () => {
        setConfig(initial);
        setResult(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-accent" />
                <div>
                    <h2 className="text-lg font-semibold text-primary">Accès public</h2>
                    <p className="text-xs text-secondary">Landing + signup autonome — kill-switch MCC</p>
                </div>
            </div>

            {loading ? (
                <div className="h-32 bg-surface animate-pulse rounded-xl" />
            ) : (
                <>
                    {/* Toggle 1 : Landing */}
                    <ToggleRow
                        icon={Globe}
                        title="Landing publique"
                        subtitle="La homepage / verticales / pricing / legal est visible par les visiteurs anonymes."
                        enabled={config.landingEnabled}
                        onChange={v => setConfig(c => ({ ...c, landingEnabled: v }))}
                    />

                    {/* Toggle 2 : Signup */}
                    <ToggleRow
                        icon={UserPlus}
                        title="Signup autonome"
                        subtitle="Le formulaire d'inscription (Stripe Checkout + provisioning) accepte de nouveaux clients."
                        enabled={config.signupEnabled}
                        onChange={v => setConfig(c => ({ ...c, signupEnabled: v }))}
                    />

                    {/* Message custom */}
                    <div className="p-4 bg-surface border border-default rounded-xl">
                        <label className="text-xs uppercase tracking-wide text-secondary mb-2 block">
                            Message affiché aux visiteurs (facultatif)
                        </label>
                        <textarea
                            value={config.disabledMessage ?? ''}
                            onChange={e => setConfig(c => ({ ...c, disabledMessage: e.target.value }))}
                            placeholder="Ex : Nous ouvrons de nouveaux comptes le 1er septembre. Contact : contact@…"
                            maxLength={500}
                            rows={3}
                            className="w-full px-3 py-2 bg-surface-elevated border border-default rounded-lg text-sm text-primary focus:outline-none focus:border-accent"
                        />
                        <p className="text-xs text-secondary mt-1">
                            {(config.disabledMessage?.length ?? 0)} / 500 caractères — affiché uniquement quand landing ou signup est OFF
                        </p>
                    </div>

                    {/* Meta info */}
                    {initial.updatedAt && (
                        <p className="text-xs text-secondary">
                            Dernière modif :{' '}
                            <span className="text-primary">{new Date(initial.updatedAt).toLocaleString('fr-FR')}</span>
                            {initial.updatedBy && <> par <span className="text-primary">{initial.updatedBy}</span></>}
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-3">
                        <Button variant="ghost"
                            onClick={reset}
                            disabled={!dirty || saving}
                            className="flex items-center gap-2 px-3 py-2 bg-surface border border-default rounded-lg text-sm text-secondary hover:text-primary disabled:opacity-50"
                        >
                            <RotateCcw className="w-4 h-4" /> Annuler
                        </Button>
                        <Button variant="ghost"
                            onClick={() => void save()}
                            disabled={!dirty || saving}
                            className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent rounded-lg text-sm text-primary disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" /> {saving ? 'Sauvegarde…' : 'Appliquer'}
                        </Button>
                    </div>

                    {result && (
                        <div
                            className={`flex items-center gap-2 p-3 rounded-lg text-xs ${
                                result.ok
                                    ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                            }`}
                        >
                            {result.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            {result.msg}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

interface ToggleRowProps {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    subtitle: string;
    enabled: boolean;
    onChange: (v: boolean) => void;
}

function ToggleRow({ icon: Icon, title, subtitle, enabled, onChange }: ToggleRowProps) {
    return (
        <div className="p-4 bg-surface border border-default rounded-xl flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                enabled ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
            }`}>
                {enabled
                    ? <Unlock className="w-4 h-4 text-green-400" />
                    : <Lock className="w-4 h-4 text-red-400" />}
                <Icon className="hidden" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-primary">{title}</h3>
                    <span className={`text-nano uppercase font-bold px-1.5 py-0.5 rounded ${
                        enabled ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                        {enabled ? 'Ouvert' : 'Fermé'}
                    </span>
                </div>
                <p className="text-xs text-secondary mt-1">{subtitle}</p>
            </div>
            <Button variant="ghost"
                onClick={() => onChange(!enabled)}
                aria-pressed={enabled}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                    enabled ? 'bg-accent' : 'bg-surface-elevated border border-default'
                }`}
            >
                <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
            </Button>
        </div>
    );
}
