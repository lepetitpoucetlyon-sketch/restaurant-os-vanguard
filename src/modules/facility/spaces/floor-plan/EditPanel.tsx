"use client";

import { Table, TableStatus } from "@nexus/contracts";
import { useAtomValue } from "jotai";
import { zonesAtom } from "@/store/pillars/ops";
import {
    Trash2,
    Armchair,
    Minus,
    Plus,
    X,
    MapPin,
    Activity,
    Check
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { motion } from "framer-motion";
import { slideInLeft } from "@/shared/utils/motion";
import { STATUS_COLORS } from "./constants";

interface EditPanelProps {
    selectedTable: Table;
    updateTable: (id: string, data: Partial<Table>) => Promise<void>;
    deleteTable: (id: string) => Promise<void>;
    onClose: () => void;
    isDarkMode: boolean;
}

export const EditPanel = ({
    selectedTable,
    updateTable,
    deleteTable,
    onClose,
    isDarkMode
}: EditPanelProps) => {
    const zones = useAtomValue(zonesAtom) ?? [];

    if (!selectedTable) return null;

    return (
        <motion.div
            variants={slideInLeft}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute top-4 left-2 sm:left-4 w-[calc(100vw-1rem)] sm:w-80 bg-bg-primary/95 dark:bg-bg-secondary/95 backdrop-blur-xl rounded-[24px] shadow-2xl border border-border z-50 overflow-hidden flex flex-col max-h-[70dvh] sm:max-h-[calc(100vh-40px)]"
        >
            <div className="flex items-center justify-between p-6 border-b border-border bg-bg-tertiary/20">
                <div className="space-y-1">
                    <motion.h3
                        key={selectedTable.id + selectedTable.number}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-2xl font-serif font-light text-text-primary italic tracking-tight"
                    >
                        Table {selectedTable.number}<span className="text-accent-gold not-italic">.</span>
                    </motion.h3>
                    <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.3em]">Signature Configuration</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center bg-surface-card dark:bg-bg-secondary border border-border rounded-full text-text-muted hover:text-text-primary transition-all shadow-premium"
                >
                    <X className="w-4 h-4" />
                </motion.button>
            </div>

            <div className="flex-1 p-6 space-y-8 elegant-scrollbar overflow-y-auto pb-32">
                <div className="space-y-6">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] flex items-center gap-3">
                        <Activity className="w-4 h-4 text-accent-gold" />
                        Statut Op&eacute;rationnel
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {Object.entries(STATUS_COLORS).map(([status, color]) => (
                            <motion.button
                                key={status}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={async () => await updateTable(selectedTable.id, { status: status as TableStatus })}
                                className={cn(
                                    "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all relative overflow-hidden",
                                    selectedTable.status === status
                                        ? "bg-surface-card dark:bg-bg-secondary border-accent-gold shadow-glow"
                                        : "bg-bg-tertiary/50 border-border opacity-60 hover:opacity-100"
                                )}
                            >
                                <div className="w-3 h-3 rounded-full mb-3" style={{ backgroundColor: color }} />
                                <span className="text-[9px] font-black uppercase tracking-wider text-text-primary">{status}</span>
                                {selectedTable.status === status && (
                                    <div className="absolute top-0 right-0 w-2 h-2 bg-accent-gold rounded-bl-lg" />
                                )}
                            </motion.button>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-accent-gold" />
                        Localisation Dynamique
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                        {zones.map((zone: import("@nexus/contracts").Zone) => (
                            <motion.button
                                key={zone.id}
                                whileHover={{ scale: 1.02, x: 5 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => updateTable(selectedTable.id, { zoneId: zone.id })}
                                className={cn(
                                    "flex items-center justify-between p-5 rounded-2xl border transition-all group",
                                    selectedTable.zoneId === zone.id
                                        ? "bg-surface-card dark:bg-bg-secondary border-accent-gold shadow-glow text-text-primary"
                                        : "bg-bg-tertiary/50 border-border text-text-muted hover:border-text-primary hover:bg-surface-card dark:hover:bg-bg-secondary"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: String(zone.color || '') }} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{String(zone.name || '')}</span>
                                </div>
                                {selectedTable.zoneId === zone.id ? (
                                    <Check className="w-4 h-4 text-accent-gold font-black" />
                                ) : (
                                    <span className="text-[9px] font-black opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest text-accent-gold">Transférer</span>
                                )}
                            </motion.button>
                        ))}
                    </div>
                </div>

                <div className="h-px bg-border my-4" />

                <div className="grid grid-cols-2 gap-4">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={async () => await updateTable(selectedTable.id, { shape: 'rect', width: 80, height: 80, radius: undefined })}
                        className={cn(
                            "flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 transition-all group",
                            selectedTable.shape === 'rect'
                                ? "border-accent-gold bg-surface-card dark:bg-bg-secondary shadow-glow text-accent-gold"
                                : "border-border bg-bg-tertiary/50 text-text-muted hover:border-text-primary"
                        )}
                    >
                        <div className={cn("w-10 h-8 border-2 rounded-lg mb-4 transition-colors", selectedTable.shape === 'rect' ? "border-accent-gold" : "border-text-muted group-hover:border-text-primary")} />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">Rectangle</span>
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={async () => await updateTable(selectedTable.id, { shape: 'circle', radius: 40, width: undefined, height: undefined })}
                        className={cn(
                            "flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 transition-all group",
                            selectedTable.shape === 'circle'
                                ? "border-accent-gold bg-surface-card dark:bg-bg-secondary shadow-glow text-accent-gold"
                                : "border-border bg-bg-tertiary/50 text-text-muted hover:border-text-primary"
                        )}
                    >
                        <div className={cn("w-10 h-10 border-2 rounded-full mb-4 transition-colors", selectedTable.shape === 'circle' ? "border-accent-gold" : "border-text-muted group-hover:border-text-primary")} />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">Cercle</span>
                    </motion.button>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
                            <Armchair className="w-4 h-4" />
                            Couverts
                        </label>
                        <motion.span
                            key={selectedTable.seats}
                            initial={{ scale: 1.5, color: isDarkMode ? "#C5A059" : "#000000" }}
                            animate={{ scale: 1, color: isDarkMode ? "#C5A059" : "#000000" }}
                            className="text-sm font-black"
                        >
                            {selectedTable.seats}
                        </motion.span>
                    </div>
                    <div className="flex items-center gap-3">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={async () => await updateTable(selectedTable.id, { seats: Math.max(1, selectedTable.seats - 1) })}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-bg-tertiary hover:bg-bg-secondary text-text-primary transition-colors"
                        >
                            <Minus className="w-4 h-4" />
                        </motion.button>
                        <input
                            type="range"
                            min="1"
                            max="12"
                            value={selectedTable.seats}
                            onChange={(e) => updateTable(selectedTable.id, { seats: parseInt(e.target.value) })}
                            className="flex-1 accent-text-primary dark:accent-accent h-2 bg-bg-tertiary rounded-full appearance-none cursor-pointer"
                        />
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={async () => await updateTable(selectedTable.id, { seats: Math.min(20, selectedTable.seats + 1) })}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-text-primary hover:bg-surface-sidebar text-text-primary transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </motion.button>
                    </div>
                </div>

                <div className="pt-6 border-t border-subtle dark:border-border">
                    <motion.button
                        whileHover={{ scale: 1.02, backgroundColor: "rgb(254 226 226 / 0.1)", color: "#EF4444" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={async () => {
                            if (confirm('Supprimer cette table ?')) {
                                await deleteTable(selectedTable.id);
                                onClose();
                            }
                        }}
                        className="w-full flex items-center justify-center gap-2 text-status-danger bg-status-danger/10 dark:bg-status-danger/20 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                        Supprimer la table
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};

