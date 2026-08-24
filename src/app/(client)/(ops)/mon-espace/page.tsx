"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth, useTenant } from "@/shared/providers/NexusCoreProvider";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { cn } from "@/lib/ui.foundations";
import {
    Calendar, Clock, Gift, FileText, GraduationCap,
    CreditCard, User, ShieldCheck, Download, Lock, CheckCircle2,
    FileCheck, ExternalLink, Fingerprint
} from "lucide-react";
import { TipDistributionService, DigitalEmployeeVault, type EmployeeDocument } from "@/modules/human";
import { withPageGuard } from "@/shared/components/rbac/PageGuard";
import { PasskeyStepUpModal } from "@/shared/components/biometrics/PasskeyStepUpModal";
import { useToast } from "@ui/Toast";
import { PageShell } from "@/shared/components/ui/PageShell";

type Tab = 'planning' | 'pointage' | 'conges' | 'pourboires' | 'coffre' | 'formations';

const TABS: { id: Tab; label: string; icon: typeof Calendar }[] = [
    { id: 'planning', label: 'Planning', icon: Calendar },
    { id: 'pointage', label: 'Pointage', icon: Clock },
    { id: 'conges', label: 'Congés', icon: Gift },
    { id: 'pourboires', label: 'Pourboires', icon: CreditCard },
    { id: 'coffre', label: 'Coffre-fort RH', icon: ShieldCheck },
    { id: 'formations', label: 'Formations', icon: GraduationCap },
];

function MonEspacePage() {
    const { currentUser } = useAuth();
    const { activeTenantId } = useTenant();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<Tab>('planning');
    const [shifts, setShifts] = useState<Array<{ date: string; startTime: string; endTime: string; role: string }>>([]);
    const [leaves, setLeaves] = useState<Array<{ id: string; type: string; startDate: string; endDate: string; status: string }>>([]);
    const [tipShares, setTipShares] = useState<Array<{ periode: string; amountEur: number }>>([]);
    const [vaultDocuments, setVaultDocuments] = useState<EmployeeDocument[]>([]);
    const [isVaultLoading, setIsVaultLoading] = useState(false);
    const [stepUpOpen, setStepUpOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

    const loadVault = useCallback(async () => {
        if (!activeTenantId || !currentUser?.id) return;
        setIsVaultLoading(true);
        try {
            const docs = await DigitalEmployeeVault.listEmployeeVault(activeTenantId, currentUser.id);
            setVaultDocuments(docs);
        } catch {
            showToast('Erreur chargement coffre-fort', 'error');
        } finally {
            setIsVaultLoading(false);
        }
    }, [activeTenantId, currentUser?.id, showToast]);

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

        if (activeTab === 'coffre') {
            void loadVault();
        }
    }, [activeTenantId, currentUser?.id, activeTab, loadVault]);

    if (!currentUser) {
        return <div className="flex items-center justify-center h-full text-text-secondary">Chargement...</div>;
    }

    const userRole = (currentUser as unknown as Record<string, string>).role ?? 'Employé';

    return (
        <PageShell
            kicker="Humain"
            title={currentUser.name ?? 'Mon espace'}
            subtitle={`Mes shifts, congés, pourboires, coffre-fort et formations — ${userRole}.`}
            icon={User}
            breadcrumbs={[{ label: 'Opérations' }, { label: 'Mon espace' }]}
            tabs={
                <>
                    {TABS.map(tab => (
                        <PageShell.Tab
                            key={tab.id}
                            active={activeTab === tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            icon={tab.icon}
                        >
                            {tab.label}
                        </PageShell.Tab>
                    ))}
                </>
            }
        >
            <div role="tabpanel" aria-label={TABS.find(t => t.id === activeTab)?.label}>
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

                {activeTab === 'coffre' && (
                    <div className="space-y-6">
                        <div className="flex items-start justify-between flex-wrap gap-4 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                            <div>
                                <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                                    Coffre-Fort Numérique Personnel (Art. L3243-2)
                                </h2>
                                <p className="text-xs text-text-muted mt-1 max-w-xl">
                                    Vos bulletins de paie, contrats et attestations sont certifiés conformes et scellés par empreinte cryptographique SHA-256. Vous conservez un accès direct et permanent à vos documents, même après la fin de votre contrat.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setPendingAction(() => async () => {
                                        if (!activeTenantId || !currentUser?.id) return;
                                        const manifest = await DigitalEmployeeVault.generateVaultArchiveManifest(activeTenantId, currentUser.id);
                                        const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `archive-coffre-fort-${currentUser.id}.json`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(url);
                                        showToast('Archive certifiée du coffre-fort téléchargée', 'success');
                                    });
                                    setStepUpOpen(true);
                                }}
                                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-amber-500/10 active:scale-98"
                            >
                                <Download className="w-4 h-4" />
                                Télécharger l&apos;archive complète (ZIP/JSON)
                            </button>
                        </div>

                        {isVaultLoading ? (
                            <div className="py-12 text-center text-xs text-text-muted">
                                Chargement des documents scellés...
                            </div>
                        ) : vaultDocuments.length === 0 ? (
                            <div className="py-12 text-center border border-dashed border-zinc-800 rounded-2xl space-y-2">
                                <FileCheck className="w-8 h-8 text-text-muted mx-auto opacity-40" />
                                <p className="text-sm font-semibold text-text-primary">Aucun document dans votre coffre</p>
                                <p className="text-xs text-text-muted max-w-sm mx-auto">
                                    Vos prochains bulletins de paie et avenants scellés apparaîtront automatiquement ici dès leur émission par la direction.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {vaultDocuments.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="p-4 rounded-xl bg-surface-bg border border-zinc-800 hover:border-zinc-700 transition-all flex items-center justify-between flex-wrap gap-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-lg bg-white/5 border border-zinc-700 text-amber-400">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-text-primary">{doc.name}</h4>
                                                <div className="flex items-center gap-2 text-[11px] text-text-muted mt-0.5">
                                                    <span>{doc.type === 'payslip' ? 'Bulletin de salaire' : doc.type === 'contract' ? 'Contrat de travail' : doc.type}</span>
                                                    <span>•</span>
                                                    <span>Émis le {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {doc.sha256Hash && (
                                                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono flex items-center gap-1.5" title={`Empreinte SHA256 : ${doc.sha256Hash}`}>
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Scellé SHA-256
                                                </span>
                                            )}
                                            {doc.url && (
                                                <a
                                                    href={doc.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-lg border border-zinc-700 hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors"
                                                    title="Visualiser le document"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'formations' && (
                    <div className="text-text-secondary">
                        <h2 className="text-text-primary font-medium mb-4">Mes formations</h2>
                        <p className="text-sm">Certifications HACCP, formations internes et diplômes disponibles depuis la section Documents.</p>
                    </div>
                )}
            </div>

            {/* Modal de Step-Up Biométrique / PIN */}
            <PasskeyStepUpModal
                open={stepUpOpen}
                onClose={() => setStepUpOpen(false)}
                onSuccess={() => {
                    setStepUpOpen(false);
                    if (pendingAction) {
                        pendingAction();
                        setPendingAction(null);
                    }
                }}
                actionTitle="Accès Sécurisé au Coffre-Fort RH"
                actionDescription="Confirmez votre identité par FaceID, TouchID ou code PIN pour exporter vos bulletins et contrats de travail."
                severity="sensitive"
            />
        </PageShell>
    );
}

export default withPageGuard(MonEspacePage, "mon_espace");
