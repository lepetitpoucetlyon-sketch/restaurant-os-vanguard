"use client";

import { useState, useMemo } from "react";
import { useAuth, useLanguage } from "@/shared/providers/NexusCoreContext";
import type { User } from "@nexus/contracts";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import {
    Plus,
    Bell,
    Trash2,
    User as UserIcon
} from "lucide-react";
import { Button } from "@ui/button";
import { cn } from "@/lib/ui.foundations";
import { ActionGuard } from "@/shared/components/rbac/ActionGuard";
import { useToast } from "@components/ui/Toast";
import { motion, AnimatePresence } from "framer-motion";
import { usePlanning } from '..';
import type { Shift as ContextShift } from '../types';
import { useIsMobile } from "@/shared/hooks/useIsMobile";
import { ResponsiveShell } from "@/shared/components/ui/ResponsiveShell";
import { BottomSheet } from "@components/ui/BottomSheet";
import { TimePicker } from "@components/ui/TimePicker";
import { TipPoolManager } from "./TipPoolManager";

type Shift = ContextShift;
type ShiftType = 'morning' | 'lunch' | 'evening' | 'double' | 'off';

const ZONES = [
    { id: 'main', name: 'planning.zones.main' },
    { id: 'terrace', name: 'planning.zones.terrace' },
    { id: 'vip', name: 'planning.zones.vip' },
    { id: 'bar', name: 'planning.zones.bar' },
];

