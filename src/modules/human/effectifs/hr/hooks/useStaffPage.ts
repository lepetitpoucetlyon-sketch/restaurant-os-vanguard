"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAtomValue } from "jotai";
import { toast } from "sonner";
import type { User, LeaveRequest, Candidate, UserRole } from "@nexus/contracts";
import { PERMISSION_ROLE_LEVELS, type PermissionRole } from "@nexus/contracts/permissions.types";

import { useHumanResources } from "./useHumanResources";
import { useStaffAudit } from "./useStaffAudit";
import { staffMembersAtom, shiftLogsAtom } from "../store/staffAtoms";
import { useAuth, useTenant } from "@/shared/hooks";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { pushToUser, pushToRole } from "@/lib/push/pushClient";
import { computePayroll, type StaffTab, type StaffDocument } from "@/app/(client)/(ops)/staff/staffUtils";
import { JsonObject } from "@/lib/types/json";

const VALID_STAFF_TABS: StaffTab[] = ["team", "planning", "timesheet", "leaves", "recruitment"];

function computeInitialTab(tabParam: StaffTab | null): StaffTab {
    return tabParam && VALID_STAFF_TABS.includes(tabParam) ? tabParam : "team";
}

function buildStaffDoc(userId: string | null, form: { name: string; url: string } | null): { doc: StaffDocument } | { error: string } | null {
    if (!userId || !form) return null;
    if (!form.name.trim() || !form.url.trim()) return { error: "Nom et URL requis." };
    return { doc: { id: `${userId}_${Date.now()}`, userId, name: form.name.trim(), url: form.url.trim(), uploadedAt: new Date().toISOString() } };
}

