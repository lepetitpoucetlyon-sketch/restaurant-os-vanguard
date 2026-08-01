"use client";

import { useState } from "react";
import { X, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/ui.foundations";

export interface GroupFormData {
    name: string;
    minCovers: number;
    maxCovers: number;
    notes: string;
}

interface GroupFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: GroupFormData) => Promise<void> | void;
}

const INITIAL: GroupFormData = { name: "", minCovers: 10, maxCovers: 50, notes: "" };

export function GroupFormModal({ isOpen, onClose, onSave }: GroupFormModalProps) {
    const [form, setForm] = useState<GroupFormData>(INITIAL);
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        if (!form.name.trim()) return;
        setSaving(true);
        try {
            await onSave(form);
            setForm(INITIAL);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setForm(INITIAL);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="group-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 20 }}
                        transition={{ type: "spring", stiffness: 420, damping: 30 }}
                        className="bg-bg-primary border border-border rounded-[2rem] p-8 w-full max-w-md shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-accent" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black uppercase tracking-widest text-text-primary">
                                        Nouveau Groupe
                                    </h2>
                                    <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">
                                        Banquet / Séminaire / Événement
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-5">
                            {/* Name */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                    Nom du groupe *
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                    placeholder="Ex: Séminaire Acme Corp…"
                                    className="w-full bg-bg-secondary border border-border rounded-2xl px-5 py-3 text-sm text-text-primary focus:outline-none focus:border-accent/50 transition-all"
                                />
                            </div>

                            {/* Covers range */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                        Couverts min
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={form.minCovers}
                                        onChange={(e) => setForm((f) => ({ ...f, minCovers: Math.max(1, Number(e.target.value)) }))}
                                        className="w-full bg-bg-secondary border border-border rounded-2xl px-5 py-3 text-sm text-text-primary focus:outline-none focus:border-accent/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                        Couverts max
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={form.maxCovers}
                                        onChange={(e) => setForm((f) => ({ ...f, maxCovers: Math.max(1, Number(e.target.value)) }))}
                                        className="w-full bg-bg-secondary border border-border rounded-2xl px-5 py-3 text-sm text-text-primary focus:outline-none focus:border-accent/50 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                    Notes
                                </label>
                                <textarea
                                    value={form.notes}
                                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                                    placeholder="Demandes spéciales, allergies, disposition…"
                                    rows={3}
                                    className="w-full bg-bg-secondary border border-border rounded-2xl px-5 py-3 text-sm text-text-primary focus:outline-none focus:border-accent/50 transition-all resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={handleClose}
                                className="flex-1 h-12 rounded-2xl border border-border text-text-muted text-[11px] font-black uppercase tracking-widest hover:border-text-muted/40 hover:text-text-primary transition-all"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!form.name.trim() || saving}
                                className={cn(
                                    "flex-1 h-12 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg",
                                    "bg-accent text-bg-primary hover:shadow-accent/20 disabled:opacity-40 disabled:cursor-not-allowed"
                                )}
                            >
                                {saving ? "Enregistrement…" : "Créer le groupe"}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
