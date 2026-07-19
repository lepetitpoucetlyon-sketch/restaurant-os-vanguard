"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAtomValue } from "jotai";
import { Users, CalendarRange, Palmtree, UserPlus, Plus } from "lucide-react";
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
} from "@modules/human";
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
import { WebPushService } from '@/lib/push/webPushService';

type StaffTab = "team" | "planning" | "leaves" | "recruitment";

const TABS: { id: StaffTab; label: string; icon: typeof Users }[] = [
    { id: "team", label: "Équipe", icon: Users },
    { id: "planning", label: "Planning", icon: CalendarRange },
    { id: "leaves", label: "Congés & Absences", icon: Palmtree },
    { id: "recruitment", label: "Recrutement", icon: UserPlus },
];

export default function StaffPage() {
    const searchParams = useSearchParams();
const _tabParam = searchParams.get("tab") as StaffTab | null;
const _VALID_STAFF_TABS: StaffTab[] = ["team", "planning", "leaves", "recruitment"];
const [activeTab, setActiveTab] = useState<StaffTab>(
    _tabParam && _VALID_STAFF_TABS.includes(_tabParam) ? _tabParam : "team"
);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [prefillStaff, setPrefillStaff] = useState<{ name?: string; role?: UserRole } | null>(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

    const { currentUser } = useAuth();
    const staffMembers = useAtomValue(staffMembersAtom) as User[];
    const { auditLogs } = useStaffAudit();
    const {
        leaveRequests,
        leaveBalances,
        shifts,
        approveLeaveRequest,
        rejectLeaveRequest,
        createLeaveRequest,
        publishShifts,
    } = useHumanResources();

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

            await WebPushService.sendToRole('serveur', {
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
        WebPushService.sendToUser(request.userId, {
            title: 'Demande de congé approuvée ✓',
            body: `Du ${request.startDate} au ${request.endDate}`,
            url: '/staff?tab=leaves',
        }).catch(() => {});
    }, [approveLeaveRequest]);

    // not-5: Reject leave and notify the employee
    const handleRejectLeave = useCallback(async (request: LeaveRequest) => {
        await rejectLeaveRequest(request.id, 'business_needs');
        WebPushService.sendToUser(request.userId, {
            title: 'Demande de congé refusée ✗',
            body: `Du ${request.startDate} au ${request.endDate}`,
            url: '/staff?tab=leaves',
        }).catch(() => {});
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
