
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/ui.foundations";;
import { cinematicContainer, fadeInUp, cinematicItem } from "@/lib/motion";

interface MiseEnPlaceTabProps {
    prepTasks: any[];
    togglePrepTask: (id: string) => Promise<void>;
    onSelectTask: (task: any) => void;
}

export function MiseEnPlaceTab({ prepTasks, togglePrepTask, onSelectTask }: MiseEnPlaceTabProps) {
    return (
        <motion.div
            variants={cinematicContainer}
            initial="hidden"
            animate="visible"
            className="w-full max-w-full xl:max-w-5xl"
        >
            <motion.div variants={fadeInUp} className="flex items-center justify-between mb-10">
                <div>
                    <h2 className="text-3xl font-serif font-semibold text-text-primary tracking-tight">Mise en Place du Jour</h2>
                    <p className="text-text-muted text-[13px] mt-2 font-medium">Tâches de production calculées selon les prévisions de réservations</p>
                </div>
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-success-soft dark:bg-success/10 px-5 py-2.5 rounded-xl border border-success/10"
                >
                    <span className="text-success font-bold text-[11px] uppercase tracking-wider">
                        {prepTasks.filter(t => t.isCompleted).length} / {prepTasks.length} Tâches Terminer
                    </span>
                </motion.div>
            </motion.div>

            <div className="grid gap-4">
                <AnimatePresence mode="popLayout">
                    {prepTasks.map(task => (
                        <motion.div
                            key={task.id}
                            variants={cinematicItem}
                            layout
                            className={cn(
                                "group flex items-center justify-between p-6 rounded-xl border transition-all duration-300 cursor-pointer",
                                task.isCompleted
                                    ? "bg-bg-tertiary/20 border-border/50"
                                    : "bg-bg-secondary border-border hover:border-accent/40 shadow-sm hover:shadow-xl dark:shadow-none font-medium"
                            )}
                        >
                            <div className="flex items-center gap-6" onClick={async (e) => { e.stopPropagation(); await togglePrepTask(task.id); }}>
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className={cn(
                                        "w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-500",
                                        task.isCompleted ? "bg-success border-success" : "border-border dark:border-border hover:border-accent group-hover:border-accent"
                                    )}
                                >
                                    {task.isCompleted && <CheckCircle2 strokeWidth={2.5} className="w-4 h-4 text-white" />}
                                </motion.div>
                                <div>
                                    <h4 className={cn("font-serif font-semibold text-xl transition-all", task.isCompleted ? "text-text-muted line-through" : "text-text-primary group-hover:text-accent")}>
                                        {task.name}
                                    </h4>
                                    <div className="flex items-center gap-4 mt-2 text-text-muted text-[10px] font-bold uppercase tracking-widest">
                                        <span className="bg-bg-tertiary dark:bg-bg-tertiary/50 px-2.5 py-1 rounded border border-border/40 text-text-primary font-mono">{task.quantity} {task.unit}</span>
                                        <span className="flex items-center gap-2">
                                            <Clock strokeWidth={1.5} className="w-3.5 h-3.5" />
                                            Objectif 18:30
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, x: 5 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => onSelectTask(task)}
                                className="w-11 h-11 rounded-lg bg-bg-tertiary/50 hover:bg-accent hover:text-white flex items-center justify-center transition-all duration-300"
                            >
                                <ArrowRight strokeWidth={1.5} className={cn(
                                    "w-5 h-5 transition-all text-text-muted group-hover:text-inherit"
                                )} />
                            </motion.button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
