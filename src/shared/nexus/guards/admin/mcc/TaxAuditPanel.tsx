'use client';

import React, { useState, useCallback } from 'react';
import { FileText, ShieldCheck, AlertTriangle, Download, Search, ChevronDown, Lock } from 'lucide-react';
import { useNexusFleet } from '@/modules/intelligence/fleet/NexusFleetProvider';
import { useAuth } from '@/shared/providers/NexusCoreProvider';

interface JournalEntry {
    id: string;
    date: string;
    label: string;
    amountInMicrounits: number;
    type: string;
    pcgAccount: string;
    pcgLabel: string;
    source: string;
    createdAt: string;
}

interface FiscalSeal {
    id: string;
    hash: string;
    previousHash: string;
    timestamp: string;
    sequence: number;
}

interface AuditResult {
    tenant: { id: string; name: string; fiscalKeyConfigured: boolean; dataRegion: string };
    period: { from: string | null; to: string | null };
    journalEntries: JournalEntry[];
    fiscalSeals: FiscalSeal[];
    stats: { totalEntries: number; totalSeals: number; totalCreditMu: number; totalDebitMu: number };
    chainStatus: 'ok' | 'breach' | 'empty';
}

/** Convertit des microunits en euros pour l'affichage */
function muToEur(mu: number): string {
    return (mu / 1_000_000).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

export function TaxAuditPanel() {
    const { instances } = useNexusFleet();
    const { currentUser } = useAuth();
    const [selectedTenantId, setSelectedTenantId] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [result, setResult] = useState<AuditResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAudit = useCallback(async () => {
        if (!selectedTenantId) return;
        setLoading(true);
        setError(null);
        try {
            const token = await (currentUser as { getIdToken?: () => Promise<string> })?.getIdToken?.();
            const params = new URLSearchParams({ tenantId: selectedTenantId });
            if (from) params.set('from', from);
            if (to)   params.set('to', to);

            const res = await fetch(`/api/admin/compliance/fiscal-tenant-audit?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur serveur');
            setResult(await res.json());
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erreur inconnue');
        } finally {
            setLoading(false);
        }
    }, [selectedTenantId, from, to, currentUser]);

    const exportJSON = () => {
        if (!result) return;
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-fiscal-${result.tenant.name}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const chainColor = result?.chainStatus === 'ok'
        ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5'
        : result?.chainStatus === 'breach'
        ? 'text-red-400 border-red-500/20 bg-red-500/5'
        : 'text-slate-400 border-white/10 bg-white/5';

    return (
        <div className="bg-[#161618] border border-white/5 rounded-3xl p-6 space-y-6">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-500/10 rounded-xl">
                        <FileText className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Audit Fiscal Contrôle</h3>
                        <p className="text-[10px] text-slate-500">Journaux NF525 par restaurant — données pour l'administration fiscale</p>
                    </div>
                </div>
                {result && (
                    <button
                        onClick={exportJSON}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-lg text-[10px] font-bold text-violet-400 hover:bg-violet-500/20 transition-all uppercase tracking-widest"
                    >
                        <Download className="w-3 h-3" />
                        Export JSON
                    </button>
                )}
            </div>

            {/* Formulaire de sélection */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2 relative">
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                    <select
                        value={selectedTenantId}
                        onChange={e => setSelectedTenantId(e.target.value)}
                        className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white appearance-none focus:outline-none focus:border-violet-500/50"
                    >
                        <option value="">Sélectionner un restaurant…</option>
                        {instances.map(inst => (
                            <option key={inst.id} value={inst.id}>
                                {inst.name ?? inst.id}
                            </option>
                        ))}
                    </select>
                </div>

                <input
                    type="date"
                    value={from}
                    onChange={e => setFrom(e.target.value)}
                    placeholder="De"
                    className="bg-[#0a0a0b] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500/50"
                />
                <input
                    type="date"
                    value={to}
                    onChange={e => setTo(e.target.value)}
                    placeholder="À"
                    className="bg-[#0a0a0b] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500/50"
                />
            </div>

            <button
                onClick={fetchAudit}
                disabled={!selectedTenantId || loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
            >
                <Search className="w-3.5 h-3.5" />
                {loading ? 'Chargement…' : 'Lancer l\'audit'}
            </button>

            {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            {/* Résultats */}
            {result && (
                <div className="space-y-5">
                    {/* Badges récap */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <StatBadge label="Entrées journal" value={result.stats.totalEntries.toString()} />
                        <StatBadge label="Sceaux NF525" value={result.stats.totalSeals.toString()} />
                        <StatBadge label="Total crédit" value={muToEur(result.stats.totalCreditMu)} />
                        <StatBadge label="Total débit" value={muToEur(result.stats.totalDebitMu)} />
                    </div>

                    {/* Statut chaîne + clé */}
                    <div className="flex flex-wrap gap-3">
                        <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[10px] font-bold uppercase tracking-widest ${chainColor}`}>
                            {result.chainStatus === 'ok' && <ShieldCheck className="w-3.5 h-3.5" />}
                            {result.chainStatus === 'breach' && <AlertTriangle className="w-3.5 h-3.5" />}
                            {result.chainStatus === 'empty' && <Lock className="w-3.5 h-3.5" />}
                            Chaîne : {result.chainStatus === 'ok' ? 'Intègre' : result.chainStatus === 'breach' ? 'RUPTURE DÉTECTÉE' : 'Vide'}
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[10px] font-bold uppercase tracking-widest ${result.tenant.fiscalKeyConfigured ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' : 'text-red-400 border-red-500/20 bg-red-500/5'}`}>
                            <Lock className="w-3.5 h-3.5" />
                            Clé fiscale : {result.tenant.fiscalKeyConfigured ? 'Configurée' : 'MANQUANTE'}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 border border-white/10 bg-white/5 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Région : {result.tenant.dataRegion}
                        </div>
                    </div>

                    {/* Tableau journalEntries */}
                    {result.journalEntries.length > 0 && (
                        <div className="overflow-x-auto rounded-2xl border border-white/5">
                            <table className="w-full text-[10px] text-slate-300">
                                <thead>
                                    <tr className="border-b border-white/5 text-slate-500 uppercase tracking-widest">
                                        <th className="px-4 py-3 text-left">Date</th>
                                        <th className="px-4 py-3 text-left">Libellé</th>
                                        <th className="px-4 py-3 text-left">Compte PCG</th>
                                        <th className="px-4 py-3 text-right font-variant-numeric tabular-nums">Montant</th>
                                        <th className="px-4 py-3 text-left">Source</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {result.journalEntries.slice(0, 200).map(je => (
                                        <tr key={je.id} className="hover:bg-white/3 transition-colors">
                                            <td className="px-4 py-2.5 font-mono">{je.date?.slice(0, 10)}</td>
                                            <td className="px-4 py-2.5 max-w-[200px] truncate">{je.label}</td>
                                            <td className="px-4 py-2.5 font-mono text-violet-400">{je.pcgAccount} – {je.pcgLabel}</td>
                                            <td className={`px-4 py-2.5 text-right font-mono tabular-nums ${je.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {je.type === 'debit' ? '–' : '+'}{muToEur(Math.abs(je.amountInMicrounits))}
                                            </td>
                                            <td className="px-4 py-2.5 text-slate-500">{je.source}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {result.journalEntries.length > 200 && (
                                <p className="text-center text-[10px] text-slate-500 py-3">
                                    + {result.journalEntries.length - 200} lignes supplémentaires dans l'export JSON
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function StatBadge({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-[#0a0a0b] border border-white/5 rounded-xl p-3">
            <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">{label}</p>
            <p className="text-sm font-bold text-white tabular-nums">{value}</p>
        </div>
    );
}
