"use client";

// @wip owner:commerce-team échéance:2026-Q4 — composant orphelin à intégrer ou supprimer (audit orphelins 2026-08-30)
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Plus } from "lucide-react";
import { cn } from "@/lib/ui.foundations";

interface ModifierModalProps {
    isOpen: boolean;
    productName: string;
    onSave: (mods: string[]) => void;
    onClose: () => void;
}

const PRESET_MODIFIERS = [
    "Sans oignons",
    "Bien cuit",
    "Sauce à part",
    "Cuisson bleue",
    "Cuisson saignante",
    "Vegan",
    "Sans gluten",
    "Extra fromage",
    "Sans sel",
    "Peu épicé",
] as const;

export function ModifierModal({ isOpen, productName, onSave, onClose }: ModifierModalProps) {
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [freeText, setFreeText] = useState("");

    const togglePreset = (mod: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(mod)) {
                next.delete(mod);
            } else {
                next.add(mod);
            }
            return next;
        });
    };

    const addFreeText = () => {
        const trimmed = freeText.trim();
        if (!trimmed) return;
        setSelected((prev) => new Set([...prev, trimmed]));
        setFreeText("");
    };

    const handleSave = () => {
        onSave(Array.from(selected));
        // Reset for next use
        setSelected(new Set());
        setFreeText("");
    };

    const handleClose = () => {
        setSelected(new Set());
        setFreeText("");
        onClose();
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) handleClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="modifier-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
                    onClick={handleOverlayClick}
                    aria-hidden="true"
                >
                    <motion.div
                        key="modifier-card"
                        role="dialog"
                        aria-modal="true"
                        aria-label={`Modifications pour ${productName}`}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        transition={{ type: "spring", stiffness: 380, damping: 34 }}
                        className="bg-surface-card border border-border rounded-t-[2rem] sm:rounded-[2rem] p-6 w-full sm:w-[480px] max-h-[80vh] flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-widest text-text-primary">
                                    Modifications
                                </h2>
                                <p className="text-micro text-accent-gold font-bold mt-0.5 italic font-serif">
                                    {productName}
                                </p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                                aria-label="Fermer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Preset buttons */}
                        <div className="flex flex-wrap gap-2 mb-5 overflow-y-auto flex-1">
                            {PRESET_MODIFIERS.map((mod) => {
                                const isActive = selected.has(mod);
                                return (
                                    <motion.button
                                        key={mod}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => togglePreset(mod)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2.5 rounded-full border text-micro font-black uppercase tracking-wider transition-all duration-200",
                                            isActive
                                                ? "bg-accent-gold text-text-primary border-accent-gold shadow-lg shadow-accent-gold/20"
                                                : "bg-bg-primary border-border text-text-muted hover:border-accent-gold/40 hover:text-text-primary"
                                        )}
                                    >
                                        {isActive && <Check className="w-3 h-3 shrink-0" />}
                                        {mod}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Free-text input */}
                        <div className="flex gap-2 mb-5">
                            <input
                                type="text"
                                value={freeText}
                                onChange={(e) => setFreeText(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && addFreeText()}
                                placeholder="Instruction personnalisée..."
                                className="flex-1 bg-bg-primary border border-border rounded-full px-4 py-2.5 text-[12px] text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-gold/50 transition-colors"
                            />
                            <button
                                onClick={addFreeText}
                                disabled={!freeText.trim()}
                                className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted hover:bg-accent-gold hover:text-text-primary transition-all disabled:opacity-30"
                                aria-label="Ajouter"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Selected summary */}
                        {selected.size > 0 && (
                            <div className="mb-4 px-3 py-2 bg-accent-gold/5 border border-accent-gold/20 rounded-2xl">
                                <p className="text-chip-label text-accent-gold mb-1">
                                    Sélectionnées ({selected.size})
                                </p>
                                <p className="text-micro text-text-muted">
                                    {Array.from(selected).join(" · ")}
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleClose}
                                className="flex-1 h-12 rounded-full border border-border text-micro font-black uppercase tracking-wider text-text-muted hover:border-border/80 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 h-12 rounded-full bg-accent-gold text-text-primary text-micro font-black uppercase tracking-wider shadow-lg shadow-accent-gold/20 hover:brightness-110 transition-all"
                            >
                                Confirmer
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
