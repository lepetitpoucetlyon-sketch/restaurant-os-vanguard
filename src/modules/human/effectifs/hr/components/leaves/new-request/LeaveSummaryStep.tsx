"use client";

import { motion } from 'framer-motion';
import {
    LeaveType,
    LEAVE_TYPE_LABELS,
    LEAVE_TYPE_ICONS,
} from '@nexus/contracts';

interface LeaveSummaryStepProps {
    reason: string;
    setReason: (v: string) => void;
    selectedType: LeaveType;
    startDate: string;
    endDate: string;
    workingDays: number;
}

export function LeaveSummaryStep({
    reason,
    setReason,
    selectedType,
    startDate,
    endDate,
    workingDays,
}: LeaveSummaryStepProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
        >
            <div className="space-y-3">
                <label className="block text-nano font-bold text-text-muted uppercase tracking-widest">
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
    );
}