export function useStaffPage() {
    const { tenantId } = useTenant();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab") as StaffTab | null;
    const [activeTab, setActiveTab] = useState<StaffTab>(computeInitialTab(tabParam));
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [prefillStaff, setPrefillStaff] = useState<{ name?: string; role?: UserRole } | null>(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [payrollMonth, setPayrollMonth] = useState(() => new Date().toISOString().slice(0, 7));
    const [selectedSkillUser, setSelectedSkillUser] = useState<User | null>(null);
    const [staffDocs, setStaffDocs] = useState<StaffDocument[]>([]);
    const [docForm, setDocForm] = useState<{ name: string; url: string } | null>(null);

    const { currentUser } = useAuth();
    const staffMembers = useAtomValue(staffMembersAtom) as User[];
    const shiftLogs = useAtomValue(shiftLogsAtom);
    const { auditLogs } = useStaffAudit();

    const roleLevel = PERMISSION_ROLE_LEVELS[(currentUser?.role ?? "client") as PermissionRole] ?? 0;
    const isManager = roleLevel >= PERMISSION_ROLE_LEVELS.manager;

    const visibleShiftLogs = useMemo(() => {
        const scoped = isManager ? shiftLogs : shiftLogs.filter(l => l.performedBy === currentUser?.id);
        return [...scoped]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 30);
    }, [shiftLogs, currentUser, isManager]);

    const {
        leaveRequests, leaveBalances, shifts,
        approveLeaveRequest, rejectLeaveRequest, createLeaveRequest, publishShifts,
    } = useHumanResources();

    const visibleLeaveRequests = isManager ? leaveRequests : leaveRequests.filter(r => r.userId === currentUser?.id);
    const payrollRows = useMemo(() => computePayroll(staffMembers, shiftLogs, payrollMonth), [staffMembers, shiftLogs, payrollMonth]);

    useEffect(() => {
        if (!selectedSkillUser) { setStaffDocs([]); return; }
        Nexus.adapter.query<StaffDocument>('staffDocuments', {
            where: [{ field: 'userId', operator: '==', value: selectedSkillUser.id }],
            orderBy: { field: 'uploadedAt', direction: 'desc' },
        }).then(setStaffDocs).catch(() => setStaffDocs([]));
    }, [selectedSkillUser]);

    const handleToggleSkill = async (user: User, skill: string) => {
        const current = ((user as JsonObject).skills as string[] | undefined) ?? [];
        const next = current.includes(skill) ? current.filter(s => s !== skill) : [...current, skill];
        try {
            await Nexus.adapter.update(`users/${user.id}`, { skills: next });
            toast.success(`Compétence ${current.includes(skill) ? "retirée" : "ajoutée"}.`);
        } catch { toast.error("Erreur lors de la mise à jour des compétences."); }
    };

    const handleAddDoc = async () => {
        const result = buildStaffDoc(selectedSkillUser?.id ?? null, docForm);
        if (!result) return;
        if ('error' in result) { toast.error(result.error); return; }
        const { doc } = result;
        try {
            await Nexus.adapter.set(`staffDocuments/${doc.id}`, doc);
            setStaffDocs(prev => [doc, ...prev]);
            setDocForm(null);
            toast.success("Document enregistré.");
        } catch { toast.error("Erreur lors de l'enregistrement."); }
    };

    const handleDeleteDoc = async (doc: StaffDocument) => {
        try {
            await Nexus.adapter.delete(`staffDocuments/${doc.id}`);
            setStaffDocs(prev => prev.filter(d => d.id !== doc.id));
            toast.success("Document supprimé.");
        } catch { toast.error("Erreur lors de la suppression."); }
    };

    const handleLeaveSubmit = async (data: Partial<LeaveRequest>) => {
        if (!currentUser) { toast.error("Utilisateur non authentifié"); return; }
        await createLeaveRequest({ ...data, userId: currentUser.id, userName: currentUser.name, type: data.type ?? "paid", startDate: data.startDate ?? "", endDate: data.endDate ?? "", workingDays: data.workingDays ?? 0, status: "pending" } as Omit<LeaveRequest, "id" | "createdAt" | "updatedAt">);
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
        setPrefillStaff({ name: `${candidate.firstName} ${candidate.lastName}`, role: (candidate.appliedRole as UserRole) ?? "server" });
        setIsFormOpen(true);
    }, []);

    const handlePublishPlanning = useCallback(async (ids?: string[]) => {
        setIsPublishing(true);
        try {
            const unpublishedIds = ids ?? shifts.filter(s => s.status === 'scheduled').map(s => s.id);
            if (unpublishedIds.length > 0) await publishShifts(unpublishedIds);
            const now = new Date();
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
            const weekId = weekStart.toISOString().split('T')[0];
            await Nexus.adapter.set(`schedulePublications/${weekId}`, { weekId, publishedAt: now.toISOString(), publishedBy: currentUser?.id ?? 'unknown', shiftCount: unpublishedIds.length });
            if (tenantId) pushToRole(tenantId, 'serveur', { title: 'Planning publié', body: 'Votre planning de la semaine est disponible', url: '/staff?tab=planning' });
            toast.success(`Planning publié — ${unpublishedIds.length} shift(s) notifié(s)`);
        } finally { setIsPublishing(false); }
    }, [shifts, publishShifts, currentUser, tenantId]);

    const handleApproveLeave = useCallback(async (request: LeaveRequest) => {
        await approveLeaveRequest(request.id);
        if (tenantId) pushToUser(tenantId, request.userId, { title: 'Demande de congé approuvée ✓', body: `Du ${request.startDate} au ${request.endDate}`, url: '/staff?tab=leaves' });
    }, [approveLeaveRequest, tenantId]);

    const handleRejectLeave = useCallback(async (request: LeaveRequest) => {
        await rejectLeaveRequest(request.id, 'business_needs');
        if (tenantId) pushToUser(tenantId, request.userId, { title: 'Demande de congé refusée ✗', body: `Du ${request.startDate} au ${request.endDate}`, url: '/staff?tab=leaves' });
    }, [rejectLeaveRequest, tenantId]);

    return {
        activeTab, setActiveTab,
        editingUser, isFormOpen, setIsFormOpen,
        isLeaveModalOpen, setIsLeaveModalOpen,
        prefillStaff, setPrefillStaff,
        isPublishing,
        isQuickAddOpen, setIsQuickAddOpen,
        payrollMonth, setPayrollMonth,
        selectedSkillUser, setSelectedSkillUser,
        staffDocs, docForm, setDocForm,
        currentUser, staffMembers, auditLogs, shiftLogs, shifts,
        isManager, visibleShiftLogs, visibleLeaveRequests,
        leaveBalances, payrollRows,
        handleToggleSkill, handleAddDoc, handleDeleteDoc,
        handleLeaveSubmit, openStaffModal, handleHireCandidate,
        handlePublishPlanning, handleApproveLeave, handleRejectLeave,
    };
}
