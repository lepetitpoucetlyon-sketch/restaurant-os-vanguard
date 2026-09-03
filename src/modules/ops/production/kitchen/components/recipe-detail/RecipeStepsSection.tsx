"use client";

import { motion } from "framer-motion";
import { ChefHat, CheckCircle2 } from "lucide-react";
import { Button } from "@ui/Button";
import { staggerContainer, staggerItem } from "@/shared/utils/motion";
import type { Recipe } from "@nexus/contracts";
import { useLanguage } from "@/shared/hooks";

interface RecipeStepsSectionProps {
    recipe: Recipe;
}

export function RecipeStepsSection({ recipe }: RecipeStepsSectionProps) {
    const { t } = useLanguage();
    const steps = (recipe.recipeSteps ?? recipe.steps ?? []) as Array<{
        id?: string;
        instruction?: string;
        duration?: number;
        tip?: string;
        tools?: string[];
        [k: string]: unknown;
    }>;

    return (
        <div className="flex-1 overflow-auto elegant-scrollbar relative transition-colors duration-500 bg-bg-primary">
            <div className="max-w-4xl mx-auto px-12 py-24 md:px-24">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <div className="flex items-center gap-6 mb-16">
                        <div className="w-16 h-16 rounded-[2rem] bg-accent/10 flex items-center justify-center border border-accent/20">
                            <ChefHat className="w-8 h-8 text-accent" />
                        </div>
                        <div>
                            <h2 className="text-[14px] font-black uppercase tracking-[0.5em] text-secondary">Le Protocole</h2>
                            <p className="font-serif italic opacity-60 transition-colors text-primary">{t('kitchen.recipeDetail.preciseSteps')}</p>
                        </div>
                    </div>

                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        className="space-y-16"
                    >
                        {steps.map((step, idx) => (
                            <motion.div
                                key={idx}
                                variants={staggerItem}
                                className="group relative pl-20"
                            >
                                <div className="absolute left-0 top-0 text-[64px] font-serif font-black leading-none transition-colors group-hover:text-accent/20 text-primary/5">
                                    {(idx + 1).toString().padStart(2, '0')}
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-serif font-black tracking-tight group-hover:text-accent transition-all duration-500 text-primary">
                                        {`Étape ${idx + 1}`}
                                    </h3>
                                    <p className="text-lg leading-relaxed font-serif opacity-80 group-hover:opacity-100 transition-all text-secondary">
                                        {step.instruction as string}
                                    </p>
                                    {step.tip && (
                                        <div className="flex items-center gap-4 p-4 bg-accent/5 rounded-2xl border border-accent/10 mt-6">
                                            <ChefHat className="w-5 h-5 text-accent" />
                                            <p className="text-[13px] font-bold text-accent italic">{step.tip as string}</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}

                        {/* Final presentation */}
                        <div className="pt-24 border-t transition-colors border-black/10">
                            <div className="text-center space-y-10">
                                <span className="text-[13px] font-black uppercase tracking-[0.8em] text-secondary opacity-40">L'Œuvre Finale</span>
                                <h2 className="text-6xl font-serif font-black tracking-tighter transition-colors text-primary">Une signature inoubliable.</h2>

                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ duration: 0.8 }}
                                    className="relative h-[600px] rounded-[4rem] overflow-hidden shadow-[0_64px_128px_-32px_rgba(0,0,0,0.5)] border transition-colors border-black/5"
                                >
                                    <img
                                        src={String(recipe.imageUrl ?? "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop")}
                                        className="w-full h-full object-cover"
                                        alt="Final dish"
                                    />
                                    <div className="absolute inset-0 flex flex-col justify-end p-16 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                                        <div className="max-w-2xl mx-auto">
                                            <Button className="w-full bg-accent text-primary hover:bg-accent/90 h-20 px-12 rounded-[2rem] font-black text-[14px] uppercase tracking-[0.3em] transition-all transform hover:translate-y-[-4px] shadow-2xl shadow-[#C5A059]/20">
                                                <CheckCircle2 className="w-6 h-6 mr-4 text-primary" />
                                                Valider comme Appris
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
