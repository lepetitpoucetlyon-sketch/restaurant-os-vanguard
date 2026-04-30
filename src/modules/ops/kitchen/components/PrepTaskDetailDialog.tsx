"use client";

import { X, Utensils, Scale, Clock, Thermometer, Users, CheckCircle2, AlertTriangle, FileText, RotateCcw } from "lucide-react";
import { Button } from "@ui/button";
import { cn } from "@/lib/ui.foundations";;
import { Modal } from "@ui/Modal";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion";
import type { MiseEnPlaceTask } from "@nexus/contracts";

interface PrepTaskDetailDialogProps {
    isOpen: boolean;
    onClose: () => void;
    task: MiseEnPlaceTask | null;
    onToggleStatus: (id: string) => void;
}

export function PrepTaskDetailDialog({ isOpen, onClose, task, onToggleStatus }: PrepTaskDetailDialogProps) {
    // Forced to light mode

    if (!task) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="lg"
            variant="premium"
            className="p-0 max-w-4xl w-full border border-border shadow-2xl overflow-hidden rounded-[32px]"
            showClose={false}
            noPadding
        >
            <div className="flex flex-col h-[85vh] transition-colors duration-500 bg-white">
                {/* Modal Header */}
                <div className="relative p-10 overflow-hidden transition-colors duration-500 bg-gradient-to-br from-[#F1F0EA] via-white to-[#F1F0EA]">
                    <div className="absolute inset-0 opacity-[0.05] transition-opacity" style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/carbon-fibre.png")` }} />

                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-8 right-8 w-12 h-12 backdrop-blur-md rounded-2xl flex items-center justify-center transition-all duration-300 z-10 border cursor-pointer bg-black/5 hover:bg-black/10 text-black border-black/10"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="flex items-center gap-8 relative z-10">
                        <motion.div
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="w-20 h-20 rounded-[2rem] bg-accent flex items-center justify-center shadow-2xl shadow-accent/20"
                        >
                            <Utensils className="w-10 h-10 text-white" />
                        </motion.div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border",
                                    task.isCompleted
                                        ? "bg-success/10 text-success border-success/20"
                                        : "bg-warning/10 text-warning border-warning/20"
                                )}>
                                    {task.isCompleted ? "Protocol Terminé" : "Opération en cours"}
                                </span>
                            </div>
                            <h1 className="text-4xl font-serif font-black tracking-tight leading-tight transition-colors text-black">{task.name}</h1>
                        </div>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-auto p-10 elegant-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {/* Left Column - Metrics */}
                        <div className="space-y-6">
                            {[
                                { icon: Scale, label: "Quantité Requise", value: `${task.quantity} ${task.unit}`, sub: "Volume cible", color: "text-accent" },
                                { icon: Clock, label: "Échéance Service", value: "18:30", sub: "Mise en place soir", color: "text-warning" },
                                { icon: Thermometer, label: "Température", value: "4°C - 8°C", sub: "Normes HACCP", color: "text-error" },
                                { icon: Users, label: "Opérateur", value: "Jean Bon", sub: "Station Larder", color: "text-info" },
                            ].map((card, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * idx }}
                                    className={cn(
                                        "group p-6 rounded-[2rem] border shadow-sm hover:shadow-xl hover:shadow-accent/5 transition-all duration-500 bg-bg-primary border-black/5"
                                    )}
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={cn("w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all duration-300 shadow-inner")}>
                                            <card.icon className={cn("w-5 h-5", card.color, "group-hover:text-white")} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-text-muted tracking-[0.2em]">{card.label}</span>
                                    </div>
                                    <div className="text-2xl font-serif font-black text-text-primary tracking-tight">{card.value}</div>
                                    <p className="text-[11px] text-text-muted mt-2 font-bold uppercase tracking-widest opacity-60">{card.sub}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Right Column - Steps & Intelligence */}
                        <div className="md:col-span-2 space-y-10">
                            <div>
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-text-primary">Protocole d'Exécution</h3>
                                    <div className="h-px flex-1 bg-border/50 mx-6" />
                                </div>

                                <motion.div
                                    variants={staggerContainer}
                                    initial="hidden"
                                    animate="visible"
                                    className="space-y-4"
                                >
                                    {[
                                        { step: 1, instruction: "Rassembler tous les ingrédients nécessaires", duration: "2 min", done: true },
                                        { step: 2, instruction: "Vérifier la fraîcheur et la qualité des produits", duration: "3 min", done: true },
                                        { step: 3, instruction: "Préparer le plan de travail et les ustensiles", duration: "5 min", done: false },
                                        { step: 4, instruction: "Suivre la fiche technique associée", duration: "15 min", done: false },
                                        { step: 5, instruction: "Portionner selon les quantités requises", duration: "10 min", done: false },
                                        { step: 6, instruction: "Étiqueter et stocker correctement", duration: "5 min", done: false },
                                    ].map((item, idx) => (
                                        <motion.div
                                            key={item.step}
                                            variants={staggerItem}
                                            className={cn(
                                                "flex items-center gap-6 p-4 rounded-[1.5rem] border transition-all duration-300",
                                                item.done
                                                    ? "bg-success/5 border-success/20"
                                                    : "bg-white border-black/5 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-10 h-10 rounded-[1rem] flex items-center justify-center font-black text-sm shrink-0 transition-all duration-500",
                                                item.done ? "bg-success text-white scale-110 shadow-lg shadow-success/20" : "bg-bg-tertiary text-text-primary group-hover:bg-accent group-hover:text-white"
                                            )}>
                                                {item.done ? <CheckCircle2 className="w-5 h-5" /> : item.step}
                                            </div>
                                            <div className="flex-1">
                                                <p className={cn(
                                                    "font-serif font-black text-[17px] tracking-tight",
                                                    item.done ? "text-success/50 line-through" : "text-text-primary"
                                                )}>
                                                    {item.instruction}
                                                </p>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                                                        <Clock className="w-3 h-3" />
                                                        {item.duration} ESTIMÉ
                                                    </span>
                                                    {!item.done && (
                                                        <span className="text-[9px] font-black text-accent uppercase tracking-widest bg-accent/10 px-2 py-0.5 rounded">Priorité Alpha</span>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </div>

                            {/* Intelligence & Warnings */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 }}
                                className="bg-warning/5 rounded-[2.5rem] p-10 border border-warning/20 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-warning/5 -mr-32 -mt-32 rounded-full blur-3xl" />
                                <div className="flex items-center gap-4 mb-8 relative z-10">
                                    <div className="w-12 h-12 bg-warning/20 rounded-2xl flex items-center justify-center shadow-inner">
                                        <AlertTriangle className="w-6 h-6 text-warning" />
                                    </div>
                                    <span className="text-[12px] font-black uppercase text-warning tracking-[0.4em]">Points d'Attention Critiques</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                    {[
                                        "Respecter scrupuleusement la chaîne du froid",
                                        "Vérifier les DLC avant utilisation",
                                        "Calibrage précis des balances requis",
                                        "Nettoyage zone post-opération obligatoire"
                                    ].map((note, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-warning mt-2 shrink-0" />
                                            <p className="text-[13px] text-text-muted font-bold tracking-tight">{note}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-10 bg-bg-tertiary/50 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-6">
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1 md:flex-none rounded-2xl font-black h-14 border-border px-8 bg-white hover:bg-bg-tertiary transition-all text-[11px] uppercase tracking-widest"
                        onClick={onClose}
                    >
                        Fermer
                    </Button>

                    <Button
                        className={cn(
                            "w-full md:w-auto h-16 px-12 rounded-2xl font-black transition-all duration-500 transform hover:scale-105 shadow-2xl text-[12px] uppercase tracking-[0.2em]",
                            task.isCompleted
                                ? "bg-text-muted hover:bg-text-primary text-white"
                                : "bg-success hover:bg-success/90 text-white shadow-success/20"
                        )}
                        onClick={() => onToggleStatus(task.id)}
                    >
                        {task.isCompleted ? (
                            <div className="flex items-center">
                                <RotateCcw className="w-5 h-5 mr-4" /> Marquer non terminé
                            </div>
                        ) : (
                            <div className="flex items-center">
                                <CheckCircle2 className="w-5 h-5 mr-4" /> Finaliser l'Opération
                            </div>
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
