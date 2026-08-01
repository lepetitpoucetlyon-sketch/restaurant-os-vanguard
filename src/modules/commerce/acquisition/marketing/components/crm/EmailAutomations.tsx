'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
    Cake,
    RotateCcw,
    Star,
    Play,
    Pause,
    Loader2,
    ChevronDown,
    ChevronUp,
    Zap,
} from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { authedFetch } from '@/lib/client/authedFetch';

// ── Types ───────────────────────────────────────────────────────────────────

interface AutomationConfig {
    enabled: boolean;
    delayDays: number;
    subject: string;
    body: string;
}

type AutomationKey = 'birthday' | 'winback' | 'postvisit';

const DEFAULTS: Record<AutomationKey, AutomationConfig> = {
    birthday: {
        enabled: false,
        delayDays: 0,
        subject: 'Joyeux anniversaire, {{firstName}} ! 🎂',
        body: 'Bonjour {{firstName}},\n\nToute l\'équipe vous souhaite un très joyeux anniversaire !\nVenez fêter ça avec nous — une surprise vous attend.\n\nÀ très bientôt,\nL\'équipe',
    },
    winback: {
        enabled: false,
        delayDays: 60,
        subject: 'On ne vous a pas vu depuis un moment, {{firstName}}…',
        body: 'Bonjour {{firstName}},\n\nCela fait {{delayDays}} jours que vous n\'êtes pas passé(e). Nous espérons vous revoir bientôt.\nUne offre spéciale vous attend.\n\nÀ très bientôt,\nL\'équipe',
    },
    postvisit: {
        enabled: false,
        delayDays: 2,
        subject: 'Merci pour votre visite, {{firstName}} !',
        body: 'Bonjour {{firstName}},\n\nMerci d\'être venu(e) nous rendre visite ! Nous espérons que vous avez passé un excellent moment.\nVotre avis compte beaucoup pour nous.\n\nÀ bientôt,\nL\'équipe',
    },
};

const AUTOMATION_META: Record<AutomationKey, { icon: React.ElementType; label: string; desc: string; color: string }> = {
    birthday:  { icon: Cake,      label: 'Email Anniversaire',  desc: 'Envoyé le jour de l\'anniversaire du client',           color: 'text-pink-500' },
    winback:   { icon: RotateCcw, label: 'Win-Back',            desc: 'Envoyé après N jours d\'inactivité',                    color: 'text-orange-400' },
    postvisit: { icon: Star,      label: 'Post-Visite',         desc: 'Envoyé N jours après la dernière visite (review gate)', color: 'text-action-primary' },
};

// ── Component ────────────────────────────────────────────────────────────────

