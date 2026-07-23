"use client";

import { useState } from "react";
import { X, Calendar, Clock, Users, MapPin, Tag, Plus, Check, Search, ChevronRight, ChevronLeft, UserCheck, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/ui.foundations";;
import { format } from "date-fns";
import { Modal } from "@ui/Modal";

interface NewReservationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (reservation: import('@nexus/contracts').Reservation) => void;
    customers: import('@nexus/contracts').Customer[];
}

export function NewReservationDialog({ isOpen, onClose, onSave, customers }: NewReservationDialogProps) {
    const [step, setStep] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<import('@nexus/contracts').Customer | null>(null);
    const [formData, setFormData] = useState({
        time: "20:00",
        covers: 2,
        tableId: "t1",
        date: format(new Date(), 'yyyy-MM-dd'),
        tags: [] as string[],
    });

    const filteredCustomers = customers.filter(c =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
    );

    const handleSubmit = () => {
        if (!selectedCustomer) return;
        onSave({
            ...formData,
            id: `res_${Math.random().toString(36).substr(2, 9)}`,
            customerId: selectedCustomer.id,
            customerName: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
            status: 'confirmed',
            duration: 120,
        } as unknown as import("@nexus/contracts").Reservation);
        onClose();
    };

    const reset = () => {
        setStep(1);
        setSearchQuery("");
        setSelectedCustomer(null);
    };

    const containerVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: {
            opacity: 1,
            x: 0,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1
            }
        },
        exit: { opacity: 0, x: -20 }
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
            size="xl"
            className="p-0 border-none bg-transparent"
            showClose={false}
            noPadding
        >
            <div className="flex flex-col h-[85vh] bg-bg-primary rounded-[3rem] overflow-hidden shadow-[0_32px_128px_rgba(0,0,0,0.15)] border border-border">
                {/* Premium Host Header */}
                <div className="px-12 py-10 bg-bg-secondary text-text-primary relative overflow-hidden shrink-0 border-b border-border">
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(212,175,55,0.1),transparent)]" />
                    </div>

                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            <div className="w-16 h-16 rounded-3xl bg-accent flex items-center justify-center shadow-xl shadow-amber-500/20">
                                <Calendar strokeWidth={1.5} className="w-8 h-8 text-bg-primary" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-serif font-black tracking-tight flex items-center gap-3 italic">
                                    Brigade <span className="text-accent not-italic">Premium</span>
                                    <Sparkles className="w-5 h-5 text-accent animate-pulse" />
                                </h2>
                                <div className="flex items-center gap-4 mt-1">
                                    <span className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em]">Signature Client Management</span>
                                    <div className="h-1 w-1 rounded-full bg-accent/40" />
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-3 h-3 text-accent" />
                                        <span className="text-accent text-[10px] font-black uppercase tracking-[0.2em]">IA Ops Active</span>
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

                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-card/10">
                        <motion.div
                            className="h-full bg-accent shadow-[0_0_15px_rgba(197,160,89,0.5)]"
                            initial={{ width: "50%" }}
                            animate={{ width: step === 1 ? "50%" : "100%" }}
                            transition={{ duration: 0.6, ease: "circOut" }}
                        />
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden flex bg-bg-primary">
                    {/* Left: Planning/Form */}
                    <div className="flex-1 p-12 overflow-y-auto elegant-scrollbar border-r border-border">
                        <AnimatePresence mode="wait">
                            {step === 1 ? (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-10"
                                >
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 px-2">
                                                <Search className="w-4 h-4 text-accent" />
                                                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Identification de l'Hôte</label>
                                            </div>
                                            <div className="relative group">
                                                <Search strokeWidth={1.5} className="absolute left-8 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted/30 group-focus-within:text-accent transition-colors" />
                                                <input
                                                    type="text"
                                                    value={searchQuery}
                                                    onChange={e => setSearchQuery(e.target.value)}
                                                    data-tutorial="reservations-0-0-1"
                                                    placeholder="RECHERCHER NOM, PRÉNOM OU TÉLÉPHONE..."
                                                    className="w-full h-20 bg-bg-secondary border border-border rounded-[2rem] pl-16 pr-8 text-lg font-serif italic text-text-primary focus:outline-none focus:border-accent/40 transition-all shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between px-4">
                                                <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Sélections Suggérées</span>
                                                <button className="text-[10px] font-black text-accent uppercase tracking-[0.3em] hover:opacity-70 transition-opacity flex items-center gap-2">
                                                    Créer une Fiche <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 gap-4">
                                                {filteredCustomers.slice(0, 5).map((customer, idx) => (
                                                    <motion.button
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        key={customer.id}
                                                        onClick={() => {
                                                            setSelectedCustomer(customer);
                                                            setStep(2);
                                                        }}
                                                        className={cn(
                                                            "group flex items-center justify-between p-6 rounded-[2.5rem] border transition-all duration-500 relative overflow-hidden backdrop-blur-xl",
                                                            selectedCustomer?.id === customer.id
                                                                ? "bg-accent border-accent text-bg-primary shadow-2xl shadow-amber-500/20"
                                                                : "bg-bg-secondary border-border hover:border-accent/30 hover:shadow-xl hover:bg-bg-tertiary shadow-sm"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-6 relative z-10">
                                                            <div className={cn(
                                                                "w-14 h-14 rounded-2xl flex items-center justify-center font-serif text-xl italic shadow-sm transition-all",
                                                                selectedCustomer?.id === customer.id ? "bg-surface-card/10 text-bg-primary" : "bg-bg-tertiary text-text-primary"
                                                            )}>
                                                                {(customer.firstName || ' ').trim().charAt(0)}{(customer.lastName || ' ').trim().charAt(0)}
                                                            </div>
                                                            <div className="text-left">
                                                                <p className={cn("text-xl font-serif italic", selectedCustomer?.id === customer.id ? "text-bg-primary" : "text-text-primary")}>
                                                                    {customer.firstName} {customer.lastName}
                                                                </p>
                                                                <div className="flex items-center gap-4 mt-1">
                                                                    <p className={cn("text-[10px] font-black tracking-widest", selectedCustomer?.id === customer.id ? "text-bg-primary/60" : "text-text-muted")}>
                                                                        {customer.phone}
                                                                    </p>
                                                                    <div className="w-1 h-1 rounded-full bg-accent" />
                                                                    <p className={cn("text-[10px] font-black tracking-widest uppercase", selectedCustomer?.id === customer.id ? "text-bg-primary" : "text-text-muted")}>
                                                                        {customer.visitCount} SÉJOURS
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <ChevronRight className={cn("w-6 h-6 transition-all group-hover:translate-x-1", selectedCustomer?.id === customer.id ? "text-bg-primary" : "text-text-muted/30")} />
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="step2"
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="space-y-12"
                                >
                                    <motion.div variants={itemVariants} className="flex items-center gap-6">
                                        <button onClick={() => setStep(1)} className="w-12 h-12 rounded-xl bg-bg-secondary hover:bg-bg-tertiary flex items-center justify-center transition-all border border-border">
                                            <ChevronLeft className="w-5 h-5 text-text-primary" />
                                        </button>
                                        <div>
                                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Client Référent</p>
                                            <p className="text-3xl font-serif italic text-text-primary">{selectedCustomer?.firstName} {selectedCustomer?.lastName}</p>
                                        </div>
                                    </motion.div>

                                    <div className="grid grid-cols-2 gap-10">
                                        <motion.div variants={itemVariants} className="space-y-4">
                                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-4 flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 text-accent" /> Heure de Service
                                            </label>
                                            <div className="relative group">
                                                <input
                                                    type="time"
                                                    value={formData.time}
                                                    onChange={e => setFormData(prev => ({ ...prev, time: e.target.value }))}
                                                    className="w-full h-16 bg-bg-secondary border border-border rounded-2xl px-8 text-2xl font-mono font-light text-text-primary focus:outline-none focus:border-accent/40 transition-all shadow-sm"
                                                />
                                            </div>
                                        </motion.div>
                                        <motion.div variants={itemVariants} className="space-y-4">
                                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-4 flex items-center gap-2">
                                                <Users className="w-3.5 h-3.5 text-accent" /> Volume Convives
                                            </label>
                                            <div className="flex items-center justify-between bg-bg-secondary border border-border rounded-2xl p-3 shadow-sm">
                                                <div className="flex items-center gap-6 w-full justify-between">
                                                    <button
                                                        onClick={() => setFormData(prev => ({ ...prev, covers: Math.max(1, prev.covers - 1) }))}
                                                        className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center hover:bg-bg-primary transition-all font-black text-lg text-text-primary"
                                                    >-</button>
                                                    <span className="text-3xl font-mono font-light text-text-primary">{formData.covers}</span>
                                                    <button
                                                        onClick={() => setFormData(prev => ({ ...prev, covers: prev.covers + 1 }))}
                                                        className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center hover:bg-bg-primary transition-all font-black text-lg text-text-primary"
                                                    >+</button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>

                                    <motion.div variants={itemVariants} className="space-y-6">
                                        <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-4 flex items-center gap-2">
                                            <MapPin className="w-3.5 h-3.5 text-accent" /> Assignation Suggérée (Disponibilités Réelles)
                                        </label>
                                        <div className="grid grid-cols-3 gap-6">
                                            {['t1', 't2', 't3', 't4', 't5', 't6'].map((tId, idx) => (
                                                <motion.button
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    key={tId}
                                                    onClick={() => setFormData(prev => ({ ...prev, tableId: tId }))}
                                                    className={cn(
                                                        "p-8 rounded-[2.5rem] border transition-all duration-300 text-center group relative overflow-hidden",
                                                        formData.tableId === tId
                                                            ? "bg-accent border-accent text-bg-primary shadow-xl shadow-amber-500/10"
                                                            : "bg-bg-secondary border-border hover:border-accent/20 hover:bg-bg-tertiary"
                                                    )}
                                                >
                                                    <p className={cn("text-[9px] font-black tracking-widest mb-2 transition-colors", formData.tableId === tId ? "text-bg-primary/60" : "text-white/40")}>UNITÉ D'ACCUEIL</p>
                                                    <p className="text-3xl font-serif font-black italic">#{tId.replace('t', '')}</p>

                                                    {formData.tableId === tId && (
                                                        <motion.div layoutId="table-check" className="absolute top-2 right-4">
                                                            <Check className="w-5 h-5 text-bg-primary" />
                                                        </motion.div>
                                                    )}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right: Intelligence Panel */}
                    <div className="w-[380px] bg-bg-secondary p-12 flex flex-col justify-between shrink-0 border-l border-border">
                        <div className="space-y-10">
                            {/* Header removed as requested to move content up */}

                            {selectedCustomer ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-8"
                                >
                                    <div className="space-y-4">
                                        <p className="text-[9px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                                            <Tag className="w-3 h-3 text-accent" /> Habits & Préférences
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedCustomer.preferences.map((pref: string, i: number) => (
                                                <span key={i} className="px-4 py-2 bg-surface-card dark:bg-surface-card/5 text-[10px] font-black text-text-primary dark:text-white rounded-xl border border-border dark:border-white/5 uppercase tracking-widest shadow-sm">
                                                    {pref}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-8 rounded-[2.5rem] bg-surface-card dark:bg-surface-card/5 border border-accent/20 relative overflow-hidden group shadow-sm">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full -mr-12 -mt-12 group-hover:bg-accent/10 transition-colors" />
                                        <p className="text-[9px] font-black text-accent uppercase tracking-[0.2em] mb-4 flex items-center gap-2 italic">
                                            <Sparkles className="w-3.5 h-3.5" /> Note de Service
                                        </p>
                                        <p className="text-[13px] text-text-primary dark:text-white font-serif italic leading-relaxed">
                                            "Client habitué de la zone Alpha. Préfère l'eau minérale à température ambiante. Attention particulière sur le timing du service."
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-text-muted">
                                            <span>Score Fidélité</span>
                                            <span className="text-accent">Gold Member</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-border dark:bg-surface-card/5 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-accent" />
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="py-12 text-center space-y-6">
                                    <div className="w-20 h-20 rounded-full bg-surface-card dark:bg-surface-card/5 flex items-center justify-center mx-auto border border-dashed border-border dark:border-subtle shadow-sm">
                                        <UserCheck strokeWidth={1} className="w-10 h-10 text-text-muted/50" />
                                    </div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted max-w-[200px] mx-auto leading-relaxed italic">
                                        Veuillez identifier un convive pour activer l'analyse prédictive.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                                <span className="text-text-muted">Disponibilité Salon</span>
                                <span className="text-[#00D9A6] flex items-center gap-2 animate-pulse">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#00D9A6]" />
                                    Optimale
                                </span>
                            </div>

                            <Button
                                disabled={!selectedCustomer}
                                onClick={handleSubmit}
                                data-tutorial="reservations-0-0-2"
                                className="w-full h-20 bg-accent hover:bg-surface-card text-bg-primary rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all shadow-2xl shadow-amber-500/30 disabled:opacity-20 transform hover:scale-[1.02] flex items-center justify-center gap-3"
                            >
                                <ArrowRight className="w-5 h-5" />
                                Confirmer la Réservation
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
