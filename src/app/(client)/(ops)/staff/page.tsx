"use client";

import { Users, CalendarRange, Palmtree, UserPlus, Plus, Clock, Euro, GraduationCap } from "lucide-react";

import { useStaffPage } from '@/modules/human';
import { BadgeControl } from "@modules/human/effectifs/hr/components/staff/BadgeControl";
import {
    StaffList, StaffMemberForm, StaffRecentActivity,
    TeamCalendar, NewRequestModal, PlanningWeekView,
} from "@modules/human/effectifs/hr/components";
import { RecruitmentBoard } from '@/modules/human';
import { QuickAddStaffModal } from '@/modules/human';
import { SkillsTab } from "./_tabs/SkillsTab";
import { TimesheetTab } from "./_tabs/TimesheetTab";
import { PayrollTab } from "./_tabs/PayrollTab";
import { LeavesTab } from "./_tabs/LeavesTab";
import type { StaffTab } from "./staffUtils";
import { withPageGuard } from "@/shared/components/rbac/PageGuard";
import { TabGuard } from "@/shared/components/rbac/TabGuard";
import { useTabAccess } from "@/shared/hooks/useTabAccess";

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
        <div className="min-h-screen bg-surface-base text-text-primary p-6">
            <header className="mb-6">
                <h1 className="text-2xl font-serif font-bold">Ressources Humaines</h1>
                <p className="text-sm text-text-muted mt-1">Équipe, planning, congés et recrutement — pilotage RH de l&apos;établissement.</p>
            </header>

            <nav className="flex gap-1 border-b border-border mb-6">
                {visibleTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? "border-action-primary text-action-primary" : "border-transparent text-text-muted hover:text-text-primary"}`}>
                            <Icon className="w-4 h-4" /> {tab.label}
                        </button>
                    );
                })}
            </nav>

            <main>
                {activeTab === "team" && (
                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <div className="flex items-center justify-end mb-3 gap-2">
                                <button onClick={() => setIsQuickAddOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-gold text-text-primary text-xs font-black uppercase tracking-wider hover:bg-accent-gold/90 transition-colors shadow">
                                    <Plus className="w-3.5 h-3.5" /> Ajout rapide
                                </button>
                                <button onClick={() => openStaffModal()} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-xs font-black uppercase tracking-wider text-text-muted hover:text-text-primary transition-colors">
                                    <Plus className="w-3.5 h-3.5" /> Formulaire complet
                                </button>
                            </div>
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
        </div>
    );
}

export default withPageGuard(StaffPage, "staff");
