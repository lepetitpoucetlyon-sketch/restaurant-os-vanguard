"use client";

import { useState, useEffect } from "react";
import { useAuth, useTenant } from "@/shared/providers/NexusCoreProvider";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { cn } from "@/lib/ui.foundations";
import {
    Calendar, Clock, Gift, FileText, GraduationCap,
    CreditCard, User,
} from "lucide-react";
import { TipDistributionService } from "@/modules/human/hr/services/tipDistribution";

type Tab = 'planning' | 'pointage' | 'conges' | 'pourboires' | 'bulletin' | 'formations';

const TABS: { id: Tab; label: string; icon: typeof Calendar }[] = [
    { id: 'planning', label: 'Planning', icon: Calendar },
    { id: 'pointage', label: 'Pointage', icon: Clock },
    { id: 'conges', label: 'Congés', icon: Gift },
    { id: 'pourboires', label: 'Pourboires', icon: CreditCard },
    { id: 'bulletin', label: 'Bulletin', icon: FileText },
    { id: 'formations', label: 'Formations', icon: GraduationCap },
];

export default function MonEspacePage() {
    const { currentUser } = useAuth();
    const { activeTenantId } = useTenant();
    const [activeTab, setActiveTab] = useState<Tab>('planning');
    const [shifts, setShifts] = useState<Array<{ date: string; startTime: string; endTime: string; role: string }>>([]);
    const [leaves, setLeaves] = useState<Array<{ id: string; type: string; startDate: string; endDate: string; status: string }>>([]);
    const [tipShares, setTipShares] = useState<Array<{ periode: string; amountEur: number }>>([]);

    useEffect(() => {
        if (!activeTenantId || !currentUser?.id) return;

        Nexus.adapter.query<{ userId: string; date: string; startTime: string; endTime: string; role: string }>(
            `tenants/${activeTenantId}/shifts`,
            { where: [{ field: 'userId', operator: '==', value: currentUser.id }] }
        ).then(setShifts).catch(() => {});

        Nexus.adapter.query<{ id: string; userId: string; type: string; startDate: string; endDate: string; status: string }>(
            `tenants/${activeTenantId}/leaveRequests`,
            { where: [{ field: 'userId', operator: '==', value: currentUser.id }] }
        ).then(setLeaves).catch(() => {});

        const now = new Date();
        const periode = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        TipDistributionService.getByPeriode(activeTenantId, periode).then(pools => {
            const shares = pools
                .flatMap(p => p.shares)
                .filter(s => s.userId === currentUser!.id)
                .map(s => ({ periode, amountEur: s.amountInMicrounits / 1_000_000 }));
            setTipShares(shares);
        }).catch(() => {});
    }, [activeTenantId, currentUser?.id]);

    if (!currentUser) {
        return <div className="flex items-center justify-center h-full text-zinc-400">Chargement...</div>;
    }

    return (
        <div className="flex flex-col h-full bg-zinc-950">
            <header className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                    <User className="w-5 h-5 text-zinc-400" />
                </div>
                <div>
                    <h1 className="text-lg font-semibold text-white">{currentUser.name ?? 'Mon espace'}</h1>
                    <p className="text-sm text-zinc-400">{(currentUser as unknown as Record<string, string>).role ?? 'Employé'}</p>
                </div>
            </header>

            <nav className="border-b border-zinc-800 px-2 flex gap-1 overflow-x-auto" role="tablist" aria-label="Sections">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors",
                            activeTab === tab.id
                                ? "border-blue-500 text-white"
                                : "border-transparent text-zinc-400 hover:text-zinc-200"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </nav>

            <div className="flex-1 overflow-y-auto p-6" role="tabpanel" aria-label={TABS.find(t => t.id === activeTab)?.label}>
                {activeTab === 'planning' && (
                    <div className="space-y-3">
                        <h2 className="text-white font-medium mb-4">Mes prochains shifts</h2>
                        {shifts.length === 0 && <p className="text-zinc-500">Aucun shift planifié</p>}
                        {shifts.slice(0, 14).map((s, i) => (
                            <div key={i} className="flex items-center justify-between bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                                <div>
                                    <p className="text-white font-medium">{s.date}</p>
                                    <p className="text-zinc-400 text-sm">{s.role}</p>
                                </div>
                                <p className="text-zinc-300">{s.startTime} — {s.endTime}</p>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'pointage' && (
                    <div className="text-zinc-400">
                        <h2 className="text-white font-medium mb-4">Historique de pointage</h2>
                        <p className="text-sm">Consultez votre historique de pointage dans la section Planning.</p>
                    </div>
                )}

                {activeTab === 'conges' && (
                    <div className="space-y-3">
                        <h2 className="text-white font-medium mb-4">Mes demandes de congés</h2>
                        {leaves.length === 0 && <p className="text-zinc-500">Aucune demande</p>}
                        {leaves.map(l => (
                            <div key={l.id} className="flex items-center justify-between bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                                <div>
                                    <p className="text-white">{l.type === 'paid_leave' ? 'Congé payé' : l.type}</p>
                                    <p className="text-zinc-400 text-sm">{l.startDate} → {l.endDate}</p>
                                </div>
                                <span className={cn(
                                    "px-2 py-1 rounded text-xs",
                                    l.status === 'approved' ? "bg-green-500/20 text-green-400" :
                                    l.status === 'rejected' ? "bg-red-500/20 text-red-400" :
                                    "bg-amber-500/20 text-amber-400"
                                )}>
                                    {l.status === 'approved' ? 'Approuvé' : l.status === 'rejected' ? 'Refusé' : 'En attente'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'pourboires' && (
                    <div className="space-y-3">
                        <h2 className="text-white font-medium mb-4">Mes pourboires</h2>
                        {tipShares.length === 0 && <p className="text-zinc-500">Aucun pourboire ce mois</p>}
                        {tipShares.map((t, i) => (
                            <div key={i} className="flex items-center justify-between bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                                <p className="text-white">{t.periode}</p>
                                <p className="text-emerald-400 font-medium">{t.amountEur.toFixed(2)} €</p>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'bulletin' && (
                    <div className="text-zinc-400">
                        <h2 className="text-white font-medium mb-4">Bulletins de paie</h2>
                        <p className="text-sm">Les bulletins scellés sont accessibles en lecture seule. L'estimation pré-paie est disponible en fin de mois.</p>
                        <p className="text-xs text-zinc-500 mt-2">Intégration Silae/PayFit requise pour les bulletins définitifs.</p>
                    </div>
                )}

                {activeTab === 'formations' && (
                    <div className="text-zinc-400">
                        <h2 className="text-white font-medium mb-4">Mes formations</h2>
                        <p className="text-sm">Certifications HACCP, formations internes et diplômes disponibles depuis la section Documents.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