export function EmailAutomations() {
    const [configs, setConfigs] = useState<Record<AutomationKey, AutomationConfig>>(DEFAULTS);
    const [expanded, setExpanded] = useState<AutomationKey | null>(null);
    const [running, setRunning] = useState<AutomationKey | null>(null);

    const update = (key: AutomationKey, partial: Partial<AutomationConfig>) => {
        setConfigs(prev => ({ ...prev, [key]: { ...prev[key], ...partial } }));
    };

    const runNow = async (key: AutomationKey) => {
        setRunning(key);
        try {
            const res = await authedFetch('/api/crm/automations/run', {
                method: 'POST',
                body: JSON.stringify({ automation: key, config: configs[key] }),
            });
            if (!res.ok) throw new Error('Erreur serveur');
            const data: { sent: number } = await res.json();
            toast.success(`${data.sent} email(s) envoyé(s) pour « ${AUTOMATION_META[key].label} »`);
        } catch {
            toast.error('Échec de l\'envoi — vérifiez votre configuration');
        } finally {
            setRunning(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-action-primary" />
                <div>
                    <h2 className="text-lg font-bold text-text-primary">Automations Email</h2>
                    <p className="text-xs text-text-muted mt-0.5">Scénarios déclenchés automatiquement selon les événements client</p>
                </div>
            </div>

            <div className="space-y-3">
                {(Object.entries(AUTOMATION_META) as [AutomationKey, typeof AUTOMATION_META[AutomationKey]][]).map(([key, meta]) => {
                    const cfg = configs[key];
                    const Icon = meta.icon;
                    const isExpanded = expanded === key;

                    return (
                        <div
                            key={key}
                            className={cn(
                                "rounded-2xl border transition-all",
                                cfg.enabled ? "border-action-primary/30 bg-action-primary/5" : "border-border bg-surface-card"
                            )}
                        >
                            {/* Header row */}
                            <div className="flex items-center gap-4 p-5">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-surface-sidebar shrink-0", meta.color)}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-text-primary">{meta.label}</p>
                                    <p className="text-xs text-text-muted">{meta.desc}</p>
                                </div>

                                {/* Toggle */}
                                <button
                                    onClick={() => update(key, { enabled: !cfg.enabled })}
                                    className={cn(
                                        "w-11 h-6 rounded-full transition-all relative shrink-0",
                                        cfg.enabled ? "bg-status-success" : "bg-border"
                                    )}
                                >
                                    <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all", cfg.enabled ? "right-1" : "left-1")} />
                                </button>

                                {/* Run now */}
                                {cfg.enabled && (
                                    <button
                                        onClick={() => runNow(key)}
                                        disabled={!!running}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-action-primary text-text-primary text-xs font-medium disabled:opacity-50 shrink-0"
                                    >
                                        {running === key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                                        Lancer
                                    </button>
                                )}

                                {/* Expand toggle */}
                                <button
                                    onClick={() => setExpanded(isExpanded ? null : key)}
                                    className="p-1.5 text-text-muted hover:text-text-primary transition-colors shrink-0"
                                >
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                            </div>

                            {/* Expanded config */}
                            {isExpanded && (
                                <div className="px-5 pb-5 pt-0 border-t border-border space-y-4">
                                    {/* Status pill */}
                                    <div className={cn(
                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mt-4",
                                        cfg.enabled
                                            ? "bg-status-success/10 text-status-success border border-status-success/20"
                                            : "bg-surface-sidebar text-text-muted border border-border"
                                    )}>
                                        {cfg.enabled ? <Play className="w-2.5 h-2.5" /> : <Pause className="w-2.5 h-2.5" />}
                                        {cfg.enabled ? 'Actif' : 'Inactif'}
                                    </div>

                                    {key !== 'birthday' && (
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
                                                {key === 'winback' ? 'Inactivité avant envoi (jours)' : 'Délai après la visite (jours)'}
                                            </label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={365}
                                                value={cfg.delayDays}
                                                onChange={(e) => update(key, { delayDays: Number(e.target.value) })}
                                                className="w-32 px-3 py-2 rounded-lg border border-border bg-surface-base text-sm text-text-primary focus:outline-none focus:border-action-primary"
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Objet de l'email</label>
                                        <input
                                            type="text"
                                            value={cfg.subject}
                                            onChange={(e) => update(key, { subject: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-border bg-surface-base text-sm text-text-primary focus:outline-none focus:border-action-primary"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Corps du message</label>
                                        <p className="text-[10px] text-text-muted">Variables disponibles : <code className="bg-surface-sidebar px-1 rounded">{'{{firstName}}'}</code> <code className="bg-surface-sidebar px-1 rounded">{'{{delayDays}}'}</code></p>
                                        <textarea
                                            rows={5}
                                            value={cfg.body}
                                            onChange={(e) => update(key, { body: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-border bg-surface-base text-sm text-text-primary focus:outline-none focus:border-action-primary resize-none font-mono"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <p className="text-[10px] text-text-muted border border-border rounded-lg px-4 py-3 bg-surface-sidebar">
                Les automations actives s'exécutent quotidiennement. Utilisez <strong>Lancer</strong> pour un envoi immédiat (utile en test).
            </p>
        </div>
    );
}
