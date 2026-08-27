"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Sparkles,
    ChevronLeft,
    ChevronRight,
    Send
} from 'lucide-react';
import type {
    LeaveBalance,
    LeaveType,
    DayPeriod,
    LeaveRequest
} from '@nexus/contracts';

import { LeaveTypeStep } from './new-request/LeaveTypeStep';
import { LeaveDateStep } from './new-request/LeaveDateStep';
import { LeaveSummaryStep } from './new-request/LeaveSummaryStep';

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
                className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Nouvelle Requête Demande d'Absence"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-surface-card border border-border shadow-2xl rounded-[2.5rem] w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-8 border-b border-border bg-bg-secondary/30">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <Sparkles className="w-4 h-4 text-accent" />
                                <span className="text-chip-label text-accent">Demande d'Absence</span>
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
                            <LeaveTypeStep
                                selectedType={selectedType}
                                setSelectedType={setSelectedType}
                                balances={balances}
                            />
                        )}

                        {step === 2 && (
                            <LeaveDateStep
                                startDate={startDate}
                                setStartDate={setStartDate}
                                endDate={endDate}
                                setEndDate={setEndDate}
                                startPeriod={startPeriod}
                                setStartPeriod={setStartPeriod}
                                endPeriod={endPeriod}
                                setEndPeriod={setEndPeriod}
                                workingDays={workingDays}
                                selectedBalance={selectedBalance}
                            />
                        )}

                        {step === 3 && (
                            <LeaveSummaryStep
                                reason={reason}
                                setReason={setReason}
                                selectedType={selectedType}
                                startDate={startDate}
                                endDate={endDate}
                                workingDays={workingDays}
                            />
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
                                className="px-8 py-3 rounded-[1rem] bg-text-primary text-bg-primary font-bold uppercase tracking-widest hover:bg-accent hover:text-text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5 duration-300"
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
                                className="px-8 py-3 rounded-[1rem] bg-accent text-text-primary font-bold uppercase tracking-widest hover:bg-accent-hover transition-all flex items-center gap-3 shadow-lg shadow-accent/20 hover:shadow-xl shadow-accent/30 hover:-translate-y-0.5 duration-300 disabled:opacity-50"
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
