"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { X, Clock, MapPin, Save, Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/ui.foundations";;
import type { User } from "@nexus/contracts";
import { PremiumSelect } from "@ui/PremiumSelect";

// Types
export type ShiftType = "lunch" | "evening" | "double";

export interface Shift {
    id: string;
    userId: string;
    date: Date;
    startTime: string;
    endTime: string;
    zoneId?: string;
    type: ShiftType;
    status: "published" | "draft";
}

// Available Zones (would normally come from TablesContext)
export const ZONES = [
    { id: "main", name: "Salle Principale" },
    { id: "terrace", name: "Terrasse" },
    { id: "vip", name: "Carré VIP" },
    { id: "bar", name: "Bar" },
];

// ─── Legal scheduling helpers ───────────────────────────────────────────────

function parseTimeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

function shiftDurationHours(startTime: string, endTime: string): number {
    let diff = parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime);
    if (diff < 0) diff += 24 * 60; // overnight
    return diff / 60;
}

interface LegalWarning {
    label: string;
}

function computeLegalWarnings(
    startTime: string,
    endTime: string,
    date: Date,
    otherShifts: Shift[]
): LegalWarning[] {
    const warnings: LegalWarning[] = [];
    const duration = shiftDurationHours(startTime, endTime);

    // 1. Excessive duration
    if (duration > 10) {
        warnings.push({ label: `Durée excessive (${duration.toFixed(1)}h > 10h max)` });
    }

    // 2. Rest between shifts
    const [sh, sm] = startTime.split(":").map(Number);
    const thisStart = new Date(date);
    thisStart.setHours(sh, sm, 0, 0);

    for (const s of otherShifts) {
        const sDate = new Date(s.date);
        const [eh, em] = s.endTime.split(":").map(Number);
        const prevEnd = new Date(sDate);
        prevEnd.setHours(eh, em, 0, 0);

        if (prevEnd < thisStart) {
            const restH = (thisStart.getTime() - prevEnd.getTime()) / (1000 * 3600);
            if (restH < 11) {
                warnings.push({
                    label: `Repos insuffisant (${restH.toFixed(1)}h < 11h min)`,
                });
            }
        }
    }

    // 3. Weekly total > 48h
    const weekStart = new Date(date);
    const dow = weekStart.getDay(); // 0 = sunday
    weekStart.setDate(weekStart.getDate() - ((dow + 6) % 7)); // back to monday
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    let weeklyHours = duration;
    for (const s of otherShifts) {
        const sDate = new Date(s.date);
        if (sDate >= weekStart && sDate < weekEnd) {
            weeklyHours += shiftDurationHours(s.startTime, s.endTime);
        }
    }
    if (weeklyHours > 48) {
        warnings.push({
            label: `Dépassement hebdomadaire (${weeklyHours.toFixed(1)}h > 48h max)`,
        });
    }

    return warnings;
}

// ────────────────────────────────────────────────────────────────────────────

interface ShiftEditModalProps {
    shift: Shift | null;
    user: User | null;
    date: Date | null;
    onClose: () => void;
    onSave: (shift: Shift) => void;
    onDelete: (shiftId: string) => void;
    onCreate: (newShift: Omit<Shift, "id">) => void;
    /** All other shifts for this user — used for legal warning computation */
    allUserShifts?: Shift[];
}

