"use client";

import React, { useState, useRef } from "react";
import { X, Camera, ReceiptEuro, Save, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@ui/button";
import { motion } from "framer-motion";
import { useAccounting, useNexusFiscal } from '@/modules/finance';
import { useToast } from "@ui/Toast";
import { Modal } from "@ui/Modal";
import { useUI } from "@/shared/hooks";
import { cn } from "@/lib/ui.foundations";
import { PremiumSelect } from "@ui/PremiumSelect";
import { ListFilter } from "lucide-react";
import { toMicrounits } from "@/domain/schemas/primitives";

interface ExpenseClaimDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const CATEGORIES: { id: string; label: string }[] = [
    { id: 'food', label: 'Alimentaire' },
    { id: 'equipment', label: 'Petit Matériel' },
    { id: 'maintenance', label: 'Maintenance & Réparations' },
    { id: 'utilities', label: 'Energie & Fluides' },
    { id: 'marketing', label: 'Marketing & Pub' },
    { id: 'training', label: 'Formation' },
    { id: 'travel', label: 'Déplacements' },
    { id: 'other', label: 'Divers' },
];

export function ExpenseClaimDialog({ isOpen, onClose }: ExpenseClaimDialogProps) {
    const { theme } = useUI();
    const isDark = theme === 'dark';
    useAccounting();
    const { accounting } = useNexusFiscal();
    const { submitExpense } = accounting;
    const { showToast } = useToast();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        amount: "",
        category: 'other' as 'other' | 'food' | 'equipment' | 'maintenance' | 'utilities' | 'marketing' | 'training' | 'travel' | undefined,
        description: "",
        receiptImage: null as string | null,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [_isAnalyzing, setIsAnalyzing] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, receiptImage: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || !formData.description) {
            showToast("Veuillez remplir tous les champs obligatoires", "warning");
            return;
        }

        setIsSubmitting(true);
        if (formData.receiptImage) setIsAnalyzing(true);

        try {
            await submitExpense({
                amountInMicrounits: toMicrounits(parseFloat(formData.amount)),
                category: formData.category,
                description: formData.description,
                receiptUrl: formData.receiptImage || undefined,
            });
            showToast("Note de frais scannée et transmise au coffre-fort fiscal", "success");
            reset();
            onClose();
        } catch (_error) {
            showToast("Échec de la transmission du justificatif", "error");
        } finally {
            setIsSubmitting(false);
            setIsAnalyzing(false);
        }
    };

    const reset = () => {
        setFormData({ amount: "", category: 'other', description: "", receiptImage: null });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => { onClose(); setTimeout(reset, 300); }}
            size="xl"
            className="p-0 border-none bg-transparent"
            showClose={false}
            noPadding
        >
            <div className="flex flex-col h-[85vh] bg-bg-primary rounded-[3rem] overflow-hidden shadow-[0_32px_128px_rgba(0,0,0,0.4)] border border-default">
                {/* Premium Accounting Header */}
                <div className={cn(
                    "px-12 py-10 text-text-primary relative overflow-hidden shrink-0 transition-all duration-500",
                    isDark ? "bg-gradient-to-br from-[#1A1A1B] to-[#2D2D2E]" : "bg-gradient-to-br from-[#2D2D2E] to-[#1A1A1B]"
                )}>
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className={cn(
                            "absolute inset-0 transition-opacity",
                            isDark ? "bg-[radial-gradient(circle_at_50%_120%,rgba(0,100,215,0.2),transparent)]" : "bg-[radial-gradient(circle_at_50%_120%,rgba(0,0,0,0.1),transparent)]"
                        )} />
                    </div>

                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            <div className="w-16 h-16 rounded-3xl bg-accent flex items-center justify-center shadow-xl shadow-accent/20">
                                <ReceiptEuro strokeWidth={1.5} className="w-8 h-8 text-text-primary" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-serif font-black tracking-tight flex items-center gap-3">
                                    Note de Frais <span className="text-accent not-italic">Pro</span>
                                    <Sparkles className="w-5 h-5 text-accent animate-pulse" />
                                </h2>
                                <div className="flex items-center gap-4 mt-1">
                                    <span className="text-text-primary/40 text-[10px] font-black uppercase tracking-[0.3em]">Validation Administrative Requise</span>
                                    <div className="h-1 w-1 rounded-full bg-accent/40" />
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-3 h-3 text-accent" />
                                        <span className="text-accent text-[10px] font-black uppercase tracking-[0.2em]">Compliance Protocol Active</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-12 h-12 rounded-2xl bg-[--color-surface-primary]/10 hover:bg-[--color-surface-primary]/20 border border-subtle flex items-center justify-center transition-all"
                        >
                            <X className="w-6 h-6 text-text-primary/50" />
                        </button>
                    </div>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className={cn(
                    "flex-1 overflow-y-auto elegant-scrollbar p-12 space-y-12 transition-colors duration-500",
                    isDark ? "bg-bg-primary" : "bg-[#fdfdfc]"
                )}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-4">Volume de la Dépense (TTC)</label>
                            <div className="relative group">
                                <div className="absolute left-8 top-1/2 -translate-y-1/2 font-serif font-black text-accent text-2xl">€</div>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                    className="w-full h-20 bg-[--color-surface-primary] dark:bg-bg-secondary border-2 border-subtle dark:border-border rounded-[2rem] pl-16 pr-8 text-3xl font-mono font-black text-text-primary focus:outline-none focus:border-accent transition-all shadow-soft"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <PremiumSelect
                            label="Classification Transact."
                            value={formData.category || ''}
                            onChange={(val) => setFormData(prev => ({ ...prev, category: val as 'other' | 'food' | 'equipment' | 'maintenance' | 'utilities' | 'marketing' | 'training' | 'travel' | undefined }))}
                            options={CATEGORIES.map(cat => ({
                                value: cat.id,
                                label: cat.label,
                                icon: <ListFilter className="w-4 h-4" />
                            }))}
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-4 flex items-center gap-2">
                            Motivations & Justifications <Sparkles className="w-3 h-3 text-accent" />
                        </label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full h-40 bg-[--color-surface-primary] dark:bg-bg-secondary border-2 border-subtle dark:border-border rounded-[2.5rem] px-10 py-8 text-base font-serif italic text-primary dark:text-text-muted focus:outline-none focus:border-accent transition-all shadow-soft outline-none resize-none"
                            placeholder="Veuillez détailler le contexte professionnel de cette dépense engagée pour l'établissement..."
                        />
                    </div>

                    {/* Receipt Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-4">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                                <Camera className="w-4 h-4 text-accent" /> Preuve de paiement Scanner
                            </label>
                            {formData.receiptImage && (
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, receiptImage: null }))}
                                    className="text-[9px] font-black text-error uppercase tracking-widest hover:opacity-70"
                                >
                                    Effacer et Recommencer
                                </button>
                            )}
                        </div>

                        <div className="relative group">
                            {formData.receiptImage ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="aspect-video rounded-[3rem] overflow-hidden border-2 border-accent/20 shadow-2xl bg-bg-tertiary/30 p-4"
                                >
                                    <img src={formData.receiptImage} className="w-full h-full object-contain rounded-2xl" alt="Justificatif" />
                                </motion.div>
                            ) : (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-[21/9] rounded-[3rem] border-2 border-dashed border-subtle flex flex-col items-center justify-center gap-6 hover:border-accent hover:bg-accent/5 transition-all cursor-pointer group bg-bg-tertiary/20"
                                >
                                    <div className="w-20 h-20 rounded-[2rem] bg-[--color-surface-primary] dark:bg-bg-secondary flex items-center justify-center text-text-muted group-hover:text-accent shadow-soft border border-subtle dark:border-border group-hover:-translate-y-2 transition-all duration-500">
                                        <Camera strokeWidth={1.5} className="w-8 h-8" />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <p className="text-[12px] font-black uppercase text-text-primary tracking-[0.3em]">Scanner / Téléverser le reçu</p>
                                        <p className="text-[10px] text-text-muted italic font-serif opacity-60">Reconnaissance de texte IA active sur le document</p>
                                    </div>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    <div className="p-8 bg-accent/5 border border-accent/10 rounded-[2.5rem] flex items-start gap-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16 group-hover:bg-accent/10 transition-colors" />
                        <div className="w-12 h-12 rounded-2xl bg-[--color-surface-primary] dark:bg-bg-tertiary flex items-center justify-center shrink-0 border border-accent/10 shadow-sm relative z-10">
                            <ShieldCheck className="w-6 h-6 text-accent" />
                        </div>
                        <div className="space-y-2 relative z-10">
                            <p className="text-[11px] font-black text-text-primary uppercase tracking-widest">Certification d'Intégrité Digitale</p>
                            <p className="text-[12px] text-text-muted font-serif italic leading-relaxed">
                                En soumettant ce formulaire, vous attestez sur l'honneur que cette dépense est en stricte conformité avec la politique de frais de l'établissement. Toute soumission frauduleuse est tracée et archivée.
                            </p>
                        </div>
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="px-12 py-10 bg-[--color-surface-primary] dark:bg-bg-secondary border-t border-subtle dark:border-border flex items-center justify-between shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted hover:text-text-primary transition-colors py-2"
                    >
                        Annuler la soumission
                    </button>
                    <div className="flex gap-6">
                        <Button
                            disabled={isSubmitting}
                            onClick={handleSubmit}
                            className="h-16 px-16 bg-accent hover:bg-surface-sidebar text-text-primary rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all shadow-2xl shadow-accent/30 transform hover:scale-[1.05] flex items-center gap-4"
                        >
                            {isSubmitting ? (
                                <Sparkles className="w-5 h-5 animate-spin" />
                            ) : (
                                <Save className="w-5 h-5 text-text-primary" />
                            )}
                            Soumettre pour Clôture
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
