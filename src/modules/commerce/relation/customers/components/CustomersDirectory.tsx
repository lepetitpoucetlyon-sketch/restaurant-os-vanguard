// @wip owner:commerce-team échéance:2026-Q4 — composant orphelin à intégrer ou supprimer (audit orphelins 2026-08-30)
"use client";

/**
 * CustomersDirectory — Composant preuve de useSovereignCustomers (ADR-012).
 * Annuaire CRM avec recherche + segments + tags inline.
 */

import React, { useState } from 'react';
import { UserPlus, Search, Star, X, Wifi, WifiOff } from 'lucide-react';
import { useSovereignCustomers } from '../../../hooks/useSovereignCustomers';

interface CustomersDirectoryProps {
    tenantId: string;
}

const SEGMENTS = ['all', 'new', 'regular', 'vip'] as const;

export function CustomersDirectory({ tenantId }: CustomersDirectoryProps) {
    const [q, setQ] = useState('');
    const [seg, setSeg] = useState<'all' | 'new' | 'regular' | 'vip'>('all');
    const [creating, setCreating] = useState(false);
    const [newForm, setNewForm] = useState({ firstName: '', lastName: '', phone: '' });

    const {
        data, isLoading, isSyncing, error,
        create, addTag, removeTag, refresh,
    } = useSovereignCustomers({
        tenantId,
        search: q || undefined,
        segment: seg === 'all' ? undefined : seg,
    });

    const submit = async () => {
        if (!newForm.firstName || !newForm.lastName || !newForm.phone) return;
        await create(newForm);
        setNewForm({ firstName: '', lastName: '', phone: '' });
        setCreating(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-primary">Clients</h2>
                    <span className="text-xs text-secondary">{data.length}</span>
                </div>
                <div className="flex items-center gap-2">
                    {isSyncing ? (
                        <span className="flex items-center gap-1 text-xs text-blue-400">
                            <Wifi className="w-3 h-3 animate-pulse" /> Sync
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-xs text-secondary">
                            <WifiOff className="w-3 h-3" /> Cache
                        </span>
                    )}
                    <button
                        onClick={() => setCreating(v => !v)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-accent/10 border border-accent rounded text-primary"
                    >
                        <UserPlus className="w-3 h-3" /> Nouveau
                    </button>
                </div>
            </div>

            {/* Create form */}
            {creating && (
                <div className="p-4 bg-surface border border-default rounded space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <input
                            placeholder="Prénom"
                            value={newForm.firstName}
                            onChange={e => setNewForm(f => ({ ...f, firstName: e.target.value }))}
                            className="px-3 py-2 bg-surface-elevated border border-default rounded text-sm text-primary"
                        />
                        <input
                            placeholder="Nom"
                            value={newForm.lastName}
                            onChange={e => setNewForm(f => ({ ...f, lastName: e.target.value }))}
                            className="px-3 py-2 bg-surface-elevated border border-default rounded text-sm text-primary"
                        />
                        <input
                            placeholder="Téléphone"
                            value={newForm.phone}
                            onChange={e => setNewForm(f => ({ ...f, phone: e.target.value }))}
                            className="px-3 py-2 bg-surface-elevated border border-default rounded text-sm text-primary"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setCreating(false)}
                            className="text-xs text-secondary hover:text-primary"
                        >Annuler</button>
                        <button
                            onClick={() => void submit()}
                            className="text-xs px-3 py-1 bg-accent text-white rounded"
                        >Créer</button>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                    <input
                        type="text"
                        placeholder="Nom ou téléphone…"
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-surface border border-default rounded text-sm text-primary"
                    />
                </div>
                {SEGMENTS.map(s => (
                    <button
                        key={s}
                        onClick={() => setSeg(s)}
                        className={`px-3 py-1 text-xs rounded-full border ${
                            seg === s
                                ? 'bg-accent/10 border-accent text-primary'
                                : 'bg-surface border-default text-secondary hover:text-primary'
                        }`}
                    >
                        {s === 'all' ? 'Tous' : s}
                    </button>
                ))}
            </div>

            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
                    {error}
                </div>
            )}

            {/* List */}
            {isLoading ? (
                <div className="h-24 bg-surface animate-pulse rounded" />
            ) : data.length === 0 ? (
                <div className="p-8 text-center text-sm text-secondary bg-surface border border-default rounded">
                    Aucun client
                </div>
            ) : (
                <div className="divide-y divide-default border border-default rounded overflow-hidden">
                    {data.map(c => {
                        const isVip = c.tags.includes('VIP') || c.segment === 'vip';
                        return (
                            <div key={c.id} className="p-3 bg-surface flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                    isVip ? 'bg-yellow-500/20 text-yellow-400' : 'bg-surface-elevated text-secondary'
                                }`}>
                                    {c.firstName[0]}{c.lastName[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-primary truncate">
                                        {c.firstName} {c.lastName}
                                        {isVip && <Star className="inline w-3 h-3 ml-2 text-yellow-400 fill-yellow-400" />}
                                    </p>
                                    <p className="text-xs text-secondary">
                                        {c.phone} · {c.visitCount} visite{c.visitCount > 1 ? 's' : ''}
                                    </p>
                                </div>
                                <div className="flex gap-1">
                                    {c.tags.map(tag => (
                                        <span
                                            key={tag}
                                            className="text-nano px-1.5 py-0.5 bg-accent/10 border border-accent/20 rounded text-primary flex items-center gap-1"
                                        >
                                            {tag}
                                            <button onClick={() => void removeTag(c.id, tag)} className="hover:text-red-400">
                                                <X className="w-2.5 h-2.5" />
                                            </button>
                                        </span>
                                    ))}
                                    {!c.tags.includes('VIP') && (
                                        <button
                                            onClick={() => void addTag(c.id, 'VIP')}
                                            className="text-nano px-1.5 py-0.5 bg-surface-elevated border border-default rounded text-secondary hover:text-yellow-400"
                                        >+ VIP</button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
