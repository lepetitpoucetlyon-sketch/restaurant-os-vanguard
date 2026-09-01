"use client";

import { Clock, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@ui/Button";

interface RecipeStep {
    order: number;
    instruction: string;
    duration?: number;
}

interface ProductStepsProps {
    recipeSteps: RecipeStep[];
    addStep: () => void;
    updateStep: (index: number, field: 'instruction' | 'duration', value: string | number) => void;
    removeStep: (index: number) => void;
}

export function ProductSteps({
    recipeSteps,
    addStep,
    updateStep,
    removeStep
}: ProductStepsProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-accent" />
                    <h3 className="text-nano font-black uppercase tracking-[0.2em] text-text-muted">Étapes de Production</h3>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    onClick={addStep}
                    className="h-10 rounded-xl bg-surface-card font-black text-nano tracking-widest uppercase border-border hover:bg-bg-tertiary"
                >
                    <Plus className="w-3 h-3 mr-2" /> Ajouter Étape
                </Button>
            </div>
            <div className="space-y-4">
                {recipeSteps.length === 0 ? (
                    <div className="py-12 bg-bg-tertiary/50 border-2 border-dashed border-border rounded-[2rem] text-center">
                        <p className="text-text-muted font-bold italic text-sm">Le personnel de cuisine verra ce protocole lors de l'exécution.</p>
                    </div>
                ) : (
                    recipeSteps.map((step, i) => (
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} key={i} className="flex gap-6 p-6 bg-surface-card rounded-[2rem] border border-border relative group">
                            <div className="w-10 h-10 rounded-xl bg-accent text-text-primary flex items-center justify-center font-serif font-black text-lg shrink-0">
                                {step.order}
                            </div>
                            <div className="flex-1 space-y-4">
                                <textarea
                                    value={step.instruction}
                                    onChange={e => updateStep(i, 'instruction', e.target.value)}
                                    placeholder="Veuillez détailler l'instruction technique..."
                                    className="w-full h-24 px-6 py-4 bg-bg-tertiary rounded-2xl font-bold text-sm outline-none resize-none focus:bg-surface-card transition-all"
                                />
                                <div className="flex items-center gap-3">
                                    <Clock className="w-4 h-4 text-text-muted" />
                                    <input
                                        type="number"
                                        value={step.duration || ''}
                                        onChange={e => updateStep(i, 'duration', parseInt(e.target.value) || 0)}
                                        className="w-24 h-10 px-4 bg-bg-tertiary rounded-xl font-black text-xs outline-none focus:bg-surface-card transition-all"
                                        placeholder="MIN"
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeStep(i)}
                                className="w-10 h-10 rounded-xl bg-error/5 hover:bg-error/10 text-error flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