export function PlanningDashboard() {
    const isMobile = useIsMobile();
    const { users } = useAuth();
    const { shifts, addShift, updateShift, deleteShift, publishShifts, isLoading } = usePlanning();
    const { showToast } = useToast();
    const { t } = useLanguage();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'daily' | 'staff'>('daily');
    const [selectedDay, setSelectedDay] = useState(new Date());

    // BottomSheet State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [activeShift, setActiveShift] = useState<Shift | null>(null);
    const [activeUser, setActiveUser] = useState<User | null>(null);

    // Edit State
    const [editStartTime, setEditStartTime] = useState("10:00");
    const [editEndTime, setEditEndTime] = useState("15:00");
    const [editType, setEditType] = useState<ShiftType>('lunch');

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = [...Array(7)].map((_, i) => addDays(weekStart, i));

    const dayShifts = useMemo(() => {
        return shifts.filter(s => isSameDay(s.date, selectedDay));
    }, [shifts, selectedDay]);

    const handleCreateShift = (user: User) => {
        setActiveUser(user);
        setActiveShift(null);
        setEditStartTime("10:00");
        setEditEndTime("15:00");
        setEditType('lunch');
        setIsEditOpen(true);
    };

    const handleEditShift = (shift: Shift) => {
        const user = users.find(u => u.id === shift.userId);
        if (user) {
            setActiveUser(user);
            setActiveShift(shift);
            setEditStartTime(shift.startTime);
            setEditEndTime(shift.endTime);
            setEditType(shift.type as ShiftType);
            setIsEditOpen(true);
        }
    };

    const handleHomologuer = () => {
        if (!activeUser) return;

        const shiftData: Omit<Shift, 'id'> = {
            userId: activeUser.id,
            userName: activeUser.name,
            date: format(selectedDay, 'yyyy-MM-dd'),
            startTime: editStartTime,
            endTime: editEndTime,
            type: editType,
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (activeShift) {
            updateShift(activeShift.id, shiftData);
        } else {
            addShift(shiftData);
        }
        setIsEditOpen(false);
    };

    return (
        <div className="flex flex-1 flex-col bg-bg-primary h-[calc(100vh-80px)] lg:h-[calc(100vh-100px)] -m-4 lg:-m-8 overflow-hidden relative pb-24 lg:pb-0">
            {/* Header / Week Navigator */}
            <div className="bg-white/80 dark:bg-bg-primary/80 backdrop-blur-2xl px-6 py-6 border-b border-border/50 sticky top-0 z-40">
                <div className="flex items-center justify-between mb-6">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-serif font-black italic text-text-primary tracking-tight">Planning<span className="text-accent-gold">.</span></h1>
                        {!isMobile && (
                             <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em]">Module de Supervision RH & Paie</p>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-6">
                        {!isMobile && (
                            <ActionGuard page="staff" action="edit_shifts">
                                <Button 
                                    onClick={() => {
                                        const draftIds = shifts
                                            .filter(s => s.status === 'scheduled' && weekDays.some(d => isSameDay(new Date(s.date), d)))
                                            .map(s => s.id);
                                        if (draftIds.length > 0) {
                                            publishShifts(draftIds);
                                            showToast(`${draftIds.length} shifts publiés et provisionnés`, "success");
                                        } else {
                                            showToast("Aucun shift en attente de publication", "info");
                                        }
                                    }}
                                    className="h-12 px-8 bg-action-primary text-text-on-primary rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-action-primary-hover transition-all shadow-xl shadow-action-primary/20"
                                >
                                    <Bell className="w-4 h-4" />
                                    Publier la semaine
                                </Button>
                            </ActionGuard>
                        )}
                        <div className="flex bg-surface-card p-1 rounded-full border border-border-default">
                            <button onClick={() => setViewMode('daily')} className={cn("px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all", viewMode === 'daily' ? "bg-action-primary text-text-on-primary shadow-sm" : "text-text-muted hover:text-text-primary")}>JOUR</button>
                            <button onClick={() => setViewMode('staff')} className={cn("px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all", viewMode === 'staff' ? "bg-action-primary text-text-on-primary shadow-sm" : "text-text-muted hover:text-text-primary")}>STAFF</button>
                        </div>
                    </div>
                </div>

                {/* Day Selection Bar (Sub-Categories) */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    {weekDays.map((day, i) => {
                        const isSelected = isSameDay(day, selectedDay);
                        return (
                            <button
                                key={i}
                                onClick={() => setSelectedDay(day)}
                                className={cn(
                                    "flex flex-col items-center justify-center min-w-[64px] h-20 rounded-2xl border transition-all",
                                    isSelected ? "bg-accent-gold text-text-on-primary border-transparent shadow-xl scale-105" : "bg-bg-tertiary/50 text-text-muted border-border"
                                )}
                            >
                                <span className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">{format(day, "EEE", { locale: fr })}</span>
                                <span className="text-xl font-serif italic font-black">{format(day, "d")}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* List View with Responsive Adaptation */}
            <div className="flex-1 overflow-auto p-4 space-y-4 elegant-scrollbar">
                <ResponsiveShell
                    mobile={
                        <AnimatePresence mode="wait">
                            {viewMode === 'daily' ? (
                                <motion.div key="daily-mobile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                                    {users.map(user => {
                                        const shift = dayShifts.find(s => s.userId === user.id);
                                        return (
                                            <motion.div
                                                key={user.id}
                                                onClick={() => shift ? handleEditShift(shift) : handleCreateShift(user)}
                                                className={cn(
                                                    "bg-surface-card p-4 rounded-2xl border border-border-default flex items-center justify-between shadow-sm active:scale-[0.99] transition-all",
                                                    !shift && "opacity-60 bg-surface-bg"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 rounded-xl bg-surface-bg border border-border-default flex items-center justify-center font-serif italic text-base">
                                                        {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover rounded-xl" /> : user.name[0]}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm text-text-primary">{user.name}</h4>
                                                        <p className="text-[9px] font-black text-action-primary uppercase tracking-widest">{t(`planning.roles.${user.role}`)}</p>
                                                    </div>
                                                </div>
                                                {shift ? (
                                                    <div className="text-right">
                                                        <p className="text-sm font-mono font-bold text-text-primary">{shift.startTime}—{shift.endTime}</p>
                                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-text-muted">{(shift.position ?? '').toUpperCase()}</span>
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full border border-dashed border-border-default flex items-center justify-center text-text-muted">
                                                        <Plus className="w-4 h-4" />
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            ) : (
                                <motion.div key="staff-mobile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                                    {users.map(user => (
                                        <div key={user.id} className="bg-surface-card p-4 rounded-2xl border border-border-default flex flex-col gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-action-primary/10 flex items-center justify-center text-action-primary">
                                                    <UserIcon className="w-4 h-4" />
                                                </div>
                                                <h4 className="font-serif font-black text-sm text-text-primary">{user.name}</h4>
                                            </div>
                                            <div className="grid grid-cols-7 gap-1 h-2">
                                                {weekDays.map((d, i) => (
                                                    <div key={i} className={cn("rounded-full", shifts.some(s => s.userId === user.id && isSameDay(s.date, d)) ? "bg-action-primary" : "bg-surface-bg border border-border-default")} />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    }
                    desktop={
                        <AnimatePresence mode="wait">
                            {viewMode === 'daily' ? (
                                <motion.div key="daily-desktop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                    {users.map(user => {
                                        const shift = dayShifts.find(s => s.userId === user.id);
                                        return (
                                            <motion.div
                                                key={user.id}
                                                onClick={() => shift ? handleEditShift(shift) : handleCreateShift(user)}
                                                className={cn(
                                                    "bg-surface-card p-5 rounded-[2rem] border border-border-default flex items-center justify-between hover:border-action-primary/40 cursor-pointer transition-all",
                                                    !shift && "opacity-60 bg-surface-bg"
                                                )}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 rounded-2xl bg-surface-bg overflow-hidden border border-border-default">
                                                        {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl font-serif italic">{user.name[0]}</div>}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xl font-serif font-black italic text-text-primary">{user.name}</h4>
                                                        <p className="text-[9px] font-black text-action-primary uppercase tracking-widest">{t(`planning.roles.${user.role}`)}</p>
                                                    </div>
                                                </div>
                                                {shift ? (
                                                    <div className="text-right">
                                                        <p className="text-lg font-mono font-bold tracking-tighter text-text-primary">{shift.startTime}—{shift.endTime}</p>
                                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-text-muted">{(shift.position ?? '').toUpperCase()}</span>
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full border border-dashed border-border-default flex items-center justify-center text-text-muted/40">
                                                        <Plus className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            ) : (
                                <motion.div key="staff-desktop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-4">
                                    {users.map(user => (
                                        <div key={user.id} className="bg-surface-card p-6 rounded-[2.5rem] border border-border-default flex flex-col gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-action-primary/10 flex items-center justify-center text-action-primary">
                                                    <UserIcon className="w-6 h-6" />
                                                </div>
                                                <h4 className="text-2xl font-serif font-black italic text-text-primary">{user.name}</h4>
                                            </div>
                                            <div className="grid grid-cols-7 gap-1.5 h-3">
                                                {weekDays.map((d, i) => (
                                                    <div key={i} className={cn("rounded-full", shifts.some(s => s.userId === user.id && isSameDay(s.date, d)) ? "bg-action-primary" : "bg-surface-bg border border-border-default")} />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    }
                />

                <div className="mt-8">
                    <TipPoolManager />
                </div>
            </div>


            {/* Shift Editor BottomSheet */}
            <BottomSheet
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                title={activeUser?.name || "Nouveau Shift"}
                subtitle={`${format(selectedDay, "EEEE d MMMM", { locale: fr })}`}
            >
                <div className="space-y-8 py-6">
                    <div className="grid grid-cols-2 gap-4">
                        <TimePicker 
                            label="Début" 
                            value={editStartTime} 
                            onChange={setEditStartTime} 
                        />
                        <TimePicker 
                            label="Fin" 
                            value={editEndTime} 
                            onChange={setEditEndTime} 
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-text-muted px-2">Service</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['lunch', 'evening', 'double'].map(type => (
                                <button 
                                    key={type} 
                                    onClick={() => setEditType(type as ShiftType)}
                                    className={cn(
                                        "h-12 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                                        editType === type
                                            ? "bg-accent-gold text-text-on-primary border-transparent shadow-lg scale-105"
                                            : "bg-bg-tertiary text-text-muted border-border hover:border-accent-gold/50"
                                    )}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-6 flex gap-3">
                        {activeShift && (
                            <Button variant="ghost" onClick={() => { deleteShift(activeShift.id); setIsEditOpen(false); }} title="Supprimer" className="h-16 w-16 bg-error/10 text-error rounded-2xl hover:bg-error hover:text-text-primary transition-all">
                                <Trash2 className="w-6 h-6" />
                            </Button>
                        )}
                        <Button className="flex-1 h-16 bg-accent-gold text-text-on-primary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-accent-gold/90 shadow-premium shadow-accent-gold/20 active:scale-[0.98] transition-all" onClick={handleHomologuer}>
                            Homologuer le shift
                        </Button>
                    </div>
                </div>
            </BottomSheet>

            {/* Mobile FAB for Quick Actions */}
            {isMobile && !isEditOpen && (
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                        const draftIds = shifts
                            .filter(s => s.status === 'scheduled' && weekDays.some(d => isSameDay(new Date(s.date), d)))
                            .map(s => s.id);
                        if (draftIds.length > 0) {
                            publishShifts(draftIds);
                            showToast(`${draftIds.length} shifts publiés et provisionnés`, "success");
                        } else {
                            showToast("Aucun shift en attente de publication", "info");
                        }
                    }}
                    className="fixed bottom-28 right-6 w-14 h-14 bg-accent text-text-primary rounded-full flex items-center justify-center shadow-2xl z-40 border-4 border-white dark:border-bg-primary"
                >
                    <Bell className="w-6 h-6" />
                </motion.button>
            )}
        </div>
    );
}
