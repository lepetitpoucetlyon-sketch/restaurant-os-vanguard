"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Save, Trash2 } from "lucide-react";
import type { User } from "@nexus/contracts";

import {
    ZONES,
    computeLegalWarnings,
} from "./shift-edit/legalSchedulingHelpers";
import { ShiftEditHeader } from "./shift-edit/ShiftEditHeader";
import { ShiftServiceForm } from "./shift-edit/ShiftServiceForm";

import type { ShiftType, Shift } from "./shift-edit/shiftTypes";
export type { ShiftType, Shift };

export { ZONES };

interface ShiftEditModalProps {
    shift: Shift | null;
    user: User | null;
    date: Date | null;
    onClose: () => void;
    onSave: (shift: Shift) => void;
    onDelete: (shiftId: string) => void;
    onCreate: (newShift: Omit<Shift, "id">) => void;
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
                <ShiftEditHeader
                    user={user}
                    date={date}
                    isNew={isNew}
                    onClose={onClose}
                />

                <ShiftServiceForm
                    formData={formData}
                    setFormData={setFormData}
                    legalWarnings={legalWarnings}
                    handleTypeChange={handleTypeChange}
                />

                {/* Modal Footer */}
                <div className="p-10 bg-[--color-surface-primary] border-t border-subtle flex items-center justify-between gap-6">
                    {!isNew ? (
                        <button
                            onClick={() => {
                                if (shift) onDelete(shift.id);
                                onClose();
                            }}
                            className="h-16 px-10 rounded-full text-chip-label text-status-danger hover:bg-surface-bg transition-all flex items-center gap-3"
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
                            className="h-16 px-10 rounded-full text-chip-label text-muted hover:text-primary transition-all"
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
