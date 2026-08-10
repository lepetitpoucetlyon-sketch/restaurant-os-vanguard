'use client';

/**
 * 🏛️ SystemTenantsTab — Panneau MCC de gestion des 24 tenants système
 *
 * Affiche les tiers DEMO / TEST / REFERENCE pour chaque verticale.
 * Actions :
 *  - Voir           : ouvre l'app dans un onglet avec ce tenantId
 *  - Reset snapshot : restaure les données DEMO initiales
 *  - Reset TEST     : repart du DNA de la REFERENCE
 *  - Promouvoir     : ouvre la modale de promotion TEST → REFERENCE
 *  - Snapshots      : liste des promotions REFERENCE horodatées
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Eye, RefreshCw, ArrowUpCircle, Archive, CheckCircle2,
    Clock, Loader2, ChevronDown, ChevronUp, Database,
    FlaskConical, Star, Play, X
} from 'lucide-react';
import { PLATFORM_VARIANTS, VERTICAL_META } from '@/src/modules/system/domain/schemas/tenant';;
import type { PlatformVariant } from '@/modules/system';
import { getSystemTenantId, getAllSystemTenantIds } from '@/lib/mcc/SystemTenantRegistry';
import { toast } from 'sonner';
import { authedFetch } from '@/lib/client/authedFetch';
import { toError } from "@/lib/toError";

// ── Types ─────────────────────────────────────────────────────────────────────

type TierInfo = {
    tier: 'DEMO' | 'TEST' | 'REFERENCE';
    label: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
    badge: string;
    actions: ('view' | 'reset' | 'promote' | 'snapshots')[];
};

const TIER_CONFIG: TierInfo[] = [
    {
        tier: 'DEMO',
        label: 'DEMO',
        icon: <Play className="w-3.5 h-3.5" />,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/20',
        badge: 'bg-emerald-500/20 text-emerald-300',
        actions: ['view', 'reset'],
    },
    {
        tier: 'TEST',
        label: 'TEST',
        icon: <FlaskConical className="w-3.5 h-3.5" />,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10 border-blue-500/20',
        badge: 'bg-blue-500/20 text-blue-300',
        actions: ['view', 'reset', 'promote'],
    },
    {
        tier: 'REFERENCE',
        label: 'REF',
        icon: <Star className="w-3.5 h-3.5" />,
        color: 'text-brand',
        bg: 'bg-brand/10 border-brand/20',
        badge: 'bg-brand/20 text-brand',
        actions: ['view', 'snapshots'],
    },
];

// ── Promotion Modal ───────────────────────────────────────────────────────────

const CLONABLE_COLLECTIONS = ['categories', 'products', 'floors', 'zones', 'tables', 'connectors'];

function PromotionModal({
    variant,
    onClose,
    onSuccess,
}: {
    variant: PlatformVariant;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [selected, setSelected] = useState<Set<string>>(new Set(CLONABLE_COLLECTIONS));
    const [loading, setLoading]   = useState(false);
    const testId = getSystemTenantId(variant, 'TEST');
    const refId  = getSystemTenantId(variant, 'REFERENCE');

    const toggle = (col: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(col)) next.delete(col); else next.add(col);
            return next;
        });
    };

    const promote = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authedFetch('/api/admin/mcc/system-tenants/promote', {
                method: 'POST',
                body: JSON.stringify({ variant, collections: Array.from(selected) }),
            });
            if (!res.ok) throw new Error(await res.text());
            toast.success(`REFERENCE ${variant} mise à jour ✓`);
            onSuccess();
            onClose();
        } catch (err) {
            toast.error(`Erreur promotion : ${toError(err).message}`);
        } finally {
            setLoading(false);
        }
    }, [variant, selected, onSuccess, onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="w-full max-w-lg mx-4 bg-surface-sidebar border border-default rounded-2xl p-6 shadow-2xl"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold uppercase tracking-widest text-text-primary">
                        Promouvoir TEST → REFERENCE
                    </h3>
                    <button onClick={onClose} className="text-muted hover:text-text-primary transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-sm text-muted mb-5">
                    <span className="font-mono text-blue-400">{testId}</span>
                    {' → '}
                    <span className="font-mono text-brand">{refId}</span>
                </p>

                <p className="text-xs font-bold uppercase tracking-widest text-muted mb-3">Collections à copier</p>
                <div className="space-y-2 mb-6">
                    {CLONABLE_COLLECTIONS.map(col => (
                        <label key={col} className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={selected.has(col)}
                                onChange={() => toggle(col)}
                                className="w-4 h-4 rounded accent-brand"
                            />
                            <span className="text-sm font-mono text-text-primary group-hover:text-brand transition-colors">
                                {col}
                            </span>
                        </label>
                    ))}
                    <div className="pt-2 border-t border-default">
                        <p className="text-xs text-muted">
                            <span className="line-through opacity-40">fiscalSeals</span>
                            <span className="ml-2 text-red-400/70">JAMAIS cloné — NF525</span>
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl border border-default text-sm font-bold text-muted hover:text-text-primary transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={promote}
                        disabled={loading || selected.size === 0}
                        className="flex-1 px-4 py-3 rounded-xl bg-brand text-primary text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Snapshot + Promouvoir
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ── Tier Row ──────────────────────────────────────────────────────────────────

function TierRow({ variant, tierCfg, onPromote }: {
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
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${tierCfg.badge}`}>
                    {tierCfg.icon}
                    {tierCfg.label}
                </span>
                <span className={`text-xs font-mono truncate ${tierCfg.color}`}>{tenantId}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                {/* Voir */}
                <button
                    onClick={handleView}
                    title="Ouvrir dans un onglet"
                    className="p-1.5 rounded-lg text-muted hover:text-text-primary hover:bg-surface-sidebar transition-all"
                >
                    <Eye className="w-3.5 h-3.5" />
                </button>

                {/* Reset (DEMO ou TEST) */}
                {tierCfg.actions.includes('reset') && (
                    <button
                        onClick={handleReset}
                        disabled={loading === 'reset'}
                        title={tierCfg.tier === 'DEMO' ? 'Reset snapshot DEMO' : 'Reset TEST → DNA REFERENCE'}
                        className="p-1.5 rounded-lg text-muted hover:text-blue-400 hover:bg-surface-sidebar transition-all disabled:opacity-50"
                    >
                        {loading === 'reset'
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <RefreshCw className="w-3.5 h-3.5" />
                        }
                    </button>
                )}

                {/* Promouvoir TEST → REFERENCE */}
                {tierCfg.actions.includes('promote') && (
                    <button
                        onClick={onPromote}
                        title="Promouvoir vers REFERENCE"
                        className="p-1.5 rounded-lg text-muted hover:text-brand hover:bg-surface-sidebar transition-all flex items-center gap-1 text-[10px] font-bold"
                    >
                        <ArrowUpCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Promouvoir</span>
                    </button>
                )}

                {/* Snapshots REFERENCE */}
                {tierCfg.actions.includes('snapshots') && (
                    <button
                        title="Voir les snapshots"
                        className="p-1.5 rounded-lg text-muted hover:text-text-primary hover:bg-surface-sidebar transition-all"
                    >
                        <Archive className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}

// ── Variant Card ──────────────────────────────────────────────────────────────

function VariantCard({ variant }: { variant: PlatformVariant }) {
    const [collapsed, setCollapsed]         = useState(false);
    const [showPromote, setShowPromote]     = useState(false);
    const [promoteCount, setPromoteCount]   = useState(0);
    const meta = VERTICAL_META[variant];

    return (
        <>
            <div className="border border-default rounded-2xl overflow-hidden">
                {/* Header */}
                <button
                    onClick={() => setCollapsed(c => !c)}
                    className="w-full flex items-center justify-between px-5 py-4 bg-surface-sidebar hover:bg-surface-sidebar/80 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{meta.emoji}</span>
                        <span className="font-bold uppercase tracking-widest text-sm text-text-primary">
                            {meta.label}
                        </span>
                        <span className="text-xs font-mono text-muted">× 3 tiers</span>
                    </div>
                    {collapsed
                        ? <ChevronDown className="w-4 h-4 text-muted" />
                        : <ChevronUp className="w-4 h-4 text-muted" />
                    }
                </button>

                {/* Tier rows */}
                {!collapsed && (
                    <div className="px-4 py-3 space-y-2 bg-surface-bg/30">
                        {TIER_CONFIG.map(tierCfg => (
                            <TierRow
                                key={tierCfg.tier}
                                variant={variant}
                                tierCfg={tierCfg}
                                onPromote={() => setShowPromote(true)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Promotion Modal */}
            <AnimatePresence>
                {showPromote && (
                    <PromotionModal
                        key={`promote-${variant}-${promoteCount}`}
                        variant={variant}
                        onClose={() => setShowPromote(false)}
                        onSuccess={() => setPromoteCount(c => c + 1)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

// ── Main Tab ──────────────────────────────────────────────────────────────────

export function SystemTenantsTab() {
    const total = getAllSystemTenantIds().length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold uppercase tracking-widest text-text-primary flex items-center gap-2">
                        <Database className="w-5 h-5 text-brand" />
                        Tenants Système
                    </h2>
                    <p className="text-xs text-muted mt-1">
                        {total} tenants permanents · non facturés · invisibles de la fleet cliente
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted border border-default rounded-xl px-3 py-2">
                    <Clock className="w-3.5 h-3.5" />
                    Bootstrapper : <code className="ml-1 font-mono text-brand">npx tsx scripts/bootstrap-system-tenants.ts</code>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-muted flex-wrap">
                {TIER_CONFIG.map(t => (
                    <span key={t.tier} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${t.badge}`}>
                        {t.icon} {t.label} — {
                            t.tier === 'DEMO' ? 'Simulacra (prospect)' :
                            t.tier === 'TEST' ? 'Bac à sable dev' :
                            'Maître cloneable'
                        }
                    </span>
                ))}
            </div>

            {/* Variant cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PLATFORM_VARIANTS.map(variant => (
                    <VariantCard key={variant} variant={variant} />
                ))}
            </div>

            {/* Invariants */}
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-xs text-muted space-y-1">
                <p className="font-bold text-red-400 uppercase tracking-widest mb-2">Invariants NF525</p>
                <p>• <code>fiscalSeals</code> et <code>journalEntries</code> ne sont <strong>jamais</strong> clonés ni partagés.</p>
                <p>• Écriture sur <code>_ref_*</code> bloquée par SovereignGuard — promotion MCC uniquement.</p>
                <p>• Tenants <code>_demo_*</code> et <code>_ref_*</code> : zéro appel Stripe / Resend / webhook externe.</p>
            </div>
        </div>
    );
}
