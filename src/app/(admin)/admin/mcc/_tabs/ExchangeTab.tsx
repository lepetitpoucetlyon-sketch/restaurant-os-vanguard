'use client';

import { ArrowLeftRight, Key, Webhook, Globe, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const EXCHANGE_CATEGORIES = [
    {
        title: 'API REST Tenants',
        description: 'Clés API par tenant pour intégrations tierces (caisse, ERP, marketplace)',
        status: 'partiel',
        icon: Key,
        detail: 'Génération de clés implémentée — rotation et révocation à câbler',
    },
    {
        title: 'Webhooks Sortants',
        description: 'Events métier poussés vers systèmes externes (commande, paiement, stock)',
        status: 'en_attente',
        icon: Webhook,
        detail: 'NexusEventBus livré — adaptateur webhook outbound manquant',
    },
    {
        title: 'Connecteurs Fournisseurs',
        description: 'EDI Metro, Pomona, email-PDF — réception livraisons et catalogues',
        status: 'partiel',
        icon: Globe,
        detail: 'Providers Email+Metro+Pomona livrés — activation par tenant à configurer',
    },
];

const STATUS_CONFIG = {
    ok: { label: 'Opérationnel', cls: 'bg-status-success/10 text-status-success border-status-success/20', icon: CheckCircle },
    partiel: { label: 'Partiel', cls: 'bg-status-warning/10 text-status-warning border-status-warning/20', icon: Clock },
    en_attente: { label: 'En attente', cls: 'bg-border/40 text-secondary border-border', icon: AlertCircle },
} as const;

export function ExchangeTab() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight uppercase">Exchange</h2>
                    <p className="text-sm text-secondary mt-1">
                        Supervision des flux de données inter-systèmes — APIs, webhooks, connecteurs fournisseurs
                    </p>
                </div>
                <ArrowLeftRight className="w-6 h-6 text-brand" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {EXCHANGE_CATEGORIES.map(cat => {
                    const s = STATUS_CONFIG[cat.status as keyof typeof STATUS_CONFIG];
                    const StatusIcon = s.icon;
                    return (
                        <div key={cat.title} className="bg-surface-card border border-border-subtle rounded-2xl p-5 space-y-4">
                            <div className="flex items-start justify-between gap-2">
                                <cat.icon className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                                <span className={`px-2 py-0.5 text-xs font-black uppercase tracking-widest border rounded-lg flex items-center gap-1 ${s.cls}`}>
                                    <StatusIcon className="w-3 h-3" />
                                    {s.label}
                                </span>
                            </div>
                            <div>
                                <p className="font-bold text-sm mb-1">{cat.title}</p>
                                <p className="text-xs text-secondary leading-relaxed">{cat.description}</p>
                            </div>
                            <p className="text-xs text-secondary italic border-t border-border-subtle pt-3">{cat.detail}</p>
                        </div>
                    );
                })}
            </div>

            <div className="bg-surface-card border border-border-subtle rounded-2xl p-6 space-y-4">
                <h3 className="font-bold uppercase tracking-widest text-sm">Flux flotte</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-bg-tertiary text-secondary">
                            <tr>
                                <th className="px-4 py-2 text-left font-medium">Canal</th>
                                <th className="px-4 py-2 text-left font-medium">Direction</th>
                                <th className="px-4 py-2 text-left font-medium">Volume 30j</th>
                                <th className="px-4 py-2 text-left font-medium">Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { canal: 'API REST', dir: 'Sortant', volume: '—', status: 'partiel' },
                                { canal: 'Webhooks', dir: 'Sortant', volume: '—', status: 'en_attente' },
                                { canal: 'EDI Fournisseurs', dir: 'Entrant', volume: '—', status: 'partiel' },
                                { canal: 'E-Facture', dir: 'Bidirectionnel', volume: '—', status: 'en_attente' },
                            ].map(row => {
                                const s = STATUS_CONFIG[row.status as keyof typeof STATUS_CONFIG];
                                return (
                                    <tr key={row.canal} className="border-t border-border-subtle/50">
                                        <td className="px-4 py-2 font-medium">{row.canal}</td>
                                        <td className="px-4 py-2 text-secondary">{row.dir}</td>
                                        <td className="px-4 py-2 tabular-nums">{row.volume}</td>
                                        <td className="px-4 py-2">
                                            <span className={`px-2 py-0.5 text-xs font-bold rounded-lg border ${s.cls}`}>{s.label}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <p className="text-xs text-secondary italic">Les volumes réels seront disponibles après activation des connecteurs par tenant.</p>
            </div>
        </div>
    );
}
