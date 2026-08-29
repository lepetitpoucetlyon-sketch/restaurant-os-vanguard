'use client';
import { Button } from '@/shared/components/ui/Button';

/**
 * 🏛️ SystemTenantsTab — Panneau MCC de gestion des 24 tenants système
 *
 * Affiche les tiers DEMO / TEST / REFERENCE pour chaque verticale.
 */

import React from 'react';
import {
    Clock, Database,
    FlaskConical, Star, Play
} from 'lucide-react';
import { PLATFORM_VARIANTS } from '@/modules/system';
import { getAllSystemTenantIds } from '@/lib/mcc/SystemTenantRegistry';
import { VariantCard } from './system-tenants/VariantCard';
import type { TierInfo } from './system-tenants/TierRow';

// ── Types & Constantes ────────────────────────────────────────────────────────

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

// ── Main Tab Orchestrator ────────────────────────────────────────────────────

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
                    <VariantCard key={variant} variant={variant} tierConfig={TIER_CONFIG} />
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
