"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAtomValue } from "jotai";
import { Users, CalendarRange, Palmtree, UserPlus, Plus, Clock, Euro, GraduationCap, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { User, LeaveRequest, Candidate, UserRole } from "@nexus/contracts";
import {
    PERMISSION_ROLE_LEVELS,
    type PermissionRole,
} from "@nexus/contracts/permissions.types";

import {
    useHumanResources,
    useStaffAudit,
    staffMembersAtom,
    shiftLogsAtom,
} from "@modules/human";
import { BadgeControl } from "@modules/human/hr/components/staff/BadgeControl";
// generatePaySlip intentionnellement désactivé — voir paySlipGenerator.ts
import { useAuth } from "@/hooks";
import {
    StaffList,
    StaffMemberForm,
    StaffRecentActivity,
    LeaveBalanceCard,
    LeaveRequestCard,
    TeamCalendar,
    NewRequestModal,
    PlanningWeekView,
} from "@modules/human/hr/components";
import { RecruitmentBoard } from "@/components/staff/RecruitmentBoard";
import { QuickAddStaffModal } from "@/components/staff/QuickAddStaffModal";
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { pushToUser, pushToRole } from '@/lib/push/pushClient';

type StaffTab = "team" | "planning" | "timesheet" | "leaves" | "recruitment" | "payroll" | "skills";

const TABS: { id: StaffTab; label: string; icon: typeof Users }[] = [
    { id: "team", label: "Équipe", icon: Users },
    { id: "planning", label: "Planning", icon: CalendarRange },
    { id: "timesheet", label: "Pointage", icon: Clock },
    { id: "payroll", label: "Paie", icon: Euro },
    { id: "skills", label: "Compétences", icon: GraduationCap },
    { id: "leaves", label: "Congés & Absences", icon: Palmtree },
    { id: "recruitment", label: "Recrutement", icon: UserPlus },
];

// ── Payroll helpers ────────────────────────────────────────────────────────────

const MU_TO_EUR = 1_000_000;

interface PayrollRow {
    user: User;
    hours: number;
    hourlyRateEur: number;
    grossEur: number;
}

function computePayroll(
    members: User[],
    allLogs: { performedBy: string; action: string; timestamp: string }[],
    month: string // "YYYY-MM"
): PayrollRow[] {
    return members.map(user => {
        const monthLogs = allLogs.filter(
            l => l.performedBy === user.id && l.timestamp.startsWith(month)
        );
        const sorted = [...monthLogs].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        let totalMinutes = 0;
        let pendingIn: number | null = null;
        for (const log of sorted) {
            const ts = new Date(log.timestamp).getTime();
            if (log.action === "clock_in") {
                pendingIn = ts;
            } else if (log.action === "clock_out" && pendingIn !== null) {
                totalMinutes += (ts - pendingIn) / 60_000;
                pendingIn = null;
            }
        }
        const hours = totalMinutes / 60;
        const hourlyRateEur = (user.hourlyRateInMicrounits ?? 0) / MU_TO_EUR;
        const grossEur = hours * hourlyRateEur;
        return { user, hours, hourlyRateEur, grossEur };
    }).filter(r => r.hours > 0 || r.hourlyRateEur > 0);
}

// ── Staff document types ───────────────────────────────────────────────────────

interface StaffDocument {
    id: string;
    userId: string;
    name: string;
    url: string;
    uploadedAt: string;
}

// ── Known skills (extend as needed) ───────────────────────────────────────────

const KNOWN_SKILLS = [
    "Service en salle",
    "Sommellerie",
    "Cuisine",
    "Pâtisserie",
    "Barista",
    "Caisse / POS",
    "HACCP",
    "Management",
    "Langues étrangères",
    "Permis B",
];

export default function StaffPage() {
    const searchParams = useSearchParams();
const _tabParam = searchParams.get("tab") as StaffTab | null;
const _VALID_STAFF_TABS: StaffTab[] = ["team", "planning", "timesheet", "leaves", "recruitment"];
const [activeTab, setActiveTab] = useState<StaffTab>(
    _tabParam && _VALID_STAFF_TABS.includes(_tabParam) ? _tabParam : "team"
);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [prefillStaff, setPrefillStaff] = useState<{ name?: string; role?: UserRole } | null>(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

    // Paie tab
    const currentMonth = new Date().toISOString().slice(0, 7);
    const [payrollMonth, setPayrollMonth] = useState(currentMonth);

    // Compétences tab
    const [selectedSkillUser, setSelectedSkillUser] = useState<User | null>(null);
    const [staffDocs, setStaffDocs] = useState<StaffDocument[]>([]);
    const [docForm, setDocForm] = useState<{ name: string; url: string } | null>(null);

    const { currentUser } = useAuth();
    const staffMembers = useAtomValue(staffMembersAtom) as User[];
    const shiftLogs = useAtomValue(shiftLogsAtom);
    const { auditLogs } = useStaffAudit();

    // rh-5: 30 derniers pointages, tri antéchronologique. Non-managers ne voient que les leurs.
    const visibleShiftLogs = useMemo(() => {
        const scoped = isManagerCheck() ? shiftLogs : shiftLogs.filter(l => l.performedBy === currentUser?.id);
        return [...scoped]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 30);
    }, [shiftLogs, currentUser]);

    function isManagerCheck() {
        const lvl = PERMISSION_ROLE_LEVELS[(currentUser?.role ?? "client") as PermissionRole] ?? 0;
        return lvl >= PERMISSION_ROLE_LEVELS.manager;
    }
    const {
        leaveRequests,
        leaveBalances,
        shifts,
        approveLeaveRequest,
        rejectLeaveRequest,
        createLeaveRequest,
        publishShifts,
    } = useHumanResources();

    // Load staff documents when a user is selected in skills tab
    useEffect(() => {
        if (!selectedSkillUser) { setStaffDocs([]); return; }
        Nexus.adapter.query<StaffDocument>('staffDocuments', {
            where: [{ field: 'userId', operator: '==', value: selectedSkillUser.id }],
            orderBy: { field: 'uploadedAt', direction: 'desc' },
        }).then(setStaffDocs).catch(() => setStaffDocs([]));
    }, [selectedSkillUser]);

    const payrollRows = useMemo(
        () => computePayroll(staffMembers, shiftLogs, payrollMonth),
        [staffMembers, shiftLogs, payrollMonth]
    );

    const handleToggleSkill = async (user: User, skill: string) => {
        const current = ((user as Record<string, unknown>).skills as string[] | undefined) ?? [];
        const next = current.includes(skill)
            ? current.filter(s => s !== skill)
            : [...current, skill];
        try {
            await Nexus.adapter.update(`users/${user.id}`, { skills: next });
            toast.success(`Compétence ${current.includes(skill) ? "retirée" : "ajoutée"}.`);
        } catch {
            toast.error("Erreur lors de la mise à jour des compétences.");
        }
    };

    const handleAddDoc = async () => {
        if (!selectedSkillUser || !docForm) return;
        if (!docForm.name.trim() || !docForm.url.trim()) {
            toast.error("Nom et URL requis.");
            return;
        }
        const doc: StaffDocument = {
            id: `${selectedSkillUser.id}_${Date.now()}`,
            userId: selectedSkillUser.id,
            name: docForm.name.trim(),
            url: docForm.url.trim(),
            uploadedAt: new Date().toISOString(),
        };
        try {
            await Nexus.adapter.set(`staffDocuments/${doc.id}`, doc);
            setStaffDocs(prev => [doc, ...prev]);
            setDocForm(null);
            toast.success("Document enregistré.");
        } catch {
            toast.error("Erreur lors de l'enregistrement.");
        }
    };

    const handleDeleteDoc = async (doc: StaffDocument) => {
        try {
            await Nexus.adapter.delete(`staffDocuments/${doc.id}`);
            setStaffDocs(prev => prev.filter(d => d.id !== doc.id));
            toast.success("Document supprimé.");
        } catch {
            toast.error("Erreur lors de la suppression.");
        }
    };

    // rh-3: role-based manager check (manager level = 70)
    const roleLevel =
        PERMISSION_ROLE_LEVELS[(currentUser?.role ?? "client") as PermissionRole] ?? 0;
    const isManager = roleLevel >= PERMISSION_ROLE_LEVELS.manager; // 70

    // rh-3: employees see only their own requests; managers see all
    const visibleLeaveRequests = isManager
        ? leaveRequests
        : leaveRequests.filter(r => r.userId === currentUser?.id);

    const handleLeaveSubmit = async (data: Partial<LeaveRequest>) => {
        if (!currentUser) {
            toast.error("Utilisateur non authentifié");
            return;
        }
        await createLeaveRequest({
            ...data,
            userId: currentUser.id,
            userName: currentUser.name,
            type: data.type ?? "paid",
            startDate: data.startDate ?? "",
            endDate: data.endDate ?? "",
            workingDays: data.workingDays ?? 0,
            status: "pending",
        } as Omit<LeaveRequest, "id" | "createdAt" | "updatedAt">);
        toast.success("Demande de congé soumise");
        setIsLeaveModalOpen(false);
    };

    const openStaffModal = (user?: User) => {
        setPrefillStaff(null);
        setEditingUser(user ?? null);
        setIsFormOpen(true);
    };

    const handleHireCandidate = useCallback((candidate: Candidate) => {
        setEditingUser(null);
        setPrefillStaff({
            name: `${candidate.firstName} ${candidate.lastName}`,
            role: (candidate.appliedRole as UserRole) ?? "server",
        });
        setIsFormOpen(true);
    }, []);

    // rh-2 / not-3: Publish weekly planning and push to all servers.
    // Accepts an optional list of IDs (from PlanningWeekView for week-scoped publish).
    const handlePublishPlanning = useCallback(async (ids?: string[]) => {
        setIsPublishing(true);
        try {
            const unpublishedIds = ids ?? shifts
                .filter(s => s.status === 'scheduled')
                .map(s => s.id);

            if (unpublishedIds.length > 0) {
                await publishShifts(unpublishedIds);
            }

            const now = new Date();
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // ISO Monday
            const weekId = weekStart.toISOString().split('T')[0];

            await Nexus.adapter.set(`schedulePublications/${weekId}`, {
                weekId,
                publishedAt: now.toISOString(),
                publishedBy: currentUser?.id ?? 'unknown',
                shiftCount: unpublishedIds.length,
            });

            pushToRole('serveur', {
                title: 'Planning publié',
                body: 'Votre planning de la semaine est disponible',
                url: '/staff?tab=planning',
            });

            toast.success(`Planning publié — ${unpublishedIds.length} shift(s) notifié(s)`);
        } finally {
            setIsPublishing(false);
        }
    }, [shifts, publishShifts, currentUser]);

    // not-5: Approve leave and notify the employee
    const handleApproveLeave = useCallback(async (request: LeaveRequest) => {
        await approveLeaveRequest(request.id);
        pushToUser(request.userId, {
            title: 'Demande de congé approuvée ✓',
            body: `Du ${request.startDate} au ${request.endDate}`,
            url: '/staff?tab=leaves',
        });
    }, [approveLeaveRequest]);

    // not-5: Reject leave and notify the employee
    const handleRejectLeave = useCallback(async (request: LeaveRequest) => {
        await rejectLeaveRequest(request.id, 'business_needs');
        pushToUser(request.userId, {
            title: 'Demande de congé refusée ✗',
            body: `Du ${request.startDate} au ${request.endDate}`,
            url: '/staff?tab=leaves',
        });
    }, [rejectLeaveRequest]);

    return (
        <div className="min-h-screen bg-surface-base text-text-primary p-6">
            <header className="mb-6">
                <h1 className="text-2xl font-serif font-bold">Ressources Humaines</h1>
                <p className="text-sm text-text-muted mt-1">
                    Équipe, planning, congés et recrutement — pilotage RH de l'établissement.
                </p>
            </header>

            <nav className="flex gap-1 border-b border-border mb-6">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                                active
                                    ? "border-action-primary text-action-primary"
                                    : "border-transparent text-text-muted hover:text-text-primary"
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </nav>

            <main>
                {activeTab === "team" && (
                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <div className="flex items-center justify-end mb-3 gap-2">
                                <button
                                    onClick={() => setIsQuickAddOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-gold text-white text-xs font-black uppercase tracking-wider hover:bg-accent-gold/90 transition-colors shadow"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Ajout rapide
                                </button>
                                <button
                                    onClick={() => openStaffModal()}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-xs font-black uppercase tracking-wider text-text-muted hover:text-text-primary transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Formulaire complet
                                </button>
                            </div>
                            <StaffList
                                users={staffMembers}
                                onOpenModal={openStaffModal}
                            />
                        </div>
                        <div>
                            <StaffRecentActivity logs={auditLogs} />
                        </div>
                    </section>
                )}

                {/* rh-4 + rh-2: Planning with legal scheduling warnings and publish button */}
                {activeTab === "planning" && (
                    <section className="space-y-6">
                        <TeamCalendar />
                        {/* Weekly shift list: shows per-shift legal warning badges (non-blocking).
                            The embedded "Publier" button wires through handlePublishPlanning
                            which calls WebPushService after persisting in Nexus (rh-2). */}
                        <PlanningWeekView
                            shifts={shifts}
                            staffMembers={staffMembers}
                            onPublish={handlePublishPlanning}
                            isPublishing={isPublishing}
                        />
                    </section>
                )}

                {activeTab === "timesheet" && (
                    <section className="space-y-6">
                        <BadgeControl />

                        <div className="rounded-2xl border border-border overflow-hidden bg-surface-card">
                            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-black uppercase tracking-widest text-text-primary">Historique des pointages</h2>
                                    <p className="text-xs text-text-muted mt-0.5">
                                        {isManager ? "Vue équipe complète" : "Vos derniers pointages"} — 30 dernières entrées
                                    </p>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                                    {visibleShiftLogs.length} entrée{visibleShiftLogs.length !== 1 ? "s" : ""}
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-surface-sidebar text-text-muted text-left">
                                        <tr>
                                            <th className="px-4 py-2.5 font-medium">Horodatage</th>
                                            <th className="px-4 py-2.5 font-medium">Action</th>
                                            {isManager && <th className="px-4 py-2.5 font-medium">Employé</th>}
                                            <th className="px-4 py-2.5 font-medium">Shift ID</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visibleShiftLogs.map(log => {
                                            const employee = staffMembers.find(u => u.id === log.performedBy);
                                            return (
                                                <tr key={log.id} className="border-t border-border hover:bg-surface-hover">
                                                    <td className="px-4 py-2.5 tabular-nums text-text-muted">
                                                        {new Date(log.timestamp).toLocaleString("fr-FR")}
                                                    </td>
                                                    <td className="px-4 py-2.5 font-medium">
                                                        <span className={
                                                            log.action === "clock_in"
                                                                ? "text-status-success"
                                                                : log.action === "clock_out"
                                                                ? "text-orange-500"
                                                                : "text-text-primary"
                                                        }>
                                                            {log.action === "clock_in" ? "Prise de service"
                                                                : log.action === "clock_out" ? "Fin de service"
                                                                : log.action}
                                                        </span>
                                                    </td>
                                                    {isManager && (
                                                        <td className="px-4 py-2.5 text-text-muted">
                                                            {employee?.displayName ?? employee?.email ?? log.performedBy}
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-2.5 font-mono text-[10px] text-text-muted truncate max-w-[160px]">
                                                        {log.shiftId}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {visibleShiftLogs.length === 0 && (
                                            <tr>
                                                <td colSpan={isManager ? 4 : 3} className="px-4 py-8 text-center text-text-muted italic">
                                                    Aucun pointage enregistré.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Paie ──────────────────────────────────────────────────── */}
                {activeTab === "payroll" && (
                    <section className="space-y-6">
                        {!isManager ? (
                            <p className="text-sm text-text-muted italic py-8 text-center">
                                Accès réservé aux managers.
                            </p>
                        ) : (
                            <>
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-serif font-semibold">Salaires estimés</h2>
                                    <input
                                        type="month"
                                        value={payrollMonth}
                                        onChange={e => setPayrollMonth(e.target.value)}
                                        className="px-3 py-1.5 rounded-md border border-border bg-surface-sidebar text-sm focus:outline-none focus:ring-2 focus:ring-action-primary"
                                    />
                                </div>

                                <div className="rounded-lg border border-border overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-surface-sidebar text-text-muted text-left">
                                            <tr>
                                                <th className="px-4 py-2.5 font-medium">Employé</th>
                                                <th className="px-4 py-2.5 font-medium">Rôle</th>
                                                <th className="px-4 py-2.5 font-medium text-right">Heures</th>
                                                <th className="px-4 py-2.5 font-medium text-right">Taux (€/h)</th>
                                                <th className="px-4 py-2.5 font-medium text-right">Brut estimé</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {payrollRows.map(row => (
                                                <tr key={row.user.id} className="border-t border-border hover:bg-surface-hover">
                                                    <td className="px-4 py-2.5 font-medium">
                                                        {row.user.name}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-text-muted capitalize">
                                                        {row.user.role}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right tabular-nums">
                                                        {row.hours.toFixed(1)} h
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right tabular-nums text-text-muted">
                                                        {row.hourlyRateEur > 0 ? `${row.hourlyRateEur.toFixed(2)} €` : "—"}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold">
                                                        {row.grossEur > 0
                                                            ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(row.grossEur)
                                                            : "—"}
                                                    </td>
                                                </tr>
                                            ))}
                                            {payrollRows.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-8 text-center text-text-muted italic">
                                                        Aucune donnée de pointage pour {payrollMonth}.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        {payrollRows.length > 0 && (
                                            <tfoot className="bg-surface-sidebar border-t border-border">
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-2.5 text-sm font-semibold text-text-muted">
                                                        Total masse salariale brute
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right tabular-nums font-black text-text-primary">
                                                        {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
                                                            payrollRows.reduce((s, r) => s + r.grossEur, 0)
                                                        )}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>

                                <p className="text-[11px] text-text-muted">
                                    Estimation brute — ne tient pas compte des pauses, des heures supp différenciées (36–43h +25%, 44h+ +50%), des primes HCR ni des absences. Utiliser PrepaieBuilder pour l&apos;export officiel.
                                </p>
                            </>
                        )}
                    </section>
                )}

                {/* ── Compétences & Dossiers ─────────────────────────────── */}
                {activeTab === "skills" && (
                    <section className="space-y-8">
                        {/* Skill matrix */}
                        <div>
                            <h2 className="text-lg font-serif font-semibold mb-4">Matrice de compétences</h2>
                            <div className="overflow-x-auto rounded-lg border border-border">
                                <table className="text-sm">
                                    <thead className="bg-surface-sidebar text-text-muted text-left">
                                        <tr>
                                            <th className="px-4 py-2.5 font-medium whitespace-nowrap">Employé</th>
                                            {KNOWN_SKILLS.map(skill => (
                                                <th key={skill} className="px-3 py-2.5 font-medium text-center whitespace-nowrap text-[11px]">
                                                    {skill}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {staffMembers.map(member => {
                                            const skills = ((member as Record<string, unknown>).skills as string[] | undefined) ?? [];
                                            return (
                                                <tr key={member.id} className="border-t border-border hover:bg-surface-hover">
                                                    <td className="px-4 py-2.5 font-medium whitespace-nowrap">{member.name}</td>
                                                    {KNOWN_SKILLS.map(skill => {
                                                        const has = skills.includes(skill);
                                                        return (
                                                            <td key={skill} className="px-3 py-2.5 text-center">
                                                                <button
                                                                    onClick={() => isManager ? void handleToggleSkill(member, skill) : undefined}
                                                                    title={isManager ? (has ? "Retirer" : "Ajouter") : "Lecture seule"}
                                                                    className={`w-6 h-6 rounded-full border-2 transition-colors ${
                                                                        has
                                                                            ? "bg-status-success border-status-success text-white"
                                                                            : "border-border text-transparent"
                                                                    } ${isManager ? "hover:opacity-70 cursor-pointer" : "cursor-default"}`}
                                                                >
                                                                    {has ? "✓" : ""}
                                                                </button>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                        {staffMembers.length === 0 && (
                                            <tr>
                                                <td colSpan={KNOWN_SKILLS.length + 1} className="px-4 py-8 text-center text-text-muted italic">
                                                    Aucun membre d&apos;équipe.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Dossiers / CV */}
                        <div>
                            <h2 className="text-lg font-serif font-semibold mb-4">CV & Dossiers</h2>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Employee selector */}
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Sélectionner un employé</p>
                                    {staffMembers.map(member => (
                                        <button
                                            key={member.id}
                                            onClick={() => setSelectedSkillUser(member)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                                selectedSkillUser?.id === member.id
                                                    ? "bg-action-primary/10 text-action-primary font-medium border border-action-primary/30"
                                                    : "hover:bg-surface-hover text-text-muted"
                                            }`}
                                        >
                                            {member.name}
                                        </button>
                                    ))}
                                </div>

                                {/* Document list + add form */}
                                <div className="lg:col-span-2">
                                    {!selectedSkillUser ? (
                                        <p className="text-sm text-text-muted italic py-8 text-center">
                                            Sélectionnez un employé pour voir ses dossiers.
                                        </p>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold">{selectedSkillUser.name}</p>
                                                {isManager && !docForm && (
                                                    <button
                                                        onClick={() => setDocForm({ name: "", url: "" })}
                                                        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-action-primary text-white text-xs font-medium hover:opacity-90"
                                                    >
                                                        <FileText className="w-3.5 h-3.5" /> Ajouter un document
                                                    </button>
                                                )}
                                            </div>

                                            {docForm && (
                                                <div className="p-4 rounded-lg border border-border bg-surface-sidebar space-y-3">
                                                    <input
                                                        type="text"
                                                        placeholder="Nom du document (ex : CV 2026)"
                                                        value={docForm.name}
                                                        onChange={e => setDocForm(f => f ? { ...f, name: e.target.value } : f)}
                                                        className="w-full px-3 py-2 rounded-md border border-border bg-surface-base text-sm focus:outline-none focus:ring-2 focus:ring-action-primary"
                                                    />
                                                    <input
                                                        type="url"
                                                        placeholder="URL du fichier (Drive, Dropbox, Firebase Storage…)"
                                                        value={docForm.url}
                                                        onChange={e => setDocForm(f => f ? { ...f, url: e.target.value } : f)}
                                                        className="w-full px-3 py-2 rounded-md border border-border bg-surface-base text-sm focus:outline-none focus:ring-2 focus:ring-action-primary"
                                                    />
                                                    <div className="flex gap-2 justify-end">
                                                        <button onClick={() => setDocForm(null)} className="px-3 py-1.5 text-sm text-text-muted hover:text-text-primary">Annuler</button>
                                                        <button onClick={() => void handleAddDoc()} className="px-3 py-1.5 rounded-md bg-action-primary text-white text-sm font-medium hover:opacity-90">Enregistrer</button>
                                                    </div>
                                                </div>
                                            )}

                                            {staffDocs.length === 0 && !docForm && (
                                                <p className="text-sm text-text-muted italic py-4 text-center">Aucun document enregistré.</p>
                                            )}

                                            <div className="space-y-2">
                                                {staffDocs.map(doc => (
                                                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-surface-hover">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <FileText className="w-4 h-4 text-action-primary shrink-0" />
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-medium truncate">{doc.name}</p>
                                                                <p className="text-[11px] text-text-muted">
                                                                    {new Date(doc.uploadedAt).toLocaleDateString("fr-FR")}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0 ml-3">
                                                            <a
                                                                href={doc.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs text-action-primary hover:underline"
                                                            >
                                                                Ouvrir
                                                            </a>
                                                            {isManager && (
                                                                <button
                                                                    onClick={() => void handleDeleteDoc(doc)}
                                                                    className="p-1 rounded hover:bg-surface-hover text-red-500"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {activeTab === "leaves" && (
                    <section className="space-y-6">
                        {/* Employee action */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-serif font-semibold text-text-primary">
                                Congés &amp; Absences
                            </h2>
                            <button
                                onClick={() => setIsLeaveModalOpen(true)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-action-primary text-white text-sm font-bold hover:opacity-90 transition-opacity shadow"
                            >
                                <Plus className="w-4 h-4" />
                                Demander un congé
                            </button>
                        </div>

                        {/* Balance cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {leaveBalances.map((balance, i) => (
                                <LeaveBalanceCard key={`${balance.type}-${i}`} balance={balance} />
                            ))}
                        </div>

                        {/* rh-3: Managers (role >= 70) see all requests with Approve/Reject;
                                 employees see only their own requests without approval controls. */}
                        <div className="space-y-3">
                            {visibleLeaveRequests.map((request) => (
                                <LeaveRequestCard
                                    key={request.id}
                                    request={request}
                                    isManager={isManager}
                                    onView={() => openStaffModal()}
                                    onApprove={isManager ? () => { void handleApproveLeave(request); } : undefined}
                                    onReject={isManager ? () => { void handleRejectLeave(request); } : undefined}
                                />
                            ))}
                            {visibleLeaveRequests.length === 0 && (
                                <p className="text-sm text-text-muted italic py-8 text-center">
                                    Aucune demande de congé.
                                </p>
                            )}
                        </div>
                    </section>
                )}

                {activeTab === "recruitment" && (
                    <section>
                        <RecruitmentBoard onHireCandidate={handleHireCandidate} />
                    </section>
                )}
            </main>

            <StaffMemberForm
                key={editingUser?.id ?? (prefillStaff ? `prefill-${prefillStaff.name}` : "new")}
                isOpen={isFormOpen}
                onClose={() => { setIsFormOpen(false); setPrefillStaff(null); }}
                editingUser={editingUser}
                prefillData={prefillStaff ?? undefined}
            />

            <NewRequestModal
                isOpen={isLeaveModalOpen}
                onClose={() => setIsLeaveModalOpen(false)}
                balances={leaveBalances}
                onSubmit={handleLeaveSubmit}
            />

            <QuickAddStaffModal
                isOpen={isQuickAddOpen}
                onClose={() => setIsQuickAddOpen(false)}
            />
        </div>
    );
}
