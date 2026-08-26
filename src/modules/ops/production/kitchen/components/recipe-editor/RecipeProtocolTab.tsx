"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Clock, Timer, AlertTriangle } from "lucide-react";
import { Button } from "@ui/Button";
import { Recipe, RecipeStep } from "@nexus/contracts";

interface RecipeProtocolTabProps {
    formData: Partial<Recipe>;
    newStep: Partial<RecipeStep>;
    setNewStep: (data: Partial<RecipeStep> | ((prev: Partial<RecipeStep>) => Partial<RecipeStep>)) => void;
    handleAddStep: () => void;
    handleRemoveStep: (order: number) => void;
}

export function RecipeProtocolTab({
    formData,
    newStep,
    setNewStep,
    handleAddStep,
    handleRemoveStep
}: RecipeProtocolTabProps) {
    return (
        <div className="space-y-10">
            <div className="bg-bg-tertiary p-8 rounded-[3rem] border-2 border-dashed border-border text-primary">
                <h3 className="font-serif font-black text-xl mb-6">Nouvelle Étape Opérationnelle</h3>
                <div className="space-y-4">
                    <textarea
                        placeholder="Instruction technique détaillée..."
                        value={newStep.instruction}
                        onChange={(e) => setNewStep((prev: Partial<RecipeStep>) => ({ ...prev, instruction: e.target.value }))}
                        className="w-full h-24 px-6 py-4 bg-surface-card rounded-2xl border-2 border-transparent focus:border-accent font-bold text-sm outline-none resize-none"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <input
                                type="number"
                                placeholder="Temps requis (min)"
                                value={newStep.duration}
                                onChange={(e) => setNewStep((prev: Partial<RecipeStep>) => ({ ...prev, duration: parseInt(e.target.value) || 5 }))}
                                className="w-full h-14 pl-10 pr-6 bg-surface-card rounded-2xl border-2 border-transparent focus:border-accent font-bold outline-none"
                            />
                        </div>
                        <input
                            type="text"
                            placeholder="URL Illustration (Visuel)"
                            value={newStep.imageUrl}
                            onChange={(e) => setNewStep((prev: Partial<RecipeStep>) => ({ ...prev, imageUrl: e.target.value }))}
                            className="w-full h-14 px-6 bg-surface-card rounded-2xl border-2 border-transparent focus:border-accent font-bold outline-none"
                        />
                    </div>
                    <textarea
                        placeholder="Le conseil du Chef (Astuces de dressage, points de vigilance...)"
                        value={newStep.tip}
                        onChange={(e) => setNewStep((prev: Partial<RecipeStep>) => ({ ...prev, tip: e.target.value }))}
                        className="w-full h-20 px-6 py-4 bg-surface-card rounded-2xl border-2 border-transparent focus:border-accent font-bold italic text-sm outline-none resize-none"
                    />
                    <Button onClick={handleAddStep} className="w-full h-14 bg-action-primary hover:bg-action-primary-hover text-text-on-primary rounded-2xl font-black uppercase text-nano tracking-widest transition-all">
                        <Plus className="w-4 h-4 mr-2" /> Intégrer cette étape au protocole
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                <label className="text-nano font-black text-text-muted uppercase tracking-[0.2em] mb-4 block">Chronologie d'Exécution</label>
                <AnimatePresence mode="popLayout">
                    {formData.steps?.map((step: RecipeStep, _idx: number) => (
                        <motion.div
                            key={step.order}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="group bg-surface-card p-8 rounded-[3rem] border border-border shadow-sm relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-2 h-full bg-accent opacity-20" />
                            <div className="flex items-start gap-8">
                                <div className="w-14 h-14 rounded-2xl bg-bg-tertiary flex items-center justify-center font-serif font-black text-2xl text-accent border border-border">
                                    {step.order}
                                </div>
                                <div className="flex-1 space-y-4">
                                    <p className="text-xl font-serif font-medium text-text-primary leading-relaxed">{step.instruction}</p>
                                    <div className="flex items-center gap-6">
                                        <span className="flex items-center gap-2 text-nano font-black text-text-muted uppercase tracking-widest">
                                            <Timer className="w-3.5 h-3.5" />
                                            {step.duration} MINUTES
                                        </span>
                                        {step.tip && (
                                            <span className="flex items-center gap-2 text-nano font-black text-accent uppercase tracking-widest">
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                CONSEIL DU CHEF
                                            </span>
                                        )}
                                    </div>
                                    {step.tip && <p className="text-sm font-medium italic text-text-muted bg-accent/5 p-4 rounded-2xl border border-accent/10">"{step.tip}"</p>}
                                </div>
                                <button
                                    onClick={() => handleRemoveStep(step.order)}
                                    className="w-10 h-10 rounded-xl bg-error/5 hover:bg-error/10 text-error flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
