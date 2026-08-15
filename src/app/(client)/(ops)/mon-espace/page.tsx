"use client";

import { useState, useEffect } from "react";
import { useAuth, useTenant } from "@/kernel/providers/NexusCoreProvider";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { cn } from "@/lib/ui.foundations";
import {
    Calendar, Clock, Gift, FileText, GraduationCap,
    CreditCard, User,
} from "lucide-react";
import { TipDistributionService } from "@/modules/human";
import { withPageGuard } from "@design/rbac/PageGuard";
import dynamic from "next/dynamic";

const StaffPortal = dynamic(
  () => import('@/modules/human/effectifs/hr/components/StaffPortal').then(m => ({ default: m.StaffPortal })),
  { loading: () => <p className="p-6 text-text-muted italic text-sm">Chargement du portail…</p> }
);

type Tab = 'planning' | 'pointage' | 'conges' | 'pourboires' | 'bulletin' | 'formations';

const TABS: { id: Tab; label: string; icon: typeof Calendar }[] = [
    { id: 'planning', label: 'Planning', icon: Calendar },
    { id: 'pointage', label: 'Pointage', icon: Clock },
    { id: 'conges', label: 'Congés', icon: Gift },
    { id: 'pourboires', label: 'Pourboires', icon: CreditCard },
    { id: 'bulletin', label: 'Bulletin', icon: FileText },
    { id: 'formations', label: 'Formations', icon: GraduationCap },
];

function MonEspacePage() {
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
                .filter(s => s.userId === currentUser?.id)
                .map(s => ({ periode, amountEur: s.amountInMicrounits / 1_000_000 }));
            setTipShares(shares);
        }).catch(() => {});
    }, [activeTenantId, currentUser?.id]);

    if (!currentUser) {
        return <div className="flex items-center justify-center h-full text-text-secondary">Chargement...</div>;
    }

    return (
        <div className="flex flex-col h-full bg-surface-bg">
            <header className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-card flex items-center justify-center">
                    <User className="w-5 h-5 text-text-secondary" />
                </div>
                <div>
                    <h1 className="text-lg font-semibold text-text-primary">{currentUser.name ?? 'Mon espace'}</h1>
                    <p className="text-sm text-text-secondary">{(currentUser as unknown as Record<string, string>).role ?? 'Employé'}</p>
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
                                ? "border-blue-500 text-text-primary"
                                : "border-transparent text-text-secondary hover:text-zinc-200"
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
                        <h2 className="text-text-primary font-medium mb-4">Mes prochains shifts</h2>
                        {shifts.length === 0 && <p className="text-text-muted">Aucun shift planifié</p>}
                        {shifts.slice(0, 14).map((s, i) => (
                            <div key={i} className="flex items-center justify-between bg-surface-bg rounded-lg p-4 border border-zinc-800">
                                <div>
                                    <p className="text-text-primary font-medium">{s.date}</p>
                                    <p className="text-text-secondary text-sm">{s.role}</p>
                                </div>
                                <p className="text-text-secondary">{s.startTime} — {s.endTime}</p>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'pointage' && (
                    <div className="text-text-secondary">
                        <h2 className="text-text-primary font-medium mb-4">Historique de pointage</h2>
                        <p className="text-sm">Consultez votre historique de pointage dans la section Planning.</p>
                    </div>
                )}

                {activeTab === 'conges' && (
                    <div className="space-y-3">
                        <h2 className="text-text-primary font-medium mb-4">Mes demandes de congés</h2>
                        {leaves.length === 0 && <p className="text-text-muted">Aucune demande</p>}
                        {leaves.map(l => (
                            <div key={l.id} className="flex items-center justify-between bg-surface-bg rounded-lg p-4 border border-zinc-800">
                                <div>
                                    <p className="text-text-primary">{l.type === 'paid_leave' ? 'Congé payé' : l.type}</p>
                                    <p className="text-text-secondary text-sm">{l.startDate} → {l.endDate}</p>
                                </div>
                                <span className={cn(
                                    "px-2 py-1 rounded text-xs",
                                    l.status === 'approved' ? "bg-status-success/20 text-green-400" :
                                    l.status === 'rejected' ? "bg-status-danger/20 text-status-danger" :
                                    "bg-action-primary/20 text-action-primary"
                                )}>
                                    {l.status === 'approved' ? 'Approuvé' : l.status === 'rejected' ? 'Refusé' : 'En attente'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'pourboires' && (
                    <div className="space-y-3">
                        <h2 className="text-text-primary font-medium mb-4">Mes pourboires</h2>
                        {tipShares.length === 0 && <p className="text-text-muted">Aucun pourboire ce mois</p>}
                        {tipShares.map((t, i) => (
                            <div key={i} className="flex items-center justify-between bg-surface-bg rounded-lg p-4 border border-zinc-800">
                                <p className="text-text-primary">{t.periode}</p>
                                <p className="text-status-success font-medium">{t.amountEur.toFixed(2)} €</p>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'bulletin' && currentUser && (
                    <StaffPortal employeeId={currentUser.id} tenantId={activeTenantId ?? ''} />
                )}

                {activeTab === 'formations' && (
                    <div className="text-text-secondary">
                        <h2 className="text-text-primary font-medium mb-4">Mes formations</h2>
                        <p className="text-sm">Certifications HACCP, formations internes et diplômes disponibles depuis la section Documents.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default withPageGuard(MonEspacePage, "mon_espace");
