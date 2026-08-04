"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, X, Send, Mail, MessageSquare, Calendar, Clock, Users } from "lucide-react";
import { Button } from "@ui/button";

        // FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
        // eslint-disable-next-line vanguard/no-inter-module-imports
import { useMarketing } from '@/modules/ops/providers/hooks/commerceHooks';

interface NewCampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CAMPAIGN_TYPES = [
    { id: 'email', label: 'Email', icon: Mail, description: 'Newsletter ou offre par email' },
    { id: 'sms', label: 'SMS', icon: MessageSquare, description: 'Message court et direct' },
    { id: 'social', label: 'Social', icon: Send, description: 'Notification mobile ou sociale' },
];

export function NewCampaignModal({ isOpen, onClose }: NewCampaignModalProps) {
    const { upsertCampaign } = useMarketing();
    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');
    const [type, setType] = useState<'email' | 'social' | 'sms'>('email');
    const [targetSegment, setTargetSegment] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('12:00');
    const [content, setContent] = useState('');

    const handleSubmit = async () => {
        if (!name.trim()) return;

        await upsertCampaign({
            id: `camp_${Date.now()}`,
            name: name.trim(),
            subject: subject.trim(),
            type: type,
            targetSegment: targetSegment.trim() || 'Tous les clients',
            scheduledDate,
            scheduledTime,
            content: content.trim(),
            status: (scheduledDate ? 'scheduled' : 'draft'),
        } as unknown as Parameters<typeof upsertCampaign>[0]);

        // Reset
        setName('');
        setSubject('');
        setType('email');
        setTargetSegment('');
        setScheduledDate('');
        setScheduledTime('12:00');
        setContent('');
        onClose();
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
                        className="absolute inset-0 bg-surface-sidebar/60 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-2xl bg-surface-card dark:bg-[#111] rounded-[3rem] shadow-2xl overflow-hidden border border-subtle"
                    >
                        {/* Header */}
                        <div className="px-10 py-8 border-b border-border/50 bg-bg-primary/50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-action-primary to-action-primary text-text-primary flex items-center justify-center shadow-lg">
                                    <Megaphone size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-serif font-bold text-text-primary tracking-tight">Nouvelle Campagne</h2>
                                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mt-1">Marketing Automation</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-10 h-10 rounded-full bg-bg-tertiary hover:bg-surface-bg hover:text-status-danger flex items-center justify-center transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="p-10 space-y-6 bg-bg-primary/30 max-h-[60vh] overflow-y-auto elegant-scrollbar">
                            {/* Campaign Name */}
                            <div>
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1 mb-2 block">Nom de la campagne</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ex: Offre de Printemps 2026"
                                    className="w-full bg-surface-card dark:bg-surface-card/5 rounded-2xl border border-border/50 px-6 py-4 text-sm font-medium outline-none focus:border-focus/50 transition-all"
                                />
                            </div>

                            {/* Type Selection */}
                            <div>
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1 mb-3 block">Type de campagne</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {CAMPAIGN_TYPES.map((ct) => (
                                        <button
                                            key={ct.id}
                                            onClick={() => setType(ct.id as 'email' | 'social' | 'sms')}
                                            className={`group flex flex-col items-center gap-2 p-5 rounded-2xl border transition-all ${
                                                type === ct.id
                                                    ? 'border-focus bg-action-primary/5 shadow-lg'
                                                    : 'border-border/50 hover:border-focus/30'
                                            }`}
                                        >
                                            <ct.icon className={`w-6 h-6 ${type === ct.id ? 'text-brand' : 'text-text-muted'}`} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{ct.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1 mb-2 block">Objet / Titre</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Découvrez nos nouvelles saveurs..."
                                    className="w-full bg-surface-card dark:bg-surface-card/5 rounded-2xl border border-border/50 px-6 py-4 text-sm font-medium outline-none focus:border-focus/50 transition-all"
                                />
                            </div>

                            {/* Content */}
                            <div>
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1 mb-2 block">Contenu</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Rédigez votre message ici..."
                                    rows={4}
                                    className="w-full bg-surface-card dark:bg-surface-card/5 rounded-2xl border border-border/50 px-6 py-4 text-sm font-medium outline-none focus:border-focus/50 transition-all resize-none"
                                />
                            </div>

                            {/* Audience */}
                            <div>
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1 mb-2 block flex items-center gap-2">
                                    <Users className="w-3.5 h-3.5" /> Audience cible
                                </label>
                                <input
                                    type="text"
                                    value={targetSegment}
                                    onChange={(e) => setTargetSegment(e.target.value)}
                                    placeholder="Tous les clients (ou nom du segment)"
                                    className="w-full bg-surface-card dark:bg-surface-card/5 rounded-2xl border border-border/50 px-6 py-4 text-sm font-medium outline-none focus:border-focus/50 transition-all"
                                />
                            </div>

                            {/* Schedule */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1 mb-2 block flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5" /> Date
                                    </label>
                                    <input
                                        type="date"
                                        value={scheduledDate}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                        className="w-full bg-surface-card dark:bg-surface-card/5 rounded-2xl border border-border/50 px-6 py-4 text-sm font-bold outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1 mb-2 block flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5" /> Heure
                                    </label>
                                    <input
                                        type="time"
                                        value={scheduledTime}
                                        onChange={(e) => setScheduledTime(e.target.value)}
                                        className="w-full bg-surface-card dark:bg-surface-card/5 rounded-2xl border border-border/50 px-6 py-4 text-sm font-bold outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-8 bg-surface-card dark:bg-[#111] border-t border-border flex gap-4">
                            <Button variant="ghost" className="flex-1 h-16 rounded-[1.5rem] font-bold uppercase tracking-widest text-xs" onClick={onClose}>
                                Annuler
                            </Button>
                            <Button
                                className="flex-[2] h-16 bg-gradient-to-r from-action-primary to-action-primary text-text-primary hover:from-action-primary hover:to-action-primary rounded-[1.5rem] transition-all font-black uppercase tracking-widest text-xs shadow-xl"
                                onClick={handleSubmit}
                                disabled={!name.trim()}
                            >
                                {scheduledDate ? 'Programmer' : 'Sauvegarder en brouillon'}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
