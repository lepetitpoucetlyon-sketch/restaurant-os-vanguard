'use client';

import { Layers, AlertTriangle, Package } from 'lucide-react';

const VERTICAL_STUBS = [
    { vertical: 'bakery', module: 'PreorderManagement', label: 'Précommandes', pilier: 'commerce' },
    { vertical: 'bakery', module: 'AllergenRegistry', label: 'Registre allergènes INCO', pilier: 'compliance' },
    { vertical: 'bakery', module: 'BatchProductionDashboard', label: 'Production par fournées', pilier: 'ops' },
    { vertical: 'bakery', module: 'DisplayStockPage', label: 'Stock vitrine', pilier: 'logistics' },
    { vertical: 'salon', module: 'AppointmentCalendar', label: 'Agenda RDV', pilier: 'commerce' },
    { vertical: 'salon', module: 'StylistDashboard', label: 'Tableau de bord stylistes', pilier: 'human' },
    { vertical: 'salon', module: 'CabinStockPage', label: 'Stock cabine', pilier: 'logistics' },
    { vertical: 'retail', module: 'CatalogPage', label: 'Catalogue produits', pilier: 'commerce' },
    { vertical: 'retail', module: 'PromotionsPage', label: 'Promotions', pilier: 'commerce' },
    { vertical: 'retail', module: 'ReturnsPage', label: 'Gestion des retours', pilier: 'ops' },
    { vertical: 'retail', module: 'RetailPOSPage', label: 'Caisse Retail', pilier: 'ops' },
    { vertical: 'retail', module: 'RetailStockPage', label: 'Stock Retail', pilier: 'logistics' },
    { vertical: 'hotel', module: 'YieldManagementPage', label: 'Yield Management', pilier: 'commerce' },
    { vertical: 'hotel', module: 'HousekeepingPage', label: 'Housekeeping', pilier: 'ops' },
    { vertical: 'hotel', module: 'CityLedgerPage', label: 'City Ledger', pilier: 'finance' },
] as const;

const EMPTY_MODULES = [
    { vertical: 'clinic', path: 'ops/patient-flow', label: 'Patient Flow', decision: '§D6 — PII/RGPD' },
    { vertical: 'clinic', path: 'ops/bed-management', label: 'Bed Management', decision: '§D6 — PII/RGPD' },
    { vertical: 'clinic', path: 'finance/insurance-billing', label: 'Insurance Billing', decision: '§D6 — PII/RGPD' },
    { vertical: 'garage', path: 'ops/workshop-scheduling', label: 'Workshop Scheduling', decision: 'Aucune' },
    { vertical: 'garage', path: 'finance/warranty-claims', label: 'Warranty Claims', decision: 'Aucune' },
    { vertical: 'garage', path: 'logistics/parts-inventory', label: 'Parts Inventory', decision: 'Aucune' },
    { vertical: 'hotel', path: 'commerce/yield', label: 'Yield Management (core)', decision: 'Aucune' },
    { vertical: 'hotel', path: 'ops/housekeeping', label: 'Housekeeping (core)', decision: 'Aucune' },
    { vertical: 'hotel', path: 'finance/city-ledger', label: 'City Ledger (core)', decision: 'Aucune' },
] as const;

const VERTICAL_COLORS: Record<string, string> = {
    bakery: 'bg-amber-500/10 text-amber-600 border-amber-200',
    salon: 'bg-pink-500/10 text-pink-600 border-pink-200',
    retail: 'bg-blue-500/10 text-blue-600 border-blue-200',
    hotel: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
    clinic: 'bg-red-500/10 text-red-600 border-red-200',
    garage: 'bg-slate-500/10 text-slate-600 border-slate-200',
};

export function VerticalesTab() {
    const byVertical = VERTICAL_STUBS.reduce<Record<string, typeof VERTICAL_STUBS[number][]>>((acc, s) => {
        (acc[s.vertical] ??= []).push(s);
        return acc;
    }, {});

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight uppercase">Verticales</h2>
                    <p className="text-sm text-secondary mt-1">
                        Inventaire des modules SQUELETTE — {VERTICAL_STUBS.length} pages stub · {EMPTY_MODULES.length} modules vides
                    </p>
                </div>
                <Layers className="w-6 h-6 text-brand" />
            </div>

            <div className="bg-status-warning/5 border border-status-warning/20 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-status-warning shrink-0 mt-0.5" />
                <div className="text-sm">
                    <p className="font-bold text-status-warning">Ces modules sont livrés comme squelettes</p>
                    <p className="text-secondary text-xs mt-1">
                        Ils affichent un placeholder <code className="bg-bg-tertiary px-1 rounded">VerticalPageStub</code> ou exportent un module vide.
                        La complétion est bloquée par des décisions humaines (§D3 bar, §D6 clinic, §D7 custom).
                    </p>
                </div>
            </div>

            <section className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
                    <Package className="w-4 h-4" /> Pages VerticalPageStub ({VERTICAL_STUBS.length})
                </h3>
                <div className="space-y-3">
                    {Object.entries(byVertical).map(([vertical, stubs]) => (
                        <div key={vertical} className="bg-surface-card border border-border-subtle rounded-2xl overflow-hidden">
                            <div className={`px-4 py-2 flex items-center gap-2 border-b border-border-subtle/50`}>
                                <span className={`px-2 py-0.5 text-xs font-black uppercase tracking-widest border rounded-lg ${VERTICAL_COLORS[vertical] ?? 'bg-border/40 text-secondary border-border'}`}>
                                    {vertical}
                                </span>
                                <span className="text-xs text-secondary">{stubs.length} page{stubs.length > 1 ? 's' : ''}</span>
                            </div>
                            <table className="w-full text-sm">
                                <tbody>
                                    {stubs.map(s => (
                                        <tr key={s.module} className="border-t border-border-subtle/30 first:border-t-0">
                                            <td className="px-4 py-2 font-mono text-xs text-secondary w-32">{s.pilier}</td>
                                            <td className="px-4 py-2">{s.label}</td>
                                            <td className="px-4 py-2">
                                                <span className="px-2 py-0.5 text-xs font-bold rounded-lg bg-border/40 text-secondary border border-border">
                                                    SQUELETTE
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            </section>

            <section className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
                    <Package className="w-4 h-4" /> Modules index.ts vides ({EMPTY_MODULES.length})
                </h3>
                <div className="rounded-xl border border-border-subtle overflow-hidden bg-surface-card">
                    <table className="w-full text-sm">
                        <thead className="bg-bg-tertiary text-secondary">
                            <tr>
                                <th className="px-4 py-2 text-left font-medium">Vertical</th>
                                <th className="px-4 py-2 text-left font-medium">Chemin</th>
                                <th className="px-4 py-2 text-left font-medium">Bloqué par</th>
                                <th className="px-4 py-2 text-left font-medium">Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {EMPTY_MODULES.map(m => (
                                <tr key={m.path} className="border-t border-border-subtle/50">
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-0.5 text-xs font-black uppercase tracking-widest border rounded-lg ${VERTICAL_COLORS[m.vertical] ?? 'bg-border/40 text-secondary border-border'}`}>
                                            {m.vertical}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 font-mono text-xs text-secondary">{m.path}</td>
                                    <td className="px-4 py-2 text-xs">{m.decision}</td>
                                    <td className="px-4 py-2">
                                        <span className="px-2 py-0.5 text-xs font-bold rounded-lg bg-border/40 text-secondary border border-border">
                                            SQUELETTE
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
