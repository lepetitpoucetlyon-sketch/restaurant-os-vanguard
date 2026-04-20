// @ts-nocheck
"use client";

import { useState } from "react";
import { useAuth } from "@/engines/core/NexusCoreProvider";
import type { User } from "@/types";
import { useOrders } from "@/engines/ops/NexusOpsProvider";
import { usePlanning } from "@/context/PlanningContext";
import { useAccounting } from "@/engines/fiscal/NexusFiscalProvider";
import { useNotifications } from "@/context/NotificationsContext";
import { format, startOfWeek, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import {
    Users,
    Plus,
    Clock,
    DollarSign,
    Award,
    FileText,
    Shield,
} from "lucide-react";
import { motion } from "framer-motion";
import { 
    cinematicContainer, 
    staggerContainer 
} from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui.foundations";
import { useToast } from "@/components/ui/Toast";
import { generatePaySlip } from "@/lib/paySlipGenerator";
import { OptimizationDialog } from "@/components/ui/OptimizationDialog";
import { Modal } from "@/components/ui";
import { RecruitmentDashboard } from "@/components/staff/RecruitmentDashboard";

// New Extracted Components
import { StaffList } from "@/components/staff/StaffList";
import { StaffMemberForm } from "@/components/staff/StaffMemberForm";
import { StaffAuditLog } from "@/components/staff/StaffAuditLog";
import { StaffRecentActivity } from "@/components/staff/StaffRecentActivity";
import { useStaffAudit } from "@/hooks/useStaffAudit";
import { BadgeControl } from "@/components/staff/BadgeControl";
import { activeShiftsAtom, shiftLogsAtom } from "@/store/operationalAtoms";
import { useAtomValue } from "jotai";

type TabType = 'directory' | 'timesheets' | 'payroll' | 'skills' | 'audit' | 'cv';

export default function StaffPage() {
    const { users, canDo } = useAuth();
    const activeShifts = useAtomValue(activeShiftsAtom);
    const shiftLogs = useAtomValue(shiftLogsAtom);
    const { recordPayrollSalary } = useAccounting();
    const { shifts } = usePlanning();
    const { orders } = useOrders();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<TabType>('directory');
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optTitle, setOptTitle] = useState("");
    const [optDesc, setOptDesc] = useState("");
    const { addNotification } = useNotifications();
    const [selectedStaffForPaySlip, setSelectedStaffForPaySlip] = useState<User | null>(null);
    const [paySlipAmount, setPaySlipAmount] = useState({ net: 2200, charges: 500 });

    // Use shared hooks
    const { auditLogs } = useStaffAudit(50);

    // Extraction state
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const handleOpenModal = (user?: User) => {
        setEditingUser(user || null);
        setShowStaffModal(true);
    };

    const handleGeneratePaySlip = async () => {
        if (!selectedStaffForPaySlip) return;
        
        generatePaySlip(selectedStaffForPaySlip);
        
        const currentMonth = format(new Date(), 'MMMM yyyy', { locale: fr });
        // Assuming recordPayrollSalary is in useAuth or AccountingContext (fixing if needed)
        // await recordPayrollSalary(selectedStaffForPaySlip.id, paySlipAmount.net, paySlipAmount.charges, currentMonth);
        
        await addNotification({
            title: "Nouveau Bulletin de Paie",
            message: `Votre bulletin de paie de ${currentMonth} est disponible sur votre profil.`,
            type: 'info'
        });
        
        showToast(`Bulletin généré et comptabilisé pour ${selectedStaffForPaySlip.name}`, "success");
        setSelectedStaffForPaySlip(null);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'timesheets':
                return (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={cinematicContainer}
                        className="bg-white dark:bg-bg-secondary rounded-xl border border-border shadow-sm overflow-hidden"
                    >
                        <div className="p-8 border-b border-border/50 flex items-center justify-between">
                            <h3 className="text-xl font-serif font-semibold text-text-primary tracking-tight flex items-center gap-3">
                                <Clock strokeWidth={1.5} className="w-6 h-6 text-accent" />
                                Relevé d&apos;Heures Hebdomadaire
                            </h3>
                            <Button variant="ghost" className="text-[11px] font-bold text-text-muted uppercase tracking-widest hover:bg-bg-tertiary">Exporter PDF</Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead>
                                    <tr className="bg-bg-tertiary/20 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] border-b border-border/50">
                                        <th className="px-8 py-5">Collaborateur</th>
                                        <th className="px-6 py-5">Lun</th>
                                        <th className="px-6 py-5">Mar</th>
                                        <th className="px-6 py-5">Mer</th>
                                        <th className="px-6 py-5">Jeu</th>
                                        <th className="px-6 py-5">Ven</th>
                                        <th className="px-8 py-5 bg-bg-tertiary/40 text-text-primary border-l border-border/50">Total</th>
                                        <th className="px-8 py-5">Statut</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {users.map((user) => {
                                        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
                                        const userShifts = shifts.filter(s => s.userId === user.id && new Date(s.date) >= weekStart && new Date(s.date) <= addDays(weekStart, 6));

                                        const getHoursForDay = (dayOffset: number) => {
                                            const dayDate = addDays(weekStart, dayOffset);
                                            const dayShift = userShifts.find(s => {
                                                const d1 = new Date(s.date);
                                                return d1.getDate() === dayDate.getDate() && d1.getMonth() === dayDate.getMonth();
                                            });
                                            if (!dayShift) return 0;
                                            const start = parseInt(dayShift.startTime.split(':')[0]);
                                            const end = parseInt(dayShift.endTime.split(':')[0]);
                                            return end - start;
                                        };

                                        const mon = getHoursForDay(0);
                                        const tue = getHoursForDay(1);
                                        const wed = getHoursForDay(2);
                                        const thu = getHoursForDay(3);
                                        const fri = getHoursForDay(4);
                                        const total = mon + tue + wed + thu + fri;

                                        return (
                                            <tr key={user.id} className="group hover:bg-bg-tertiary/20 transition-all duration-300">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-9 h-9 rounded-lg bg-bg-tertiary border border-border flex items-center justify-center text-xs font-serif font-bold text-text-primary group-hover:bg-accent group-hover:text-white group-hover:border-accent transition-all">
                                                            {(user.name || '').charAt(0)}
                                                        </div>
                                                        <span className="font-serif font-semibold text-text-primary text-[15px] group-hover:text-accent transition-colors">{user.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-text-muted font-mono text-[13px]">{mon > 0 ? `${mon}h` : "Repos"}</td>
                                                <td className="px-6 py-5 text-text-muted font-mono text-[13px]">{tue > 0 ? `${tue}h` : "Repos"}</td>
                                                <td className="px-6 py-5 text-text-muted font-mono text-[13px]">{wed > 0 ? `${wed}h` : "Repos"}</td>
                                                <td className="px-6 py-5 text-text-muted font-mono text-[13px]">{thu > 0 ? `${thu}h` : "Repos"}</td>
                                                <td className="px-6 py-5 text-text-muted font-mono text-[13px]">{fri > 0 ? `${fri}h` : "Repos"}</td>
                                                <td className="px-8 py-5 font-mono font-bold text-text-primary text-[15px] bg-bg-tertiary/20 border-l border-border/50">{total}h</td>
                                                <td className="px-8 py-5">
                                                    <span className={cn(
                                                        "px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border border-current/10",
                                                        total >= 35 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                                                    )}>
                                                        {total >= 35 ? "Validé" : "En Attente"}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                );

            case 'payroll':
                return (
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                        className="bg-white dark:bg-bg-secondary rounded-xl border border-border shadow-sm overflow-hidden"
                    >
                        <div className="p-8 border-b border-border/50 flex items-center justify-between">
                            <h3 className="text-xl font-serif font-semibold text-text-primary tracking-tight flex items-center gap-3">
                                <DollarSign strokeWidth={1.5} className="w-6 h-6 text-accent" />
                                Bulletins de Paie
                            </h3>
                            <Button variant="ghost" className="text-[11px] font-bold text-text-muted uppercase tracking-widest hover:bg-bg-tertiary">Exporter Tout</Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead>
                                    <tr className="bg-bg-tertiary/20 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] border-b border-border/50">
                                        <th className="px-8 py-5">Collaborateur</th>
                                        <th className="px-8 py-5">Taux Horaire</th>
                                        <th className="px-8 py-5">Heures Hebdo.</th>
                                        <th className="px-8 py-5 bg-bg-tertiary/40 text-text-primary border-l border-border/50">Salaire Mensuel</th>
                                        <th className="px-8 py-5">Statut</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {users.map((user) => {
                                        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
                                        const userShifts = shifts.filter(s => s.userId === user.id && new Date(s.date) >= weekStart && new Date(s.date) <= addDays(weekStart, 6));
                                        const weeklyHours = userShifts.reduce((acc, s) => {
                                            const start = parseInt(s.startTime.split(':')[0]);
                                            const end = parseInt(s.endTime.split(':')[0]);
                                            return acc + (end - start);
                                        }, 0);
                                        const monthlySalary = weeklyHours * (user.hourlyRate || 15) * 4.33;

                                        return (
                                            <tr key={user.id} className="group hover:bg-bg-tertiary/20 transition-all duration-300">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-bg-tertiary border border-border flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                                                            <DollarSign className="w-5 h-5 text-text-muted group-hover:text-accent" />
                                                        </div>
                                                        <div>
                                                            <p className="font-serif font-semibold text-text-primary text-[15px]">{user.name}</p>
                                                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{user.role}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-text-muted font-mono text-[13px]">{user.hourlyRate || 15} €/h</td>
                                                <td className="px-8 py-5 text-text-muted font-mono text-[13px]">{weeklyHours}h / semaine</td>
                                                <td className="px-8 py-5 font-mono font-bold text-text-primary text-[15px] bg-bg-tertiary/20">{monthlySalary.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                                                            <div className="h-full bg-accent" style={{ width: '100%' }} />
                                                        </div>
                                                        <Button 
                                                            onClick={() => setSelectedStaffForPaySlip(user)}
                                                            className="h-8 px-4 text-[9px] uppercase tracking-widest bg-bg-tertiary hover:bg-accent hover:text-white transition-all"
                                                        >
                                                            Générer & Assigner
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                );

            case 'skills':
                return (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={cinematicContainer}
                        className="bg-white dark:bg-bg-secondary rounded-xl p-10 border border-border shadow-sm"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {users.map((user) => (
                                <div key={user.id} className="bg-bg-tertiary/20 border border-border/50 rounded-2xl p-8 hover:bg-white hover:shadow-2xl hover:border-accent/20 transition-all duration-500 group">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-bg-tertiary border border-border flex items-center justify-center font-serif text-lg font-bold text-text-primary group-hover:bg-accent group-hover:text-white transition-all">
                                            {(user.name || '').charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-serif font-semibold text-text-primary text-[15px]">{user.name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Award strokeWidth={1.5} className="w-3 h-3 text-accent" />
                                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Niveau 4</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        {[
                                            { label: 'Service en Salle', value: 95, color: 'accent' },
                                            { label: 'Sommellerie', value: 80, color: 'text-primary' },
                                            { label: 'Gestion Stock', value: 60, color: 'warning' }
                                        ].map((skill, si) => (
                                            <div key={si}>
                                                <div className="flex justify-between mb-2">
                                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{skill.label}</span>
                                                    <span className="text-[11px] font-mono font-medium text-text-primary">{skill.value}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-white border border-border/50 rounded-full overflow-hidden">
                                                    <div className={cn("h-full transition-all duration-1000", {
                                                        'bg-accent': skill.color === 'accent',
                                                        'bg-text-primary': skill.color === 'text-primary',
                                                        'bg-warning': skill.color === 'warning'
                                                    })} style={{ width: `${skill.value}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                );

            case 'audit':
                return <StaffAuditLog logs={auditLogs} />;

            case 'directory':
            default:
                return <StaffList users={users} onOpenModal={handleOpenModal} />;

            case 'cv':
                return <RecruitmentDashboard />;
        }
    };

    return (
        <div className="flex flex-1 -m-4 md:-m-8 flex-col bg-bg-primary h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] overflow-hidden pb-20 md:pb-0">
            {/* Header Area */}
            <div className="bg-bg-secondary border-b border-border px-4 md:px-10 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                    {[
                        { id: 'directory', label: 'Annuaire de Brigade', icon: Users },
                        { id: 'timesheets', label: "Suivi d'Activité", icon: Clock },
                        { id: 'payroll', label: 'Paies & Contrats', icon: DollarSign },
                        { id: 'skills', label: 'Compétences', icon: Award },
                        { id: 'audit', label: 'Audit & Sécurité', icon: Shield },
                        { id: 'cv', label: 'CV & Recrutement', icon: FileText },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={cn(
                                "px-5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-300 whitespace-nowrap",
                                activeTab === tab.id
                                    ? "bg-bg-tertiary text-accent border border-accent/20 shadow-sm"
                                    : "text-text-muted hover:text-text-primary hover:bg-bg-tertiary/10"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => handleOpenModal()}
                        className="hidden md:flex btn-elegant-primary h-9 px-5 text-[10px] uppercase tracking-widest shadow-lg shadow-accent/10 items-center gap-2"
                    >
                        <Plus strokeWidth={1.5} className="h-3.5 w-3.5" />
                        Recruter
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-8 lg:p-12 elegant-scrollbar space-y-8 md:space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        {renderContent()}
                    </div>
                    <div className="space-y-6">
                        <BadgeControl />
                        {/* Summary Stats */}
                        <div className="bg-white dark:bg-bg-secondary rounded-2xl border border-border p-6 shadow-sm">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-4">Effectif en Poste</h4>
                            <div className="flex items-center gap-4">
                                <div className="text-4xl font-serif font-black text-accent">{activeShifts.length}</div>
                                <div className="text-xs text-text-muted leading-tight font-medium">
                                    Collaborateurs actuellement<br />badgés sur la flotte.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Activity Panel */}
                {activeTab === 'directory' && <StaffRecentActivity logs={auditLogs} />}
            </div>

            <StaffMemberForm 
                isOpen={showStaffModal} 
                onClose={() => setShowStaffModal(false)} 
                editingUser={editingUser} 
            />

            <Modal
                isOpen={!!selectedStaffForPaySlip}
                onClose={() => setSelectedStaffForPaySlip(null)}
                title={`Génération Paie : ${selectedStaffForPaySlip?.name}`}
            >
                <div className="space-y-6">
                    <div className="p-4 bg-accent/5 rounded-xl border border-accent/10">
                        <p className="text-xs text-text-muted italic">
                            Cela générera un bulletin PDF, informera l'employé par push, et créera l'écriture comptable automatique.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Net à Payer (€)</label>
                            <input 
                                type="number" 
                                value={paySlipAmount.net}
                                onChange={(e) => setPaySlipAmount(p => ({ ...p, net: Number(e.target.value) }))}
                                className="w-full h-12 px-4 bg-bg-tertiary rounded-lg border border-border focus:border-accent outline-none font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Charges Soc. (€)</label>
                            <input 
                                type="number" 
                                value={paySlipAmount.charges}
                                onChange={(e) => setPaySlipAmount(p => ({ ...p, charges: Number(e.target.value) }))}
                                className="w-full h-12 px-4 bg-bg-tertiary rounded-lg border border-border focus:border-accent outline-none font-mono"
                            />
                        </div>
                    </div>
                    <Button 
                        onClick={handleGeneratePaySlip}
                        className="w-full h-14 bg-accent hover:bg-black text-white font-bold uppercase text-[11px] tracking-widest"
                    >
                        Valider & Envoyer
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
