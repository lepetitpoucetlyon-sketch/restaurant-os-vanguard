"use client";

import { Calendar, Clock, Users, MapPin, ChevronLeft, Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/ui.foundations";
import type { Customer } from "@nexus/contracts";
import type { Table } from "@/modules/ops";

interface ResaFormData {
    time: string;
    covers: number;
    tableId: string;
    date: string;
    notes: string;
}

interface ResaStepDetailsProps {
    selectedCustomer: Customer | null;
    formData: ResaFormData;
    setFormData: React.Dispatch<React.SetStateAction<ResaFormData>>;
    suggestedTable: Table | null;
    availableTables: Table[];
    onBack: () => void;
}

const itemV = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export function ResaStepDetails({
    selectedCustomer,
    formData,
    setFormData,
    suggestedTable,
    availableTables,
    onBack,
}: ResaStepDetailsProps) {
    return (
        <motion.div
            key="step2"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="space-y-10"
        >
            <div className="flex items-center gap-5">
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-xl bg-bg-secondary hover:bg-bg-tertiary flex items-center justify-center border border-border transition-all"
                >
                    <ChevronLeft className="w-4 h-4 text-text-primary" />
                </button>
                <div>
                    <p className="text-nano font-black text-text-muted uppercase tracking-widest">Client</p>
                    <p className="text-2xl font-serif italic text-text-primary">
                        {selectedCustomer?.firstName} {selectedCustomer?.lastName}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Date */}
                <motion.div variants={itemV} className="space-y-3">
                    <label className="text-nano font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-accent" /> Date
                    </label>
                    <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData((f) => ({ ...f, date: e.target.value }))}
                        className="w-full h-14 bg-bg-secondary border border-border rounded-2xl px-5 text-base font-mono font-light text-text-primary focus:outline-none focus:border-accent/40 transition-all"
                    />
                </motion.div>

                {/* Time */}
                <motion.div variants={itemV} className="space-y-3">
                    <label className="text-nano font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-accent" /> Heure
                    </label>
                    <input
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData((f) => ({ ...f, time: e.target.value }))}
                        className="w-full h-14 bg-bg-secondary border border-border rounded-2xl px-5 text-xl font-mono font-light text-text-primary focus:outline-none focus:border-accent/40 transition-all"
                    />
                </motion.div>

                {/* Covers */}
                <motion.div variants={itemV} className="space-y-3">
                    <label className="text-nano font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-accent" /> Couverts
                    </label>
                    <div className="flex items-center justify-between bg-bg-secondary border border-border rounded-2xl p-2">
                        <button
                            onClick={() => setFormData((f) => ({ ...f, covers: Math.max(1, f.covers - 1), tableId: "" }))}
                            className="w-9 h-9 rounded-xl bg-bg-tertiary flex items-center justify-center hover:bg-bg-primary transition-all font-black text-lg text-text-primary"
                        >
                            −
                        </button>
                        <span className="text-2xl font-mono font-light text-text-primary">{formData.covers}</span>
                        <button
                            onClick={() => setFormData((f) => ({ ...f, covers: f.covers + 1, tableId: "" }))}
                            className="w-9 h-9 rounded-xl bg-bg-tertiary flex items-center justify-center hover:bg-bg-primary transition-all font-black text-lg text-text-primary"
                        >
                            +
                        </button>
                    </div>
                </motion.div>

                {/* Auto table suggestion */}
                <motion.div variants={itemV} className="space-y-3">
                    <label className="text-nano font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-accent" /> Table
                    </label>
                    {suggestedTable ? (
                        <div className="h-14 bg-accent/5 border border-accent/30 rounded-2xl px-5 flex items-center justify-between">
                            <span className="text-micro font-black text-accent uppercase tracking-widest">
                                Suggérée : Table {suggestedTable.number} ({suggestedTable.seats} pl.)
                            </span>
                            <Check className="w-4 h-4 text-accent" />
                        </div>
                    ) : (
                        <div className="h-14 bg-bg-secondary border border-border rounded-2xl px-5 flex items-center">
                            <span className="text-micro text-text-muted uppercase tracking-widest">
                                Aucune table disponible
                            </span>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Table override grid */}
            {availableTables.length > 0 && (
                <motion.div variants={itemV} className="space-y-4">
                    <p className="text-nano font-black text-text-muted uppercase tracking-widest">
                        Choisir manuellement (optionnel)
                    </p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {availableTables.slice(0, 8).map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setFormData((f) => ({ ...f, tableId: t.id }))}
                                className={cn(
                                    "p-4 rounded-2xl border text-center transition-all",
                                    formData.tableId === t.id
                                        ? "bg-accent border-accent text-bg-primary shadow-md shadow-amber-500/10"
                                        : t.id === suggestedTable?.id
                                        ? "bg-accent/5 border-accent/30 text-text-primary"
                                        : "bg-bg-secondary border-border hover:border-accent/20 text-text-primary"
                                )}
                            >
                                <p className="text-xs font-black">#{t.number}</p>
                                <p className="text-nano text-text-muted mt-0.5">{t.seats} pl.</p>
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Notes */}
            <motion.div variants={itemV} className="space-y-3">
                <label className="text-nano font-black text-text-muted uppercase tracking-widest">Notes</label>
                <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    placeholder="Allergie, préférence, occasion spéciale…"
                    className="w-full bg-bg-secondary border border-border rounded-2xl px-5 py-3 text-sm text-text-primary focus:outline-none focus:border-accent/40 resize-none transition-all"
                />
            </motion.div>
        </motion.div>
    );
}
