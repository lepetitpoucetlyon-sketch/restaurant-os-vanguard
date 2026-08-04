"use client";

import { useState } from "react";
import { X, User, Phone, Mail, Plus, Save, Tag as TagIcon, Star, Sparkles, Gem, ShieldCheck } from "lucide-react";
import { Button } from "@ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@ui/Modal";

interface NewCustomerDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (customer: import('@nexus/contracts').Customer) => void;
}

export function NewCustomerDialog({ isOpen, onClose, onSave }: NewCustomerDialogProps) {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        tags: [] as string[],
        preferences: [] as string[],
    });

    const [newTag, setNewTag] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const now = new Date().toISOString();
        onSave({
            ...formData,
            id: `cust_${crypto.randomUUID()}`,
            visitCount: 0,
            totalSpentInMicrounits: 0,
            averageSpendInMicrounits: 0,
            lastVisitDate: undefined,
            createdAt: now,
            updatedAt: now,
        });
        reset();
        onClose();
    };

    const addTag = () => {
        if (newTag && !formData.tags.includes(newTag)) {
            setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
            setNewTag("");
        }
    };

    const reset = () => {
        setFormData({
            firstName: "",
            lastName: "",
            phone: "",
            email: "",
            tags: [],
            preferences: [],
        });
        setNewTag("");
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" as const }
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => { onClose(); setTimeout(reset, 300); }}
            size="lg"
            className="p-0 border-none bg-transparent"
            showClose={false}
            noPadding
        >
            <div className="flex flex-col h-[75vh] bg-bg-primary rounded-[3rem] overflow-hidden shadow-[0_32px_128px_rgba(0,0,0,0.15)] border border-border">
                {/* Premium Customer Header */}
                <div className="px-12 py-10 bg-bg-secondary text-text-primary relative overflow-hidden shrink-0 border-b border-border">
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(212,175,55,0.1),transparent)]" />
                    </div>

                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            <div className="w-16 h-16 rounded-3xl bg-accent flex items-center justify-center shadow-xl shadow-amber-500/20">
                                <User strokeWidth={1.5} className="w-8 h-8 text-bg-primary" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-serif font-black tracking-tight flex items-center gap-3 italic">
                                    Nouveau <span className="text-accent not-italic">Chef de File</span>
                                    <Sparkles className="w-5 h-5 text-accent animate-pulse" />
                                </h2>
                                <div className="flex items-center gap-4 mt-1">
                                    <span className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em]">Enregistrement Customer Certifié</span>
                                    <div className="h-1 w-1 rounded-full bg-surface-card/10" />
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-3 h-3 text-accent" />
                                        <span className="text-accent text-[10px] font-black uppercase tracking-[0.2em]">Client Integrity Protocol</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-12 h-12 rounded-2xl bg-bg-tertiary hover:bg-bg-primary border border-border flex items-center justify-center transition-all group"
                        >
                            <X className="w-6 h-6 text-text-muted group-hover:text-text-primary" />
                        </button>
                    </div>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto elegant-scrollbar p-12 space-y-12 bg-bg-primary">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-12"
                    >
                        <motion.div variants={itemVariants} className="space-y-8">
                            <div className="flex items-center gap-4 border-b border-border pb-6">
                                <Gem className="w-5 h-5 text-accent" />
                                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-text-primary">État Civil & Contact</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-4">Prénom du client</label>
                                    <input
                                        required
                                        value={formData.firstName}
                                        onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                        className="w-full h-16 bg-bg-secondary border border-border rounded-2xl px-8 text-xl font-serif italic text-text-primary focus:outline-none focus:border-accent/40 transition-all shadow-sm"
                                        placeholder="Ex: Alexandre"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-4">Nom de famille</label>
                                    <input
                                        required
                                        value={formData.lastName}
                                        onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                        className="w-full h-16 bg-bg-secondary border border-border rounded-2xl px-8 text-xl font-serif italic text-text-primary focus:outline-none focus:border-accent/40 transition-all shadow-sm"
                                        placeholder="Ex: de Villedieu"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-4">Ligne Directe</label>
                                    <div className="relative group">
                                        <Phone strokeWidth={1.5} className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-accent group-focus-within:scale-110 transition-transform" />
                                        <input
                                            required
                                            value={formData.phone}
                                            onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full h-16 bg-bg-secondary border border-border rounded-2xl pl-16 pr-8 font-mono text-lg text-text-primary focus:outline-none focus:border-accent/40 transition-all shadow-sm"
                                            placeholder="+33 6 00 00 00 00"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-4">Communication Email</label>
                                    <div className="relative group">
                                        <Mail strokeWidth={1.5} className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-accent group-focus-within:scale-110 transition-transform" />
                                        <input
                                            value={formData.email}
                                            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full h-16 bg-bg-secondary border border-border rounded-2xl pl-16 pr-8 font-mono text-lg text-text-primary focus:outline-none focus:border-accent/40 transition-all shadow-sm"
                                            placeholder="alexandre@domaine.com"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Segmentation */}
                        <motion.div variants={itemVariants} className="space-y-8">
                            <div className="flex items-center gap-4 border-b border-border pb-6">
                                <Star className="w-5 h-5 text-accent" />
                                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-text-primary">Segmentation & VIP Profiling</h3>
                            </div>

                            <div className="space-y-6">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-4">Tags de Reconnaissance</label>
                                <div className="flex flex-wrap gap-4 p-8 bg-bg-secondary border-2 border-dashed border-border rounded-[2.5rem] relative overflow-hidden">
                                    <AnimatePresence mode="popLayout">
                                        {formData.tags.map(tag => (
                                            <motion.span
                                                key={tag}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                className="px-6 py-3 bg-accent text-bg-primary rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-4 relative z-10 shadow-lg shadow-amber-500/20"
                                            >
                                                {tag}
                                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))} className="hover:text-bg-primary transition-colors">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </motion.span>
                                        ))}
                                    </AnimatePresence>
                                    <div className="flex bg-bg-primary border border-border rounded-[1.5rem] px-6 items-center focus-within:border-accent/40 transition-all shadow-sm relative z-10">
                                        <TagIcon className="w-3.5 h-3.5 text-accent mr-3" />
                                        <input
                                            value={newTag}
                                            onChange={e => setNewTag(e.target.value)}
                                            onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                            className="bg-transparent border-none outline-none py-4 text-[11px] font-black uppercase tracking-widest text-text-primary w-32 placeholder:text-text-muted/40"
                                            placeholder="AJOUTER..."
                                        />
                                        <Plus onClick={addTag} className="w-5 h-5 text-accent cursor-pointer hover:scale-120 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>

                </form>

                {/* Footer */}
                <div className="px-12 py-10 bg-bg-secondary border-t border-border flex items-center justify-between shrink-0">
                    <button
                        onClick={onClose}
                        className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted hover:text-text-primary transition-colors px-4 py-2"
                    >
                        Abandonner la saisie
                    </button>
                    <div className="flex gap-6">
                        <Button
                            onClick={handleSubmit}
                            className="h-16 px-16 bg-accent hover:bg-surface-card text-bg-primary rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all shadow-2xl shadow-amber-500/30 transform hover:scale-[1.05] flex items-center gap-4"
                        >
                            <Save className="w-5 h-5 text-bg-primary" />
                            Finaliser le Profil
                        </Button>
                    </div>
                </div>
            </div>
        </Modal >
    );
}
