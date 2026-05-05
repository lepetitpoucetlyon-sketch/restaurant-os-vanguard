"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { X, Clock, MapPin, Save, Trash2 } from "lucide-react";
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

interface ShiftEditModalProps {
    shift: Shift | null;
    user: User | null;
    date: Date | null;
    onClose: () => void;
    onSave: (shift: Shift) => void;
    onDelete: (shiftId: string) => void;
    onCreate: (newShift: Omit<Shift, "id">) => void;
}

export function ShiftEditModal({
    shift,
    user,
    date,
    onClose,
    onSave,
    onDelete,
    onCreate,
}: ShiftEditModalProps) {
    const isNew = !shift;
    const [formData, setFormData] = useState({
        startTime: shift?.startTime || "11:00",
        endTime: shift?.endTime || "15:00",
        type: shift?.type || ("lunch" as ShiftType),
        zoneId: shift?.zoneId || ZONES[0].id,
    });

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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-in fade-in duration-500">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-bg-primary rounded-[3rem] shadow-[0_32px_128px_rgba(0,0,0,0.5)] w-full max-w-lg overflow-hidden border border-white/10"
            >
                {/* Modal Header */}
                <div className="bg-[#111] p-10 text-white relative overflow-hidden">
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
                                    <div className="w-full h-full flex items-center justify-center font-serif text-3xl italic text-white/50">
                                        {(user.name || '').charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h2 className="text-3xl font-serif italic tracking-tight">
                                    {isNew ? "Nouveau Protocole" : "Rectification Shift"}
                                </h2>
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mt-2">
                                    {user.name} • {format(date, "EEEE d MMMM", { locale: fr })}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-12 h-12 rounded-full bg-[--color-surface-primary]/5 hover:bg-[--color-surface-primary]/10 flex items-center justify-center transition-all"
                        >
                            <X className="w-5 h-5 text-white/50" />
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-10 space-y-10 bg-[#050505]">
                    {/* Service Type Selector */}
                    <div>
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] mb-4 block italic">
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
                                            : "border-white/5 bg-[--color-surface-primary]/5 text-white hover:border-accent/30"
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
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-4 block italic">
                                Déclenchement
                            </label>
                            <div className="relative group">
                                <Clock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-hover:text-accent transition-colors" />
                                <input
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            startTime: e.target.value,
                                        }))
                                    }
                                    className="w-full pl-14 pr-6 py-5 rounded-[1.5rem] bg-[--color-surface-primary]/5 border border-white/10 text-sm font-black text-white focus:outline-none focus:border-accent/40 transition-all shadow-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-4 block italic">
                                Clôture
                            </label>
                            <div className="relative group">
                                <Clock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-hover:text-accent transition-colors" />
                                <input
                                    type="time"
                                    value={formData.endTime}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            endTime: e.target.value,
                                        }))
                                    }
                                    className="w-full pl-14 pr-6 py-5 rounded-[1.5rem] bg-[--color-surface-primary]/5 border border-white/10 text-sm font-black text-white focus:outline-none focus:border-accent/40 transition-all shadow-sm"
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
                <div className="p-10 bg-[--color-surface-primary] border-t border-neutral-50 flex items-center justify-between gap-6">
                    {!isNew ? (
                        <button
                            onClick={() => {
                                onDelete(shift!.id);
                                onClose();
                            }}
                            className="h-16 px-10 rounded-full text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all flex items-center gap-3"
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
                            className="h-16 px-10 rounded-full text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-black transition-all"
                        >
                            ANNULER
                        </button>
                        <button
                            onClick={handleSave}
                            className="h-16 px-12 bg-black text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-4"
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