export function ShiftEditModal({
    shift,
    user,
    date,
    onClose,
    onSave,
    onDelete,
    onCreate,
    allUserShifts = [],
}: ShiftEditModalProps) {
    const isNew = !shift;
    const [formData, setFormData] = useState({
        startTime: shift?.startTime || "11:00",
        endTime: shift?.endTime || "15:00",
        type: shift?.type || ("lunch" as ShiftType),
        zoneId: shift?.zoneId || ZONES[0].id,
    });

    // Exclude the current shift from the "other shifts" list used for warnings
    const otherShifts = useMemo(
        () => allUserShifts.filter((s) => s.id !== shift?.id),
        [allUserShifts, shift]
    );

    const legalWarnings = useMemo(() => {
        if (!date) return [];
        return computeLegalWarnings(
            formData.startTime,
            formData.endTime,
            date,
            otherShifts
        );
    }, [formData.startTime, formData.endTime, date, otherShifts]);

    const handleSave = () => {
        if (isNew && user && date) {
            onCreate({
                userId: user.id,
                date: date,
                startTime: formData.startTime,
                endTime: formData.endTime,
                type: formData.type,
                zoneId: formData.zoneId,
                status: "draft",
            });
        } else if (shift) {
            onSave({
                ...shift,
                startTime: formData.startTime,
                endTime: formData.endTime,
                type: formData.type,
                zoneId: formData.zoneId,
            });
        }
        onClose();
    };

    const handleTypeChange = (type: ShiftType) => {
        setFormData((prev) => ({
            ...prev,
            type,
            startTime:
                type === "evening" ? "18:00" : type === "lunch" ? "11:00" : "09:00",
            endTime:
                type === "evening" ? "23:00" : type === "lunch" ? "15:00" : "17:00",
        }));
    };

    if (!user || !date) return null;

    return (
        <div className="fixed inset-0 bg-surface-sidebar/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-in fade-in duration-500">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-bg-primary rounded-[3rem] shadow-[0_32px_128px_rgba(0,0,0,0.5)] w-full max-w-lg overflow-hidden border border-subtle"
            >
                {/* Modal Header */}
                <div className="bg-[#111] p-10 text-text-primary relative overflow-hidden">
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-[2rem] bg-[--color-surface-primary]/10 flex items-center justify-center relative overflow-hidden shadow-2xl">
                                {user.avatar ? (
                                    <img
                                        src={user.avatar}
                                        className="w-full h-full object-cover"
                                        alt={user.name}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-serif text-3xl italic text-text-primary/50">
                                        {(user.name || '').charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h2 className="text-3xl font-serif italic tracking-tight">
                                    {isNew ? "Nouveau Protocole" : "Rectification Shift"}
                                </h2>
                                <p className="text-[10px] font-black text-text-primary/30 uppercase tracking-[0.3em] mt-2">
                                    {user.name} • {format(date, "EEEE d MMMM", { locale: fr })}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-12 h-12 rounded-full bg-[--color-surface-primary]/5 hover:bg-[--color-surface-primary]/10 flex items-center justify-center transition-all"
                        >
                            <X className="w-5 h-5 text-text-primary/50" />
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-10 space-y-10 bg-[#050505]">
                    {/* Legal Scheduling Warnings */}
                    {legalWarnings.length > 0 && (
                        <div className="space-y-2">
                            {legalWarnings.map((w, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-action-primary/10 border border-action-primary/30 text-action-primary"
                                >
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                    <span className="text-xs font-bold uppercase tracking-widest">
                                        {w.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Service Type Selector */}
                    <div>
                        <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] mb-4 block italic">
                            Assignation du Service
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { id: "lunch", label: "Midi", emoji: "☀️" },
                                { id: "evening", label: "Soir", emoji: "🌙" },
                                { id: "double", label: "Coupure", emoji: "🔄" },
                            ].map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => handleTypeChange(type.id as ShiftType)}
                                    className={cn(
                                        "p-6 rounded-[2rem] border transition-all group flex flex-col items-center",
                                        formData.type === type.id
                                            ? "border-accent bg-accent text-bg-primary shadow-2xl"
                                            : "border-white/5 bg-[--color-surface-primary]/5 text-text-primary hover:border-accent/30"
                                    )}
                                >
                                    <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                                        {type.emoji}
                                    </span>
                                    <p className="text-[10px] font-black uppercase tracking-widest">
                                        {type.label}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <label className="text-[10px] font-black text-text-primary/40 uppercase tracking-[0.3em] mb-4 block italic">
                                Déclenchement
                            </label>
                            <div className="relative group">
                                <Clock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-text-primary/20 group-hover:text-accent transition-colors" />
                                <input
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            startTime: e.target.value,
                                        }))
                                    }
                                    className="w-full pl-14 pr-6 py-5 rounded-[1.5rem] bg-[--color-surface-primary]/5 border border-subtle text-sm font-black text-text-primary focus:outline-none focus:border-accent/40 transition-all shadow-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-text-primary/40 uppercase tracking-[0.3em] mb-4 block italic">
                                Clôture
                            </label>
                            <div className="relative group">
                                <Clock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-text-primary/20 group-hover:text-accent transition-colors" />
                                <input
                                    type="time"
                                    value={formData.endTime}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            endTime: e.target.value,
                                        }))
                                    }
                                    className="w-full pl-14 pr-6 py-5 rounded-[1.5rem] bg-[--color-surface-primary]/5 border border-subtle text-sm font-black text-text-primary focus:outline-none focus:border-accent/40 transition-all shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0A0A0A] p-6 rounded-[2rem] border border-white/5">
                        <PremiumSelect
                            label="Juridiction de Service"
                            value={formData.zoneId || ''}
                            onChange={(val) => setFormData(prev => ({ ...prev, zoneId: val }))}
                            options={ZONES.map(zone => ({ value: zone.id, label: zone.name.toUpperCase() }))}
                            icon={<MapPin className="w-4 h-4" />}
                            className="dark"
                        />
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-10 bg-[--color-surface-primary] border-t border-subtle flex items-center justify-between gap-6">
                    {!isNew ? (
                        <button
                            onClick={() => {
                                onDelete(shift!.id);
                                onClose();
                            }}
                            className="h-16 px-10 rounded-full text-[10px] font-black uppercase tracking-widest text-status-danger hover:bg-surface-bg transition-all flex items-center gap-3"
                        >
                            <Trash2 className="w-4 h-4" />
                            AUTORISER DESTRUCTION
                        </button>
                    ) : (
                        <div />
                    )}
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="h-16 px-10 rounded-full text-[10px] font-black uppercase tracking-widest text-muted hover:text-primary transition-all"
                        >
                            ANNULER
                        </button>
                        <button
                            onClick={handleSave}
                            className="h-16 px-12 bg-surface-sidebar text-text-primary rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-4"
                        >
                            <Save className="w-4 h-4 text-accent" />
                            {isNew ? "SCELLER SHIFT" : "MAINTENIR MODIFICATIONS"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
