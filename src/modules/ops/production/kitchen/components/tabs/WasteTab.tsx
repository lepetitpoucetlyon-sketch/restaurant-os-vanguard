
"use client";

import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { Button } from "@ui/Button";
import { formatCurrency } from "@/lib/formatters";;
import { cinematicContainer, fadeInUp } from "@/shared/utils/motion";
import { useToast } from "@ui/Toast";
import React, { useState, useCallback } from "react";
import { PremiumSelect } from "@ui/PremiumSelect";
import { useTenant } from "@/shared/hooks";
import { Ingredient, RegulatoryWasteLog } from "@nexus/contracts";

interface WasteTabProps {
    ingredients: Ingredient[];
    wasteLogs: RegulatoryWasteLog[];
}

export function WasteTab({ ingredients, wasteLogs: _wasteLogs }: WasteTabProps) {
    const { showToast } = useToast();
    const { tenantId } = useTenant();
    const [selectedIngredient, setSelectedIngredient] = useState("");
    const [quantity, setQuantity] = useState("");
    const [selectedReason, setSelectedReason] = useState<string>("");

    const ingredientOptions = ingredients.map(i => ({
        value: i.id || i.name,
        label: i.name,
        description: i.category || "Ingrédient",
        icon: <div className="w-4 h-4 rounded-full bg-accent-gold" />
    }));

    const handleWasteSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedIngredient || !quantity || parseFloat(quantity) <= 0) {
            showToast("Sélectionnez un article et saisissez une quantité", "error");
            return;
        }
        if (!tenantId) return;
        try {
            const { HACCPLogService } = await import('@/modules/compliance');
            const ingredient = ingredients.find(i => (i.id || i.name) === selectedIngredient);
            await HACCPLogService.logWaste({
                tenantId,
                ingredientId: selectedIngredient,
                ingredientName: ingredient?.name ?? selectedIngredient,
                quantity: parseFloat(quantity),
                unit: ingredient?.unit ?? 'kg',
                reason: selectedReason || 'Autre',
            });
            showToast("Perte enregistrée avec succès", "success");
            setSelectedIngredient("");
            setQuantity("");
            setSelectedReason("");
        } catch {
            showToast("Erreur lors de l'enregistrement", "error");
        }
    }, [tenantId, selectedIngredient, quantity, selectedReason, ingredients, showToast]);

    return (
        <motion.div
            variants={cinematicContainer}
            initial="hidden"
            animate="visible"
            className="w-full max-w-full xl:max-w-5xl"
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                {/* Waste Form */}
                <motion.div variants={fadeInUp} className="lg:col-span-8">
                    <div className="bg-surface-card backdrop-blur-xl rounded-[2rem] p-8 md:p-10 border border-border shadow-xl">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 rounded-2xl bg-error/10 dark:bg-error/20 flex items-center justify-center border border-error/20">
                                <Trash2 className="w-6 h-6 text-error" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-serif font-black text-primary dark:text-text-primary tracking-tight italic">
                                    Déclarer une <span className="text-secondary">Perte</span>
                                </h3>
                                <p className="text-nano uppercase tracking-[0.3em] font-black text-muted mt-1">
                                    Saisie rapide des écarts de stock
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleWasteSubmit} className="space-y-12">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
                                <div className="lg:col-span-7 group">
                                    <PremiumSelect
                                        label="Article"
                                        value={selectedIngredient}
                                        onChange={setSelectedIngredient}
                                        options={ingredientOptions}
                                        placeholder="Sélectionner un ingrédient..."
                                    />
                                </div>

                                <div className="lg:col-span-5 space-y-3 group">
                                    <label className="text-nano font-black uppercase text-muted tracking-[0.25em] ml-1 group-focus-within:text-error transition-all flex justify-between items-center">
                                        <span>Quantité à déduire</span>
                                        <span className="text-nano lowercase font-serif italic normal-case tracking-normal text-error opacity-0 group-focus-within:opacity-100 transition-opacity">champ obligatoire</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={quantity}
                                            onChange={e => setQuantity(e.target.value)}
                                            min="0"
                                            step="0.01"
                                            className="w-full h-[60px] pl-6 pr-20 bg-surface-bg dark:bg-surface-card/[0.03] border border-subtle dark:border-subtle rounded-[1.25rem] font-mono font-black text-xl focus:ring-4 focus:ring-error/10 focus:border-error outline-none transition-all shadow-inner placeholder:text-muted dark:placeholder:text-text-primary/10"
                                        />
                                        <div className="absolute right-2 top-2 bottom-2 w-14 bg-surface-glass text-text-primary rounded-xl flex items-center justify-center font-black text-micro uppercase tracking-widest shadow-xl pointer-events-none">
                                            KG
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 pt-2">
                                <div className="flex items-center gap-4">
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-surface-bg dark:via-white/5 to-transparent" />
                                    <label className="text-nano font-black uppercase text-muted dark:text-secondary tracking-[0.4em] whitespace-nowrap">Motif de la Saisie</label>
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-surface-bg dark:via-white/5 to-transparent" />
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Plat Erreur', icon: '🍽️' },
                                        { label: 'DLC Passée', icon: '📅' },
                                        { label: 'Abîmé', icon: '🩹' },
                                        { label: 'Surplus', icon: '📦' }
                                    ].map(reason => (
                                        <motion.button
                                            whileHover={{ scale: 1.02, y: -4, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
                                            whileTap={{ scale: 0.98 }}
                                            type="button"
                                            key={reason.label}
                                            onClick={() => setSelectedReason(reason.label)}
                                            className={`h-24 flex flex-col items-center justify-center gap-3 border bg-surface-card dark:bg-surface-card/[0.02] hover:bg-surface-glass hover:border-transparent hover:text-text-primary rounded-[2rem] font-black text-nano uppercase tracking-[0.2em] transition-all duration-300 group/btn shadow-sm ${selectedReason === reason.label ? 'border-error bg-error/10 text-error' : 'border-subtle dark:border-white/5'}`}
                                        >
                                            <span className="text-2xl opacity-40 group-hover/btn:opacity-100 group-hover/btn:scale-125 transition-all duration-300">{reason.icon}</span>
                                            {reason.label}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            <motion.div
                                className="pt-8"
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                <Button className="w-full h-[72px] bg-action-primary hover:bg-action-primary-hover text-text-on-primary rounded-[1.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:shadow-error/20 transition-all flex items-center justify-center gap-4 overflow-hidden relative group">
                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-error translate-y-full group-hover:translate-y-0 transition-transform" />
                                    Enregistrer la Perte <Trash2 className="w-5 h-5 ml-1 opacity-30 group-hover:opacity-100 group-hover:rotate-12 transition-all" />
                                </Button>
                            </motion.div>
                        </form>
                    </div>
                </motion.div>

                {/* KPI Sidebar */}
                <motion.div variants={fadeInUp} className="lg:col-span-4 space-y-8">
                    <div className="bg-surface-card rounded-[2rem] p-8 md:p-10 border border-subtle/50 dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-none relative overflow-hidden group">
                        <div className="absolute -right-12 -top-12 w-48 h-48 bg-error/5 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-all duration-700" />
                        
                        <div className="relative z-10">
                            <div className="space-y-1">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-5xl font-mono font-black text-text-primary dark:text-primary flex items-baseline gap-1"
                                >
                                    <span className="text-error text-[0.6em] font-black">-</span>
                                    {formatCurrency(124.50)}
                                </motion.div>
                                <p className="text-nano font-bold text-error uppercase tracking-[0.2em] opacity-80 pl-4">
                                    Mois en cours
                                </p>
                            </div>

                            <div className="mt-12 pt-8 border-t border-subtle dark:border-black/5">
                                <p className="text-[13px] text-muted dark:text-secondary font-medium leading-relaxed">
                                    Ce mois-ci, les pertes représentent
                                    <span className="block text-2xl font-serif font-black text-error mt-2 italic tracking-tighter">
                                        2.4% du CA Total
                                    </span>
                                </p>
                                <div className="mt-6 w-full h-1.5 bg-surface-glass rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '2.4%' }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="h-full bg-error shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
