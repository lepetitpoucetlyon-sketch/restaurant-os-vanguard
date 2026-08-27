"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit3, Trash2, ImageIcon, Settings, Calendar, Clock, Check } from "lucide-react";
import { Button } from "@ui/Button";

import { useMarketing } from '../../hooks/useMarketing';

interface NewPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    socialAccounts: (import('../../store/marketingAtoms').SocialAccount & { icon: import('lucide-react').LucideIcon, color?: string })[];
}

export function NewPostModal({ isOpen, onClose, socialAccounts }: NewPostModalProps) {
    const { upsertPost } = useMarketing();
    const [caption, setCaption] = useState('');
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('12:00');

    const togglePlatform = (id: string) => {
        setSelectedPlatforms(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleSchedule = async () => {
        if (!caption.trim() || selectedPlatforms.length === 0) return;

        await upsertPost({
            caption: caption.trim(),
            platforms: selectedPlatforms,
            scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
            scheduledTime,
            status: 'scheduled',
        });

        // Reset state & Close
        setCaption('');
        setSelectedPlatforms([]);
        setScheduledDate('');
        setScheduledTime('12:00');
        onClose();
    };

    const isValid = caption.trim().length > 0 && selectedPlatforms.length > 0;

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
                        aria-label="Nouvelle Publication"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-3xl bg-surface-card rounded-[3rem] shadow-2xl overflow-hidden border border-border"
                    >
                        <div className="px-10 py-8 border-b border-border/50 bg-bg-primary/50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-action-primary text-text-on-primary flex items-center justify-center shadow-lg">
                                    <Edit3 size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-serif font-bold text-text-primary tracking-tight">Nouvelle Publication</h2>
                                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mt-1">Créez votre contenu</p>
                                </div>
                            </div>
                            <button onClick={onClose} aria-label="Fermer la boîte de dialogue" className="w-10 h-10 rounded-full bg-bg-tertiary hover:bg-surface-bg hover:text-status-danger flex items-center justify-center transition-colors">
                                <Trash2 size={20} />
                            </button>
                        </div>

                        <div className="p-10 space-y-8 bg-bg-primary/30">
                            <div className="space-y-4">
                                <label className="text-nano font-black text-text-muted uppercase tracking-widest pl-1">Sélectionner les plateformes</label>
                                <div className="flex gap-4">
                                    {socialAccounts.map((account) => {
                                        const Icon = account.icon;
                                        const isSelected = selectedPlatforms.includes(account.id);
                                        return (
                                            <button
                                                key={account.id}
                                                onClick={() => togglePlatform(account.id)}
                                                className={`group flex flex-1 items-center justify-center gap-3 px-6 py-5 rounded-2xl border transition-all shadow-sm hover:shadow-md hover:-translate-y-1 ${
                                                    isSelected
                                                        ? 'border-emerald-500 bg-status-success/5 shadow-emerald-500/10'
                                                        : 'border-border bg-surface-card hover:border-text-primary/20'
                                                }`}
                                            >
                                                <div className={`p-2 rounded-lg transition-colors ${isSelected ? 'bg-status-success/10' : 'bg-surface-glass group-hover:bg-surface-card'}`}>
                                                    <Icon className="w-5 h-5" style={{ color: account.color }} />
                                                </div>
                                                <span className="font-bold text-sm text-text-primary">{account.platform}</span>
                                                <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                    isSelected
                                                        ? 'border-emerald-500 bg-status-success'
                                                        : 'border-border group-hover:border-emerald-500 group-hover:bg-status-success'
                                                }`}>
                                                    <Check size={12} className={`text-text-primary ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-nano font-black text-text-muted uppercase tracking-widest pl-1">Contenu & Média</label>
                                <div className="relative">
                                    <textarea
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                        className="w-full h-40 p-6 bg-surface-card rounded-[2rem] border border-border focus:border-text-primary/20 focus:ring-4 focus:ring-text-primary/5 outline-none resize-none text-text-primary placeholder:text-text-muted/50 text-base font-medium shadow-sm transition-all"
                                        placeholder="Écrivez une légende captivante..."
                                    />
                                    <div className="absolute bottom-4 left-4 flex gap-2">
                                        <button type="button" aria-label="Ajouter une image" className="p-2 rounded-xl hover:bg-surface-glass text-text-muted hover:text-text-primary transition-colors">
                                            <ImageIcon size={20} />
                                        </button>
                                        <button type="button" aria-label="Paramètres de publication" className="p-2 rounded-xl hover:bg-surface-glass text-text-muted hover:text-text-primary transition-colors">
                                            <Settings size={20} />
                                        </button>
                                    </div>
                                    <div className="absolute bottom-4 right-4 text-nano font-mono text-text-muted">
                                        {caption.length} / 2200
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-nano font-black text-text-muted uppercase tracking-widest pl-1">Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                                        <input
                                            type="date"
                                            value={scheduledDate}
                                            onChange={(e) => setScheduledDate(e.target.value)}
                                            className="w-full h-14 pl-12 pr-4 bg-surface-card rounded-2xl border border-border outline-none text-text-primary font-bold shadow-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-nano font-black text-text-muted uppercase tracking-widest pl-1">Heure</label>
                                    <div className="relative">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                                        <input
                                            type="time"
                                            value={scheduledTime}
                                            onChange={(e) => setScheduledTime(e.target.value)}
                                            className="w-full h-14 pl-12 pr-4 bg-surface-card rounded-2xl border border-border outline-none text-text-primary font-bold shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-surface-card border-t border-border flex gap-4">
                            <Button variant="ghost" className="flex-1 h-16 rounded-[1.5rem] font-bold uppercase tracking-widest text-xs" onClick={onClose}>Annuler</Button>
                            <Button
                                className="flex-[2] h-16 bg-action-primary text-text-on-primary hover:bg-action-primary-hover rounded-[1.5rem] transition-all font-black uppercase tracking-widest text-xs shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
                                onClick={handleSchedule}
                                disabled={!isValid}
                            >
                                Programmer la publication
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
