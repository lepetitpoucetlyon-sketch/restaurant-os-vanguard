"use client";

import { X, Clock, AlertTriangle, ChefHat, CheckCircle2, Flame, Heart, Share2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/ui.foundations";;
import { staggerContainer, staggerItem } from "@/lib/motion";
import { Modal } from "@/components/ui/Modal";
import { useUI } from "@/context/UIContext";
import { Recipe, RecipeIngredient, RecipeStep } from "@/types";

interface RecipeDetailDialogProps {
    isOpen: boolean;
    onClose: () => void;
    recipe: Recipe;
}

export function RecipeDetailDialog({ isOpen, onClose, recipe }: RecipeDetailDialogProps) {
    // Forced to light mode

    if (!recipe) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="xl"
            forceDesktop
            className="p-0 border-none bg-transparent max-w-7xl"
            showClose={false}
            noPadding
        >
            <div className="w-full h-[85vh] rounded-[3rem] shadow-[0_32px_128px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row relative border transition-colors duration-500 bg-white border-black/5">
                {/* Static Sidebar - Ingredients & Info */}
                <div className="md:w-[450px] border-r flex flex-col h-full shrink-0 relative transition-colors duration-500 bg-neutral-50 border-black/5">
                    {/* Header Image for Sidebar */}
                    <div className="relative h-64 overflow-hidden transition-colors bg-neutral-200">
                        <motion.img
                            initial={{ scale: 1.2 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 1.5 }}
                            src={recipe.image || recipe.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop"}
                            className="w-full h-full object-cover opacity-80"
                            alt={recipe.name}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t via-transparent to-transparent transition-colors from-neutral-50" />

                        <button
                            onClick={onClose}
                            className="absolute top-8 left-8 w-12 h-12 backdrop-blur-xl rounded-2xl flex items-center justify-center transition-all duration-300 shadow-2xl z-20 group border bg-white/40 hover:bg-white/60 text-black border-black/10"
                        >
                            <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                        </button>

                        <div className="absolute bottom-6 left-8 right-8 flex justify-between items-center z-10">
                            <div className="flex gap-2">
                                <button className="w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center text-error hover:scale-110 transition-all shadow-lg border bg-white/60 border-black/10">
                                    <Heart className="w-5 h-5 fill-error" />
                                </button>
                                <button className="w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center hover:scale-110 transition-all shadow-lg border bg-white/60 text-black border-black/10">
                                    <Share2 className="w-5 h-5" />
                                </button>
                            </div>
                            <motion.div
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="bg-accent px-4 py-2 rounded-xl text-black font-serif font-black text-xs tracking-widest shadow-lg shadow-[#C5A059]/20"
                            >
                                SIGNATURE
                            </motion.div>
                        </div>
                    </div>

                    <div className="p-10 flex-1 overflow-auto elegant-scrollbar">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent mb-4 block">SIGNATURE</span>
                            <h1 className="text-4xl font-serif font-black leading-[1.1] mb-6 tracking-tight transition-colors text-black">{recipe.name}</h1>
                            <p className="text-[15px] leading-relaxed font-serif italic mb-10 opacity-80 border-l-2 border-accent/30 pl-4 py-1 transition-colors text-zinc-600">
                                "{recipe.description || "Une création culinaire d'exception pour sublimer votre carte, alliant technique ancestrale et modernité."}"
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-2 gap-6 mb-12">
                            <div className="p-6 rounded-[2rem] border group hover:border-accent/30 transition-all duration-500 bg-black/5 border-black/5">
                                <span className="text-[11px] font-black uppercase text-zinc-500 tracking-[0.3em] block mb-2">Prép.</span>
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-accent" />
                                    <span className="text-xl font-serif font-black transition-colors text-black">{recipe.prepTime || 20} MIN</span>
                                </div>
                            </div>
                            <div className="p-6 rounded-[2rem] border group hover:border-accent/30 transition-all duration-500 bg-black/5 border-black/5">
                                <span className="text-[11px] font-black uppercase text-zinc-500 tracking-[0.3em] block mb-2">Service</span>
                                <div className="flex items-center gap-3">
                                    <Flame className="w-5 h-5 text-error" />
                                    <span className="text-xl font-serif font-black uppercase text-[15px] transition-colors text-black">{recipe.difficulty || 'MOYEN'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-10">
                            <div>
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] transition-colors text-black">Ingrédients</h3>
                                    <div className="h-px w-20 transition-colors bg-black/10" />
                                </div>
                                <motion.ul
                                    variants={staggerContainer}
                                    initial="hidden"
                                    animate="visible"
                                    className="grid grid-cols-1 gap-2"
                                >
                                    {(recipe.ingredients || []).map((ing: RecipeIngredient, i: number) => (
                                        <motion.li
                                            variants={staggerItem}
                                            key={i}
                                            className="flex items-center justify-between py-3 border-b group px-2 rounded-xl transition-all border-black/5 hover:bg-black/5"
                                        >
                                            <span className="text-[14px] font-medium transition-colors group-hover:text-accent text-zinc-700">{ing.name}</span>
                                            <span className="text-[12px] font-mono font-bold px-3 py-1 rounded-lg border transition-colors text-zinc-500 bg-white/40 border-black/5">{ing.quantity} {ing.unit}</span>
                                        </motion.li>
                                    ))}
                                </motion.ul>
                            </div>

                            {recipe.allergens && recipe.allergens.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                    className="p-6 bg-error/5 rounded-3xl border border-error/10"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <AlertTriangle className="w-5 h-5 text-error" />
                                        <span className="text-[10px] font-black uppercase text-error tracking-[0.3em]">Alertes Allergènes</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {recipe.allergens.map((a: string) => (
                                            <span key={a} className="px-3 py-1.5 rounded-xl border text-[11px] font-black text-error uppercase tracking-wider shadow-sm transition-colors bg-white/40 border-error/20">
                                                {a}
                                            </span>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Footer Actions */}
                    <div className="p-10 border-t transition-colors duration-500 border-black/5 bg-neutral-100/50">
                        <Button className="w-full h-16 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-lg transition-all transform hover:scale-[1.02] bg-zinc-900 hover:bg-black text-white">
                            <Printer className="w-5 h-5 mr-3" /> Imprimer la Fiche
                        </Button>
                    </div>
                </div>

                {/* Main Scrollable Content - Instructions */}
                <div className="flex-1 overflow-auto elegant-scrollbar relative transition-colors duration-500 bg-[#F8F7F2]">
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
                                    <h2 className="text-[14px] font-black uppercase tracking-[0.5em] text-zinc-500">Le Protocole</h2>
                                    <p className="font-serif italic opacity-60 transition-colors text-zinc-700">Étapes de réalisation précises</p>
                                </div>
                            </div>

                            <motion.div
                                variants={staggerContainer}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-100px" }}
                                className="space-y-16"
                            >
                                {(recipe.steps || []).map((step: RecipeStep, idx: number) => (
                                    <motion.div
                                        key={idx}
                                        variants={staggerItem}
                                        className="group relative pl-20"
                                    >
                                        <div className="absolute left-0 top-0 text-[64px] font-serif font-black leading-none transition-colors group-hover:text-accent/20 text-black/5">
                                            {(idx + 1).toString().padStart(2, '0')}
                                        </div>
                                        <div className="space-y-4">
                                            <h3 className="text-2xl font-serif font-black tracking-tight group-hover:text-accent transition-all duration-500 text-black">{`Étape ${idx + 1}`}</h3>
                                            <p className="text-lg leading-relaxed font-serif opacity-80 group-hover:opacity-100 transition-all text-zinc-600">
                                                {step.instruction}
                                            </p>

                                            {step.tip && (
                                                <div className="flex items-center gap-4 p-4 bg-accent/5 rounded-2xl border border-accent/10 mt-6">
                                                    <ChefHat className="w-5 h-5 text-accent" />
                                                    <p className="text-[13px] font-bold text-accent italic">{step.tip}</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}

                                {/* Final Presentation Mockup */}
                                <div className="pt-24 border-t transition-colors border-black/10">
                                    <div className="text-center space-y-10">
                                        <span className="text-[13px] font-black uppercase tracking-[0.8em] text-zinc-600 opacity-40">L'Œuvre Finale</span>
                                        <h2 className="text-6xl font-serif font-black tracking-tighter transition-colors text-black">Une signature inoubliable.</h2>

                                        <motion.div
                                            whileHover={{ scale: 1.02 }}
                                            transition={{ duration: 0.8 }}
                                            className="relative h-[600px] rounded-[4rem] overflow-hidden shadow-[0_64px_128px_-32px_rgba(0,0,0,0.5)] border transition-colors border-black/5"
                                        >
                                            <img
                                                src={recipe.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop"}
                                                className="w-full h-full object-cover"
                                                alt="Final dish"
                                            />
                                            <div className="absolute inset-0 flex flex-col justify-end p-16 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                                                <div className="max-w-2xl mx-auto">
                                                    <Button className="w-full bg-accent text-black hover:bg-accent/90 h-20 px-12 rounded-[2rem] font-black text-[14px] uppercase tracking-[0.3em] transition-all transform hover:translate-y-[-4px] shadow-2xl shadow-[#C5A059]/20">
                                                        <CheckCircle2 className="w-6 h-6 mr-4 text-black" />
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

                {/* Detail Textures */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.4] mix-blend-overlay"
                    style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/carbon-fibre.png")` }}
                />
            </div>
        </Modal>
    );
}
