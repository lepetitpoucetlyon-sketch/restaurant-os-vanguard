"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Sparkles,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Send
} from 'lucide-react';
import { cn } from "@/lib/ui.foundations";
import { PremiumSelect } from '@ui/PremiumSelect';
import {
    LeaveBalance,
    LeaveType,
    DayPeriod,
    LEAVE_TYPE_LABELS,
    LEAVE_TYPE_ICONS,
    LeaveRequest
} from '@nexus/contracts';


interface NewRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    balances: LeaveBalance[];
    onSubmit: (data: Partial<LeaveRequest>) => Promise<void>;
}

export function NewRequestModal({
    isOpen,
    onClose,
    balances,
    onSubmit
}: NewRequestModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedType, setSelectedType] = useState<LeaveType>('paid');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [startPeriod, setStartPeriod] = useState<DayPeriod>('full_day');
    const [endPeriod, setEndPeriod] = useState<DayPeriod>('full_day');
    const [reason, setReason] = useState('');
    const [step, setStep] = useState(1);

    const selectedBalance = balances.find(b => b.type === selectedType);

    const calculateWorkingDays = () => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        let count = 0;
        const current = new Date(start);

        while (current <= end) {
            const dayOfWeek = current.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }

        // Adjust for half days
        if (startPeriod !== 'full_day') count -= 0.5;
        if (endPeriod !== 'full_day' && startDate !== endDate) count -= 0.5;

        return count;
    };

    const workingDays = calculateWorkingDays();

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-bg-primary border border-border shadow-2xl rounded-[2.5rem] w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-8 border-b border-border bg-bg-secondary/30">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <Sparkles className="w-4 h-4 text-accent" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-accent">Demande d'Absence</span>
                            </div>
                            <h2 className="text-2xl font-serif italic text-text-primary">Nouvelle Requête</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-[--color-surface-primary] border border-border hover:bg-bg-secondary transition-colors flex items-center justify-center text-text-primary shadow-sm"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-bg-tertiary">
                        <motion.div
                            className="h-full bg-accent"
                            initial={{ width: "33%" }}
                            animate={{ width: `${(step / 3) * 100}%` }}
                        />
                    </div>

                    {/* Content */}
                    <div className="p-8 overflow-y-auto flex-1 bg-bg-primary">
                        {step === 1 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <label className="block text-sm font-bold text-text-muted uppercase tracking-widest mb-4">
                                    Type d'absence
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    {Object.entries(LEAVE_TYPE_LABELS).map(([type, label]) => {
                                        const balance = balances.find(b => b.type === type);
                                        const icon = LEAVE_TYPE_ICONS[type as LeaveType];
                                        const isSelected = selectedType === type;

                                        return (
                                            <button
                                                key={type}
                                                onClick={() => setSelectedType(type as LeaveType)}
                                                className={cn(
                                                    "p-5 rounded-[2rem] border text-left transition-all relative overflow-hidden group h-full flex flex-col justify-between",
                                                    isSelected
                                                        ? "border-accent bg-bg-secondary shadow-lg scale-[1.02]"
                                                        : "border-border bg-[--color-surface-primary] hover:border-accent/30 hover:bg-bg-secondary/50"
                                                )}
                                            >
                                                {/* Selected Indicator */}
                                                {isSelected && (
                                                    <div className="absolute top-4 right-4 z-20">
                                                        <CheckCircle2 className="w-5 h-5 text-accent" />
                                                    </div>
                                                )}

                                                <div className="relative z-10 space-y-4">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all duration-500",
                                                        isSelected ? "bg-[--color-surface-primary] text-accent shadow-premium scale-110" : "bg-bg-secondary text-text-muted group-hover:scale-105"
                                                    )}>
                                                        {icon}
                                                    </div>
                                                    <div>
                                                        <span className={cn(
                                                            "block text-xl font-serif italic transition-colors leading-tight",
                                                            isSelected ? "text-text-primary" : "text-text-primary/70"
                                                        )}>{label}</span>
                                                        {balance && (
                                                            <span className="text-[10px] font-black text-text-muted/60 uppercase tracking-[0.2em] mt-1 block">
                                                                {balance.remaining}j dispos.
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-8"
                            >
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                            Début
                                        </label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={e => setStartDate(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border text-text-primary font-serif focus:scale-[1.02] focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all outline-none shadow-sm"
                                        />
                                        <PremiumSelect
                                            value={startPeriod}
                                            onChange={val => setStartPeriod(val as DayPeriod)}
                                            options={[
                                                { value: 'full_day', label: 'Journée entière' },
                                                { value: 'morning', label: 'Matin' },
                                                { value: 'afternoon', label: 'Après-midi' }
                                            ]}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                            Fin
                                        </label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={e => setEndDate(e.target.value)}
                                            min={startDate}
                                            className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border text-text-primary font-serif focus:scale-[1.02] focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all outline-none shadow-sm"
                                        />
                                        <PremiumSelect
                                            value={endPeriod}
                                            onChange={val => setEndPeriod(val as DayPeriod)}
                                            options={[
                                                { value: 'full_day', label: 'Journée entière' },
                                                { value: 'morning', label: 'Matin' },
                                                { value: 'afternoon', label: 'Après-midi' }
                                            ]}
                                        />
                                    </div>
                                </div>

                                {startDate && endDate && (
                                    <div className="p-6 rounded-2xl bg-bg-secondary border border-border relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-accent/5 rounded-full blur-xl -mr-10 -mt-10" />
                                        <div className="flex items-center justify-between relative z-10">
                                            <span className="text-text-muted text-sm font-medium">Jours décomptés</span>
                                            <span className="text-3xl font-serif italic text-text-primary">
                                                {workingDays} <span className="text-sm font-sans not-italic text-text-muted font-bold uppercase tracking-wide">Jours</span>
                                            </span>
                                        </div>
                                        {selectedBalance && (
                                            <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-sm">
                                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Solde prévisionnel</span>
                                                <span className={cn(
                                                    "font-bold font-mono px-2 py-0.5 rounded",
                                                    selectedBalance.remaining - workingDays >= 0
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : "bg-rose-100 text-rose-700"
                                                )}>
                                                    {(selectedBalance.remaining - workingDays).toFixed(1)} j
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                        Motif (Facultatif)
                                    </label>
                                    <textarea
                                        value={reason}
                                        onChange={e => setReason(e.target.value)}
                                        placeholder="Précisez le contexte de votre demande..."
                                        rows={4}
                                        className="w-full px-5 py-4 rounded-2xl bg-bg-secondary border border-border text-text-primary font-serif placeholder:font-sans placeholder:text-text-muted/50 focus:bg-[--color-surface-primary] focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all outline-none resize-none shadow-inner"
                                    />
                                </div>

                                {/* Summary */}
                                <div className="p-6 rounded-2xl bg-bg-secondary/50 border border-border space-y-4">
                                    <h4 className="font-serif italic text-lg text-text-primary">Récapitulatif</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                                            <span className="text-text-muted">Type</span>
                                            <span className="text-text-primary font-medium flex items-center gap-2">
                                                <span>{LEAVE_TYPE_ICONS[selectedType]}</span>
                                                {LEAVE_TYPE_LABELS[selectedType]}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                                            <span className="text-text-muted">Période</span>
                                            <span className="text-text-primary font-medium">
                                                {new Date(startDate).toLocaleDateString('fr-FR')} — {new Date(endDate).toLocaleDateString('fr-FR')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-text-muted">Volume</span>
                                            <span className="text-text-primary font-bold bg-[--color-surface-primary] px-2 py-0.5 rounded border border-border shadow-sm">{workingDays} jours</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-6 bg-bg-secondary/30 border-t border-border">
                        {step > 1 ? (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="px-6 py-3 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-all flex items-center gap-2 font-medium"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Retour
                            </button>
                        ) : (
                            <button
                                onClick={onClose}
                                className="px-6 py-3 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-all font-medium"
                            >
                                Annuler
                            </button>
                        )}

                        {step < 3 ? (
                            <button
                                onClick={() => setStep(step + 1)}
                                disabled={step === 2 && (!startDate || !endDate)}
                                className="px-8 py-3 rounded-[1rem] bg-text-primary text-bg-primary font-bold uppercase tracking-widest hover:bg-accent hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5 duration-300"
                            >
                                Continuer
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={async () => {
                                    setIsSubmitting(true);
                                    try {
                                        await onSubmit({
                                            type: selectedType,
                                            startDate,
                                            endDate,
                                            startPeriod,
                                            endPeriod,
                                            reason,
                                            workingDays
                                        });
                                    } finally {
                                        setIsSubmitting(false);
                                    }
                                }}
                                disabled={isSubmitting}
                                className="px-8 py-3 rounded-[1rem] bg-accent text-white font-bold uppercase tracking-widest hover:bg-accent-hover transition-all flex items-center gap-3 shadow-lg shadow-accent/20 hover:shadow-xl shadow-accent/30 hover:-translate-y-0.5 duration-300 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <motion.div 
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                    />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                                {isSubmitting ? 'Envoi...' : 'Confirmer'}
                            </button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
