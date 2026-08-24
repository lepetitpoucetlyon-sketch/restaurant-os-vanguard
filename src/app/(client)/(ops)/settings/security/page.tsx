'use client';

/**
 * 🔐 /settings/security — Panneau MFA multi-canaux (Plan v3.1 §P0.4).
 *
 * Interface admin tenant pour :
 *  - Activer/désactiver les 5 canaux MFA (SMS, Email, TOTP, WebAuthn, Backup Codes)
 *  - Définir les rôles obligés d'enrôler MFA
 *  - Régénérer les backup codes personnels (10 codes usage unique)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Key, Loader2, AlertTriangle, Copy, CheckCircle2, RefreshCw } from 'lucide-react';

import { withPageGuard } from '@/shared/components/rbac/PageGuard';
import { PageShell } from '@/shared/components/ui/PageShell';
import { useAuth, useTenant } from '@/shared/providers/NexusCoreProvider';
import { useToast } from '@ui/Toast';

import {
    MfaChannelsService,
    MFA_CHANNEL_META,
    type MfaChannel,
    type MfaChannelsConfig,
} from '@/modules/compliance';
import { BackupCodesService } from '@/modules/compliance';

const ALL_CHANNELS: readonly MfaChannel[] = ['webauthn', 'totp', 'sms', 'email', 'backup_codes'];
const ALL_ROLES = [
    { key: 'admin', label: 'Administrateur' },
    { key: 'manager', label: 'Manager' },
    { key: 'operator', label: 'Opérateur' },
    { key: 'stagiaire', label: 'Stagiaire' },
] as const;

function SecuritySettingsPage() {
    const { currentUser } = useAuth();
    const { activeTenantId } = useTenant();
    const { showToast } = useToast();

    const [config, setConfig] = useState<MfaChannelsConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [remaining, setRemaining] = useState<number>(0);
    const [newlyGenerated, setNewlyGenerated] = useState<readonly string[] | null>(null);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // ── Chargement config ──
    const load = useCallback(async () => {
        if (!activeTenantId || !currentUser?.id) return;
        setIsLoading(true);
        try {
            const [cfg, remainingCount] = await Promise.all([
                MfaChannelsService.getConfig(activeTenantId),
                BackupCodesService.remaining(activeTenantId, currentUser.id),
            ]);
            setConfig(cfg);
            setRemaining(remainingCount);
        } catch (err) {
            showToast(`Erreur chargement : ${err instanceof Error ? err.message : 'inconnue'}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [activeTenantId, currentUser?.id, showToast]);

    useEffect(() => { void load(); }, [load]);

    // ── Actions ──
    const toggleChannel = async (channel: MfaChannel) => {
        if (!config || !activeTenantId || !currentUser?.id) return;
        const nextChannels = config.enabledChannels.includes(channel)
            ? config.enabledChannels.filter((c: MfaChannel) => c !== channel)
            : [...config.enabledChannels, channel];
        if (nextChannels.length === 0) {
            showToast('Au moins un canal MFA doit rester actif', 'error');
            return;
        }
        setIsSaving(true);
        try {
            const next = await MfaChannelsService.updateConfig(activeTenantId, { enabledChannels: nextChannels }, currentUser.id);
            setConfig(next);
            showToast(`Canal ${MFA_CHANNEL_META[channel].label} ${nextChannels.includes(channel) ? 'activé' : 'désactivé'}`, 'success');
        } catch (err) {
            showToast(`Erreur : ${err instanceof Error ? err.message : 'inconnue'}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleRole = async (role: string) => {
        if (!config || !activeTenantId || !currentUser?.id) return;
        const nextRoles = config.requiredFor.includes(role)
            ? config.requiredFor.filter((r: string) => r !== role)
            : [...config.requiredFor, role];
        setIsSaving(true);
        try {
            const next = await MfaChannelsService.updateConfig(activeTenantId, { requiredFor: nextRoles }, currentUser.id);
            setConfig(next);
        } catch (err) {
            showToast(`Erreur : ${err instanceof Error ? err.message : 'inconnue'}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const generateNewCodes = async () => {
        if (!activeTenantId || !currentUser?.id) return;
        const confirmed = window.confirm(
            'Générer 10 nouveaux codes de secours ? Les codes précédents seront INVALIDÉS.',
        );
        if (!confirmed) return;
        setIsGenerating(true);
        try {
            const result = await BackupCodesService.generate(activeTenantId, currentUser.id, currentUser.id);
            setNewlyGenerated(result.plaintextCodes);
            setRemaining(result.plaintextCodes.length);
            showToast('10 nouveaux codes générés — imprime-les immédiatement.', 'success');
        } catch (err) {
            showToast(`Erreur génération : ${err instanceof Error ? err.message : 'inconnue'}`, 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const copyCode = (code: string) => {
        void navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 1500);
    };

    const copyAllCodes = () => {
        if (!newlyGenerated) return;
        void navigator.clipboard.writeText(newlyGenerated.join('\n'));
        showToast('Les 10 codes copiés dans le presse-papier', 'success');
    };

    // ── Rendu ──
    return (
        <PageShell
            kicker="Sécurité"
            title="MFA & Authentification"
            subtitle="Choisissez les méthodes d'authentification à deux facteurs autorisées pour votre équipe."
            icon={ShieldCheck}
            breadcrumbs={[{ label: 'Opérations' }, { label: 'Paramètres' }, { label: 'Sécurité' }]}
        >
            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 text-accent-gold animate-spin" />
                </div>
            ) : config ? (
                <div className="space-y-8 max-w-4xl">
                    {/* ── Canaux MFA ─────────────────────────────────────────── */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-serif font-bold italic text-text-primary">Canaux autorisés</h2>
                            {isSaving && <Loader2 className="w-4 h-4 text-text-muted animate-spin" />}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {ALL_CHANNELS.map(channel => {
                                const meta = MFA_CHANNEL_META[channel];
                                const enabled = config.enabledChannels.includes(channel);
                                return (
                                    <button
                                        key={channel}
                                        onClick={() => toggleChannel(channel)}
                                        disabled={isSaving}
                                        className={`text-left rounded-2xl p-4 border transition-all ${
                                            enabled
                                                ? 'bg-accent-gold/5 border-accent-gold/40'
                                                : 'bg-surface-card border-border hover:border-border-strong'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">{meta.emoji}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <span className="font-bold text-sm text-text-primary">{meta.label}</span>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                                        meta.securityLevel === 'strong' ? 'bg-status-success/10 text-status-success' :
                                                        meta.securityLevel === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                                                        'bg-text-muted/10 text-text-muted'
                                                    }`}>
                                                        {meta.securityLevel === 'strong' ? 'Fort' : meta.securityLevel === 'medium' ? 'Moyen' : 'Basique'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-text-muted leading-relaxed">{meta.description}</p>
                                                {meta.costHint && (
                                                    <p className="text-[10px] text-text-muted mt-1">💰 {meta.costHint}</p>
                                                )}
                                            </div>
                                            <div className={`w-10 h-6 rounded-full transition-colors shrink-0 relative ${enabled ? 'bg-accent-gold' : 'bg-border'}`}>
                                                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* ── Rôles obligés ──────────────────────────────────────── */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-serif font-bold italic text-text-primary">Rôles obligés d&apos;enrôler MFA</h2>
                        <div className="flex flex-wrap gap-2">
                            {ALL_ROLES.map(({ key, label }) => {
                                const enabled = config.requiredFor.includes(key);
                                return (
                                    <button
                                        key={key}
                                        onClick={() => toggleRole(key)}
                                        disabled={isSaving}
                                        className={`h-10 px-4 rounded-xl text-xs font-bold tracking-tight transition-all ${
                                            enabled
                                                ? 'bg-accent-gold text-text-on-primary'
                                                : 'bg-surface-card border border-border text-text-muted hover:text-text-primary'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* ── Backup codes ───────────────────────────────────────── */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-serif font-bold italic text-text-primary flex items-center gap-2">
                                    <Key className="w-5 h-5 text-accent-gold" />
                                    Codes de secours personnels
                                </h2>
                                <p className="text-xs text-text-muted mt-1">
                                    {remaining > 0 ? `${remaining} / 10 codes restants utilisables` : 'Aucun code généré'}
                                </p>
                            </div>
                            <button
                                onClick={generateNewCodes}
                                disabled={isGenerating}
                                className="h-10 px-4 rounded-xl bg-accent-gold text-text-on-primary text-xs font-black uppercase tracking-widest hover:bg-accent-gold/90 shadow-lg shadow-accent-gold/20 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                {remaining > 0 ? 'Régénérer' : 'Générer 10 codes'}
                            </button>
                        </div>

                        {newlyGenerated && (
                            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 space-y-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-text-primary">
                                            Ces codes ne seront affichés qu&apos;UNE seule fois
                                        </p>
                                        <p className="text-xs text-text-muted mt-1">
                                            Copie-les et imprime-les dès maintenant. Chaque code est utilisable une seule fois.
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                    {newlyGenerated.map(code => (
                                        <button
                                            key={code}
                                            onClick={() => copyCode(code)}
                                            className="font-mono text-sm bg-surface-card border border-border rounded-lg px-3 py-2 hover:border-accent-gold/50 transition-colors flex items-center justify-between gap-2 group"
                                        >
                                            <span className="text-text-primary">{code}</span>
                                            {copiedCode === code
                                                ? <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0" />
                                                : <Copy className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                            }
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={copyAllCodes}
                                    className="w-full h-10 rounded-xl border border-border text-xs font-bold tracking-tight text-text-muted hover:text-accent-gold hover:border-accent-gold/50 transition-all"
                                >
                                    Copier les 10 codes dans le presse-papier
                                </button>
                            </div>
                        )}
                    </section>

                    {/* ── Footer info ────────────────────────────────────────── */}
                    <section className="text-xs text-text-muted pt-6 border-t border-border">
                        <p>
                            Dernière modification :{' '}
                            {new Date(config.updatedAt).toLocaleString('fr-FR')}
                            {config.updatedBy && ` par ${config.updatedBy}`}
                        </p>
                    </section>
                </div>
            ) : (
                <p className="text-sm text-text-muted italic">Impossible de charger la configuration.</p>
            )}
        </PageShell>
    );
}

export default withPageGuard(SecuritySettingsPage, 'settings');
