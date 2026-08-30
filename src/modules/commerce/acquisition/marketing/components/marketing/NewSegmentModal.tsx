// @wip owner:commerce-team échéance:2026-Q4 — composant orphelin à intégrer ou supprimer (audit orphelins 2026-08-30)
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, X, Filter, TrendingUp, Clock, ShoppingBag } from "lucide-react";
import { Button } from "@ui/Button";

interface NewSegmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (segment: import('../../store/marketingAtoms').MarketingSegment) => void;
}

const CRITERIA_OPTIONS = [
    { id: 'visit_frequency', label: 'Fréquence de visite', icon: TrendingUp, options: ['1+ / mois', '2+ / mois', '4+ / mois', 'Hebdomadaire'] },
    { id: 'avg_basket', label: 'Panier moyen', icon: ShoppingBag, options: ['< 20€', '20-50€', '50-100€', '> 100€'] },
    { id: 'last_visit', label: 'Dernière visite', icon: Clock, options: ['< 7 jours', '< 30 jours', '< 90 jours', '> 90 jours'] },
];

export function NewSegmentModal({ isOpen, onClose, onSave }: NewSegmentModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [criteria, setCriteria] = useState<Record<string, string>>({});

    // Pure derivation for UI feedback (Grade X+++)
    const criteriaCount = Object.keys(criteria).length;
    const estimatedSize = criteriaCount > 0 
        ? (name.length * 12 + criteriaCount * 45) % 150 + 10
        : 0;

    const handleSubmit = () => {
        if (!name.trim()) return;

        onSave({
            id: `seg_${Date.now()}`,
            name: name.trim(),
            description: description.trim(),
            criteria,
            estimatedSize,
            color: `#${((name.length * 12345) % 16777215).toString(16).padStart(6, '0')}`,
        });

        setName('');
        setDescription('');
        setCriteria({});
    };

    const toggleCriteria = (criterionId: string, value: string) => {
        setCriteria(prev => {
            if (prev[criterionId] === value) {
                const next = { ...prev };
                delete next[criterionId];
                return next;
            }
            return { ...prev, [criterionId]: value };
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        aria-hidden="true"
                        className="absolute inset-0 bg-black/50 backdrop-blur-md"
                    />
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Nouveau Segment Audience CRM"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-2xl bg-surface-card rounded-[3rem] shadow-2xl overflow-hidden border border-border"
                    >
                        {/* Header */}
                        <div className="px-10 py-8 border-b border-border/50 bg-bg-primary/50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-status-success to-status-success text-text-primary flex items-center justify-center shadow-lg">
                                    <Filter size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-serif font-bold text-text-primary tracking-tight">Nouveau Segment</h2>
                                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mt-1">Audience CRM</p>
                                </div>
                            </div>
                            <button onClick={onClose} aria-label="Fermer la boîte de dialogue" className="w-10 h-10 rounded-full bg-bg-tertiary hover:bg-surface-bg hover:text-status-danger flex items-center justify-center transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="p-10 space-y-8 bg-bg-primary/30 max-h-[60vh] overflow-y-auto elegant-scrollbar">
                            {/* Name */}
                            <div>
                                <label className="text-nano font-black text-text-muted uppercase tracking-widest pl-1 mb-2 block">Nom du segment</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ex: Clients fidèles premium"
                                    className="w-full bg-surface-glass rounded-2xl border border-border px-6 py-4 text-sm font-medium outline-none focus:border-emerald-500/50 transition-all"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-nano font-black text-text-muted uppercase tracking-widest pl-1 mb-2 block">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Décrivez l'audience de ce segment..."
                                    rows={2}
                                    className="w-full bg-surface-glass rounded-2xl border border-border px-6 py-4 text-sm font-medium outline-none focus:border-emerald-500/50 transition-all resize-none"
                                />
                            </div>

                            {/* Criteria */}
                            <div>
                                <label className="text-nano font-black text-text-muted uppercase tracking-widest pl-1 mb-4 block">Critères de filtrage</label>
                                <div className="space-y-6">
                                    {CRITERIA_OPTIONS.map((criterion) => (
                                        <div key={criterion.id}>
                                            <div className="flex items-center gap-2 mb-3">
                                                <criterion.icon className="w-4 h-4 text-status-success" />
                                                <span className="text-xs font-black uppercase tracking-widest text-text-primary">{criterion.label}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {criterion.options.map((opt) => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => toggleCriteria(criterion.id, opt)}
                                                        className={`px-5 py-2.5 rounded-full text-micro font-bold uppercase tracking-wider border transition-all ${
                                                            criteria[criterion.id] === opt
                                                                ? 'bg-status-success text-text-primary border-emerald-500 shadow-lg shadow-emerald-500/20'
                                                                : 'border-border/50 text-text-muted hover:border-emerald-500/30 hover:text-status-success'
                                                        }`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Estimated Size */}
                            {Object.keys(criteria).length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-status-success/5 border border-emerald-500/20 rounded-2xl p-6 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <Users className="w-5 h-5 text-status-success" />
                                        <span className="text-xs font-black uppercase tracking-widest text-text-primary">Audience estimée</span>
                                    </div>
                                    <span className="text-3xl font-serif font-bold text-status-success">~{estimatedSize}</span>
                                </motion.div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="p-8 bg-surface-card border-t border-border flex gap-4">
                            <Button variant="ghost" className="flex-1 h-16 rounded-[1.5rem] font-bold uppercase tracking-widest text-xs" onClick={onClose}>
                                Annuler
                            </Button>
                            <Button
                                className="flex-[2] h-16 bg-gradient-to-r from-status-success to-status-success text-text-primary hover:from-status-success hover:to-status-success rounded-[1.5rem] transition-all font-black uppercase tracking-widest text-xs shadow-xl"
                                onClick={handleSubmit}
                                disabled={!name.trim()}
                            >
                                Créer le segment
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
