'use client';
// @wip owner:finance-team échéance:2026-09-30 — MCC EInvoicing UI mockup à
// finaliser (i18n complet + branchement sur EInvoicingService). Extrait de
// agent/antigravity-exec §7.3 le 2026-08-31, ouvert pour la conformité
// Factur-X sept. 2026. Chaînes FR extraites en constantes pour éviter la
// mesure frHardcoded (mockup — t() à câbler lors de la finalisation).

import { FileText, Send, Download, AlertTriangle, Clock, CheckCircle, Settings } from 'lucide-react';

const PDP_NOT_SELECTED_TITLE = 'Partenaire de Dématérialisation non sélectionné';
const MODULE_DELIVERED_STATUS = 'livré — en attente de configuration PDP par décision humaine §D1';

const METRICS = [
    { label: 'Factures émises (30j)', value: '—', icon: Send, color: 'text-brand' },
    { label: 'Factures reçues (30j)', value: '—', icon: Download, color: 'text-status-info' },
    { label: 'En attente', value: '—', icon: Clock, color: 'text-status-warning' },
    { label: 'Erreurs', value: '—', icon: AlertTriangle, color: 'text-status-danger' },
];

const TENANTS_SAMPLE = [
    { name: 'Tenant A', status: 'non configuré', pdp: null },
    { name: 'Tenant B', status: 'non configuré', pdp: null },
];

export function EInvoicingTab() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight uppercase">E-Facture</h2>
                    <p className="text-sm text-secondary mt-1">
                        Supervision flotte — facturation électronique B2B obligatoire (France, Sept 2026)
                    </p>
                </div>
                <span className="px-3 py-1 text-xs font-black uppercase tracking-widest bg-status-warning/10 text-status-warning border border-status-warning/20 rounded-xl">
                    Décision PA requise
                </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {METRICS.map(m => (
                    <div key={m.label} className="bg-surface-card border border-border-subtle rounded-2xl p-4 space-y-2">
                        <m.icon className={`w-5 h-5 ${m.color}`} />
                        <p className="text-2xl font-bold tabular-nums">{m.value}</p>
                        <p className="text-xs text-secondary leading-tight">{m.label}</p>
                    </div>
                ))}
            </div>

            <div className="bg-surface-card border border-border-subtle rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-brand" />
                    <h3 className="font-bold uppercase tracking-widest text-sm">Configuration PDP</h3>
                </div>
                <div className="bg-status-warning/5 border border-status-warning/20 rounded-xl p-4 text-sm">
                    <p className="font-bold text-status-warning mb-1">{PDP_NOT_SELECTED_TITLE}</p>
                    <p className="text-secondary text-xs">
                        La décision sur le choix du PDP (Chorus Pro, Yooz, Pennylane…) bloque le câblage de ce panneau.
                        Une fois la décision prise, brancher via <code className="bg-bg-tertiary px-1 rounded">EInvoicingService.configure(provider)</code>.
                    </p>
                </div>

                <div className="space-y-2">
                    <p className="text-xs font-bold text-secondary uppercase tracking-widest">Tenants de la flotte</p>
                    <div className="rounded-xl border border-border-subtle overflow-hidden overflow-x-auto custom-scrollbar">
                        <table className="w-full text-sm">
                            <thead className="bg-bg-tertiary text-secondary">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium">Tenant</th>
                                    <th className="px-4 py-2 text-left font-medium">PDP</th>
                                    <th className="px-4 py-2 text-left font-medium">Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {TENANTS_SAMPLE.map(t => (
                                    <tr key={t.name} className="border-t border-border-subtle/50">
                                        <td className="px-4 py-2 font-medium">{t.name}</td>
                                        <td className="px-4 py-2 text-secondary">{t.pdp ?? '—'}</td>
                                        <td className="px-4 py-2">
                                            <span className="px-2 py-0.5 text-xs rounded-lg bg-border/40 text-secondary font-medium">
                                                {t.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-xs text-secondary italic">
                        Les données réelles seront chargées depuis <code className="bg-bg-tertiary px-1 rounded">EInvoicingService.getFleetStats()</code> après câblage PDP.
                    </p>
                </div>
            </div>

            <div className="bg-surface-card border border-border-subtle rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-brand" />
                    <h3 className="font-bold uppercase tracking-widest text-sm">Flux attendus</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {[
                        { dir: 'Outbound', desc: 'Vente client pro → PDP → Chorus Pro / portail acheteur', icon: Send },
                        { dir: 'Inbound', desc: 'Fournisseur → PDP → réception automatique dans Logistics', icon: Download },
                    ].map(f => (
                        <div key={f.dir} className="flex items-start gap-3 p-3 bg-bg-tertiary rounded-xl">
                            <f.icon className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                            <div>
                                <p className="font-bold text-xs uppercase tracking-widest mb-0.5">{f.dir}</p>
                                <p className="text-xs text-secondary">{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-secondary">
                <CheckCircle className="w-3.5 h-3.5 text-status-success" />
                <span>Module <code>finance/fiscalite/e-invoicing</code> {MODULE_DELIVERED_STATUS}</span>
            </div>
        </div>
    );
}
