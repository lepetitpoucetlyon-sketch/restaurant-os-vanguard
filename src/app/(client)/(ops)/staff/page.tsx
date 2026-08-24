"use client";

import { Users, CalendarRange, Palmtree, UserPlus, Plus, Clock, Euro, GraduationCap } from "lucide-react";

import dynamic from "next/dynamic";
import {
    useStaffPage,
    StaffList,
    StaffRecentActivity,
} from '@/modules/human';
import type { StaffTab } from "./staffUtils";
import { withPageGuard } from "@/shared/components/rbac/PageGuard";
import { TabGuard } from "@/shared/components/rbac/TabGuard";
import { useTabAccess } from "@/shared/hooks/useTabAccess";
import { PageShell } from "@/shared/components/ui/PageShell";

const BadgeControl = dynamic(() => import('@/modules/human').then(m => m.BadgeControl), { ssr: false });
const StaffMemberForm = dynamic(() => import('@/modules/human').then(m => m.StaffMemberForm), { ssr: false });
const TeamCalendar = dynamic(() => import('@/modules/human').then(m => m.TeamCalendar), { ssr: false });
const NewRequestModal = dynamic(() => import('@/modules/human').then(m => m.NewRequestModal), { ssr: false });
const PlanningWeekView = dynamic(() => import('@/modules/human').then(m => m.PlanningWeekView), { ssr: false });
const RecruitmentBoard = dynamic(() => import('@/modules/human').then(m => m.RecruitmentBoard), { ssr: false });
const QuickAddStaffModal = dynamic(() => import('@/modules/human').then(m => m.QuickAddStaffModal), { ssr: false });

const SkillsTab = dynamic(() => import("./_tabs/SkillsTab").then(m => m.SkillsTab), { ssr: false });
const TimesheetTab = dynamic(() => import("./_tabs/TimesheetTab").then(m => m.TimesheetTab), { ssr: false });
const PayrollTab = dynamic(() => import("./_tabs/PayrollTab").then(m => m.PayrollTab), { ssr: false });
const LeavesTab = dynamic(() => import("./_tabs/LeavesTab").then(m => m.LeavesTab), { ssr: false });

const TABS: { id: StaffTab; label: string; icon: typeof Users }[] = [
    { id: "team",        label: "Équipe",              icon: Users },
    { id: "planning",    label: "Planning",             icon: CalendarRange },
    { id: "timesheet",   label: "Pointage",             icon: Clock },
    { id: "payroll",     label: "Paie",                 icon: Euro },
    { id: "skills",      label: "Compétences",          icon: GraduationCap },
    { id: "leaves",      label: "Congés & Absences",    icon: Palmtree },
    { id: "recruitment", label: "Recrutement",          icon: UserPlus },
];

function StaffPage() {
    const canSeePayroll = useTabAccess("staff", "payroll");
    const canSeeRecruitment = useTabAccess("staff", "recruitment");
    const visibleTabs = TABS.filter(t => {
        if (t.id === "payroll") return canSeePayroll;
        if (t.id === "recruitment") return canSeeRecruitment;
        return true;
    });

    const {
        activeTab, setActiveTab,
        editingUser, isFormOpen, setIsFormOpen,
        isLeaveModalOpen, setIsLeaveModalOpen,
        prefillStaff, setPrefillStaff,
        isPublishing,
        isQuickAddOpen, setIsQuickAddOpen,
        payrollMonth, setPayrollMonth,
        selectedSkillUser, setSelectedSkillUser,
        staffDocs, docForm, setDocForm,
        staffMembers, auditLogs, shifts,
        isManager, visibleShiftLogs, visibleLeaveRequests,
        leaveBalances, payrollRows,
        handleToggleSkill, handleAddDoc, handleDeleteDoc,
        handleLeaveSubmit, openStaffModal, handleHireCandidate,
        handlePublishPlanning, handleApproveLeave, handleRejectLeave,
    } = useStaffPage();

    return (
        <PageShell
            kicker="Humain"
            title="Ressources Humaines"
            subtitle="Équipe, planning, congés et recrutement — pilotage RH de l'établissement."
            icon={Users}
            breadcrumbs={[{ label: "Opérations" }, { label: "Équipe" }]}
            actions={activeTab === "team" ? (
                <>
                    <button
                        onClick={() => openStaffModal()}
                        className="h-10 px-3.5 rounded-xl bg-surface-glass border border-border/40 hover:border-accent-gold/50 text-text-muted hover:text-accent-gold text-xs font-medium tracking-tight transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-[14px] h-[14px]" /> <span>Formulaire complet</span>
                    </button>
                    <PageShell.CTA onClick={() => setIsQuickAddOpen(true)}>
                        <Plus className="w-[15px] h-[15px]" /> <span>Ajout rapide</span>
                    </PageShell.CTA>
                </>
            ) : undefined}
            tabs={
                <>
                    {visibleTabs.map((tab) => (
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
            <main>
                {activeTab === "team" && (
                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <StaffList users={staffMembers} onOpenModal={openStaffModal} />
                        </div>
                        <div><StaffRecentActivity logs={auditLogs} /></div>
                    </section>
                )}

                {activeTab === "planning" && (
                    <section className="space-y-6">
                        <TeamCalendar />
                        <PlanningWeekView shifts={shifts} staffMembers={staffMembers} onPublish={handlePublishPlanning} isPublishing={isPublishing} />
                    </section>
                )}

                {activeTab === "timesheet" && (
                    <TimesheetTab visibleShiftLogs={visibleShiftLogs} isManager={isManager} staffMembers={staffMembers} />
                )}

                {activeTab === "payroll" && (
                    <TabGuard pageKey="staff" tabKey="payroll">
                        <PayrollTab isManager={isManager} payrollMonth={payrollMonth} setPayrollMonth={setPayrollMonth} payrollRows={payrollRows} />
                    </TabGuard>
                )}

                {activeTab === "skills" && (
                    <SkillsTab staffMembers={staffMembers} isManager={isManager} selectedSkillUser={selectedSkillUser} docForm={docForm} staffDocs={staffDocs} onToggleSkill={handleToggleSkill} onSelectUser={setSelectedSkillUser} setDocForm={setDocForm} onAddDoc={handleAddDoc} onDeleteDoc={handleDeleteDoc} />
                )}

                {activeTab === "leaves" && (
                    <LeavesTab leaveBalances={leaveBalances} visibleLeaveRequests={visibleLeaveRequests} isManager={isManager} onRequestLeave={() => setIsLeaveModalOpen(true)} onViewStaff={() => openStaffModal()} onApprove={handleApproveLeave} onReject={handleRejectLeave} />
                )}

                {activeTab === "recruitment" && (
                    <TabGuard pageKey="staff" tabKey="recruitment">
                        <section><RecruitmentBoard onHireCandidate={handleHireCandidate} /></section>
                    </TabGuard>
                )}
            </main>

            <StaffMemberForm
                key={editingUser?.id ?? (prefillStaff ? `prefill-${prefillStaff.name}` : "new")}
                isOpen={isFormOpen}
                onClose={() => { setIsFormOpen(false); setPrefillStaff(null); }}
                editingUser={editingUser}
                prefillData={prefillStaff ?? undefined}
            />
            <NewRequestModal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} balances={leaveBalances} onSubmit={handleLeaveSubmit} />
            <QuickAddStaffModal isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} />

            {/* BadgeControl reserved for team tab actions */}
            <BadgeControl />
        </PageShell>
    );
}

export default withPageGuard(StaffPage, "staff");
