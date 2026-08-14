'use client';

import { ArrowLeftRight, ShieldAlert, Activity, XCircle, Eye, EyeOff } from 'lucide-react';

// MCC voit l'existence du grant, jamais les données échangées (PLAN_MAITRE §MCC)
const GRANT_TYPES = ['API REST', 'Webhook sortant', 'Open Banking', 'E-Facture PDP'] as const;

type GrantStatus = 'actif' | 'suspendu' | 'révoqué';

const MOCK_GRANTS: { tenant: string; type: typeof GRANT_TYPES[number]; status: GrantStatus; volume30j: string }[] = [
    { tenant: '_demo_restaurant', type: 'API REST', status: 'actif', volume30j: '—' },
    { tenant: '_demo_bakery', type: 'E-Facture PDP', status: 'suspendu', volume30j: '—' },
    { tenant: '_ref_restaurant', type: 'Open Banking', status: 'actif', volume30j: '—' },
];

const STATUS_CFG: Record<GrantStatus, { label: string; cls: string }> = {
    actif:    { label: 'Actif',    cls: 'bg-status-success/10 text-status-success border-status-success/20' },
    suspendu: { label: 'Suspendu', cls: 'bg-status-warning/10 text-status-warning border-status-warning/20' },
    révoqué:  { label: 'Révoqué', cls: 'bg-status-danger/10 text-status-danger border-status-danger/20' },
};

export function ExchangeTab() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight uppercase">Exchange — Grants</h2>
                    <p className="text-sm text-secondary mt-1">
                        Grants d&apos;accès API actifs par tenant · révocation d&apos;urgence flotte
                    </p>
                </div>
                <ArrowLeftRight className="w-6 h-6 text-brand" />
            </div>

            <div className="bg-surface-card border border-border-subtle rounded-2xl p-4 flex items-start gap-3">
                <EyeOff className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                <p className="text-xs text-secondary">
                    <strong>Principe souverain</strong> — le MCC voit l&apos;existence et le volume d&apos;un grant,
                    jamais les données échangées. La révocation est immédiate et irréversible sans re-autorisation tenant.
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {GRANT_TYPES.map(type => (
                    <div key={type} className="bg-surface-card border border-border-subtle rounded-2xl p-4 space-y-2">
                        <Activity className="w-4 h-4 text-brand" />
                        <p className="text-xs font-bold">{type}</p>
                        <p className="text-2xl font-bold tabular-nums">—</p>
                        <p className="text-xs text-secondary">grants actifs</p>
                    </div>
                ))}
            </div>

            <div className="bg-surface-card border border-border-subtle rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
                    <h3 className="font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                        <Eye className="w-4 h-4 text-brand" /> Grants actifs flotte
                    </h3>
                    <button
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-black uppercase tracking-widest bg-status-danger/10 text-status-danger border border-status-danger/20 rounded-xl hover:bg-status-danger/20 transition-colors"
                        onClick={() => alert('Révocation urgence — à câbler sur api/admin/fleet/exchange/grants [DELETE]')}
                    >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Révocation d&apos;urgence flotte
                    </button>
                </div>
                <table className="w-full text-sm">
                    <thead className="bg-bg-tertiary text-secondary">
                        <tr>
                            <th className="px-4 py-2 text-left font-medium">Tenant</th>
                            <th className="px-4 py-2 text-left font-medium">Type de grant</th>
                            <th className="px-4 py-2 text-left font-medium">Volume 30j</th>
                            <th className="px-4 py-2 text-left font-medium">Statut</th>
                            <th className="px-4 py-2 text-left font-medium">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {MOCK_GRANTS.map((g, i) => {
                            const s = STATUS_CFG[g.status];
                            return (
                                <tr key={i} className="border-t border-border-subtle/50">
                                    <td className="px-4 py-2 font-mono text-xs">{g.tenant}</td>
                                    <td className="px-4 py-2">{g.type}</td>
                                    <td className="px-4 py-2 tabular-nums text-secondary">{g.volume30j}</td>
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded-lg border ${s.cls}`}>{s.label}</span>
                                    </td>
                                    <td className="px-4 py-2">
                                        {g.status === 'actif' && (
                                            <button className="flex items-center gap-1 text-xs text-status-danger hover:underline">
                                                <XCircle className="w-3.5 h-3.5" /> Révoquer
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                <p className="px-6 py-3 text-xs text-secondary italic border-t border-border-subtle/50">
                    Données réelles depuis <code className="bg-bg-tertiary px-1 rounded">api/admin/fleet/exchange/grants</code> — route à créer après décision architecture grants.
                </p>
            </div>
        </div>
    );
}
