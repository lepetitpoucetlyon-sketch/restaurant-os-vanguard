"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Calendar, Clock, Users, MapPin, Search, ChevronLeft, ChevronRight, Sparkles, ArrowRight, ShieldCheck, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/ui.foundations";
import { Modal } from "@ui/Modal";
import type { Customer, Reservation } from "@nexus/contracts";
import type { Table } from "@/modules/ops";

interface ReservationCreateDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (reservation: Partial<Reservation> & { suggestedTable?: Table }) => Promise<void> | void;
    customers: Customer[];
    tables: Table[];
    /** When true, terrace tables are excluded from auto-suggestion */
    terraceClosed?: boolean;
}

type Step = 1 | 2;

import { filterAvailableTables, TERRACE_ZONE_IDS } from './reservation-create/reservationHelpers';

export function ReservationCreateDialog({
    isOpen,
    onClose,
    onSave,
    customers,
    tables,
    terraceClosed = false,
}: ReservationCreateDialogProps) {
    const [step, setStep] = useState<Step>(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        time: "20:00",
        covers: 2,
        tableId: "",
        date: format(new Date(), "yyyy-MM-dd"),
        notes: "",
    });

    // ── Auto table suggestion ────────────────────────────────────────────────
    const suggestedTable = useMemo(() => {
        const available = filterAvailableTables(tables, terraceClosed, formData.covers);
        available.sort((a, b) => (a.seats ?? 0) - (b.seats ?? 0));
        return available[0] ?? null;
    }, [tables, formData.covers, terraceClosed]);

    // Apply suggestion whenever it changes (user can still override)
    useEffect(() => {
        if (suggestedTable && !formData.tableId) {
            setFormData((f) => ({ ...f, tableId: suggestedTable.id }));
        }
    }, [suggestedTable]);  

    const filteredCustomers = useMemo(
        () =>
            customers.filter((c) => {
                const full = `${c.firstName} ${c.lastName}`.toLowerCase();
                const q = searchQuery.toLowerCase();
                return full.includes(q) || c.phone.includes(q);
            }),
        [customers, searchQuery]
    );

    const handleSubmit = async () => {
        if (!selectedCustomer) return;
        setSaving(true);
        try {
            const arr = new Uint32Array(1);
            crypto.getRandomValues(arr);
            const id = `res_${arr[0].toString(36)}`;

            const payload: Partial<Reservation> & { suggestedTable?: Table } = {
                id,
                customerId: selectedCustomer.id,
                customerName: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
                date: formData.date,
                time: formData.time,
                covers: formData.covers,
                partySize: formData.covers,
                tableId: formData.tableId || suggestedTable?.id,
                notes: formData.notes,
                status: "confirmed",
                duration: 120,
                suggestedTable: suggestedTable ?? undefined,
            };
            await onSave(payload);
            resetForm();
            onClose();
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setStep(1);
        setSearchQuery("");
        setSelectedCustomer(null);
        setFormData({ time: "20:00", covers: 2, tableId: "", date: format(new Date(), "yyyy-MM-dd"), notes: "" });
    };

    const handleClose = () => {
        onClose();
        setTimeout(resetForm, 300);
    };

    const availableTables = useMemo(
        () => filterAvailableTables(tables, terraceClosed),
        [tables, terraceClosed]
    );

    const itemV = {
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="xl" className="p-0 border-none bg-transparent" showClose={false} noPadding>
            <div className="flex flex-col h-[85vh] bg-bg-primary rounded-[3rem] overflow-hidden shadow-[0_32px_128px_rgba(0,0,0,0.15)] border border-border">
                {/* Header */}
                <div className="px-10 py-8 bg-bg-secondary border-b border-border shrink-0 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(212,175,55,0.08),transparent)] pointer-events-none" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-3xl bg-accent flex items-center justify-center shadow-xl shadow-amber-500/20">
                                <Calendar className="w-7 h-7 text-bg-primary" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-serif font-black tracking-tight italic flex items-center gap-2">
                                    Nouvelle <span className="text-accent not-italic">Réservation</span>
                                    <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                                </h2>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em]">
                                        {step === 1 ? "Sélection du client" : "Détails de la réservation"}
                                    </span>
                                    <div className="h-1 w-1 rounded-full bg-accent/40" />
                                    <div className="flex items-center gap-1.5">
                                        <ShieldCheck className="w-3 h-3 text-accent" />
                                        <span className="text-accent text-[10px] font-black uppercase tracking-[0.2em]">Attribution auto</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="w-11 h-11 rounded-2xl bg-bg-tertiary hover:bg-bg-primary border border-border flex items-center justify-center transition-all"
                        >
                            <X className="w-5 h-5 text-text-muted hover:text-text-primary" />
                        </button>
                    </div>

                    {/* Progress bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-surface-card/10">
                        <motion.div
                            className="h-full bg-accent shadow-[0_0_12px_rgba(197,160,89,0.4)]"
                            initial={{ width: "50%" }}
                            animate={{ width: step === 1 ? "50%" : "100%" }}
                            transition={{ duration: 0.5, ease: "circOut" }}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex bg-bg-primary">
                    {/* Left — Form */}
                    <div className="flex-1 p-10 overflow-y-auto border-r border-border">
                        <AnimatePresence mode="wait">
                            {step === 1 ? (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 16 }}
                                    className="space-y-8"
                                >
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] flex items-center gap-2">
                                            <Search className="w-3.5 h-3.5 text-accent" />
                                            Identification du client
                                        </label>
                                        <div className="relative group">
                                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/40 group-focus-within:text-accent transition-colors" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Nom, prénom ou téléphone…"
                                                className="w-full h-16 bg-bg-secondary border border-border rounded-[1.5rem] pl-14 pr-6 text-base font-serif italic text-text-primary focus:outline-none focus:border-accent/40 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {filteredCustomers.slice(0, 6).map((customer, idx) => (
                                            <motion.button
                                                key={customer.id}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.04 }}
                                                onClick={() => { setSelectedCustomer(customer); setStep(2); }}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-5 rounded-[1.5rem] border transition-all duration-300",
                                                    selectedCustomer?.id === customer.id
                                                        ? "bg-accent border-accent text-bg-primary shadow-xl shadow-amber-500/15"
                                                        : "bg-bg-secondary border-border hover:border-accent/30 hover:shadow-lg hover:bg-bg-tertiary"
                                                )}
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-xl flex items-center justify-center font-serif text-lg italic shadow-sm",
                                                        selectedCustomer?.id === customer.id ? "bg-surface-card/10 text-bg-primary" : "bg-bg-tertiary text-text-primary"
                                                    )}>
                                                        {(customer.firstName || " ").charAt(0)}{(customer.lastName || " ").charAt(0)}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className={cn("text-lg font-serif italic", selectedCustomer?.id === customer.id ? "text-bg-primary" : "text-text-primary")}>
                                                            {customer.firstName} {customer.lastName}
                                                        </p>
                                                        <p className={cn("text-[10px] font-black tracking-widest", selectedCustomer?.id === customer.id ? "text-bg-primary/60" : "text-text-muted")}>
                                                            {customer.phone} · {customer.visitCount ?? 0} séjours
                                                        </p>
                                                    </div>
                                                </div>
                                                <ChevronRight className={cn("w-5 h-5", selectedCustomer?.id === customer.id ? "text-bg-primary" : "text-text-muted/30")} />
                                            </motion.button>
                                        ))}
                                        {filteredCustomers.length === 0 && (
                                            <p className="text-center text-[11px] text-text-muted uppercase tracking-widest py-8">
                                                Aucun client trouvé
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -16 }}
                                    className="space-y-10"
                                >
                                    <div className="flex items-center gap-5">
                                        <button
                                            onClick={() => setStep(1)}
                                            className="w-10 h-10 rounded-xl bg-bg-secondary hover:bg-bg-tertiary flex items-center justify-center border border-border transition-all"
                                        >
                                            <ChevronLeft className="w-4 h-4 text-text-primary" />
                                        </button>
                                        <div>
                                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Client</p>
                                            <p className="text-2xl font-serif italic text-text-primary">
                                                {selectedCustomer?.firstName} {selectedCustomer?.lastName}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Date */}
                                        <motion.div variants={itemV} className="space-y-3">
                                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5 text-accent" /> Date
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.date}
                                                onChange={(e) => setFormData((f) => ({ ...f, date: e.target.value }))}
                                                className="w-full h-14 bg-bg-secondary border border-border rounded-2xl px-5 text-base font-mono font-light text-text-primary focus:outline-none focus:border-accent/40 transition-all"
                                            />
                                        </motion.div>

                                        {/* Time */}
                                        <motion.div variants={itemV} className="space-y-3">
                                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 text-accent" /> Heure
                                            </label>
                                            <input
                                                type="time"
                                                value={formData.time}
                                                onChange={(e) => setFormData((f) => ({ ...f, time: e.target.value }))}
                                                className="w-full h-14 bg-bg-secondary border border-border rounded-2xl px-5 text-xl font-mono font-light text-text-primary focus:outline-none focus:border-accent/40 transition-all"
                                            />
                                        </motion.div>

                                        {/* Covers */}
                                        <motion.div variants={itemV} className="space-y-3">
                                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Users className="w-3.5 h-3.5 text-accent" /> Couverts
                                            </label>
                                            <div className="flex items-center justify-between bg-bg-secondary border border-border rounded-2xl p-2">
                                                <button
                                                    onClick={() => setFormData((f) => ({ ...f, covers: Math.max(1, f.covers - 1), tableId: "" }))}
                                                    className="w-9 h-9 rounded-xl bg-bg-tertiary flex items-center justify-center hover:bg-bg-primary transition-all font-black text-lg text-text-primary"
                                                >
                                                    −
                                                </button>
                                                <span className="text-2xl font-mono font-light text-text-primary">{formData.covers}</span>
                                                <button
                                                    onClick={() => setFormData((f) => ({ ...f, covers: f.covers + 1, tableId: "" }))}
                                                    className="w-9 h-9 rounded-xl bg-bg-tertiary flex items-center justify-center hover:bg-bg-primary transition-all font-black text-lg text-text-primary"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </motion.div>

                                        {/* Auto table suggestion */}
                                        <motion.div variants={itemV} className="space-y-3">
                                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                                                <MapPin className="w-3.5 h-3.5 text-accent" /> Table
                                            </label>
                                            {suggestedTable ? (
                                                <div className="h-14 bg-accent/5 border border-accent/30 rounded-2xl px-5 flex items-center justify-between">
                                                    <span className="text-[11px] font-black text-accent uppercase tracking-widest">
                                                        Suggérée : Table {suggestedTable.number} ({suggestedTable.seats} pl.)
                                                    </span>
                                                    <Check className="w-4 h-4 text-accent" />
                                                </div>
                                            ) : (
                                                <div className="h-14 bg-bg-secondary border border-border rounded-2xl px-5 flex items-center">
                                                    <span className="text-[11px] text-text-muted uppercase tracking-widest">
                                                        Aucune table disponible
                                                    </span>
                                                </div>
                                            )}
                                        </motion.div>
                                    </div>

                                    {/* Table override grid */}
                                    {availableTables.length > 0 && (
                                        <motion.div variants={itemV} className="space-y-4">
                                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                                Choisir manuellement (optionnel)
                                            </p>
                                            <div className="grid grid-cols-4 gap-3">
                                                {availableTables.slice(0, 8).map((t) => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => setFormData((f) => ({ ...f, tableId: t.id }))}
                                                        className={cn(
                                                            "p-4 rounded-2xl border text-center transition-all",
                                                            formData.tableId === t.id
                                                                ? "bg-accent border-accent text-bg-primary shadow-md shadow-amber-500/10"
                                                                : t.id === suggestedTable?.id
                                                                ? "bg-accent/5 border-accent/30 text-text-primary"
                                                                : "bg-bg-secondary border-border hover:border-accent/20 text-text-primary"
                                                        )}
                                                    >
                                                        <p className="text-xs font-black">#{t.number}</p>
                                                        <p className="text-[9px] text-text-muted mt-0.5">{t.seats} pl.</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Notes */}
                                    <motion.div variants={itemV} className="space-y-3">
                                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Notes</label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                                            rows={2}
                                            placeholder="Allergie, préférence, occasion spéciale…"
                                            className="w-full bg-bg-secondary border border-border rounded-2xl px-5 py-3 text-sm text-text-primary focus:outline-none focus:border-accent/40 resize-none transition-all"
                                        />
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right — Summary panel */}
                    <div className="w-[300px] bg-bg-secondary p-10 flex flex-col justify-between shrink-0 border-l border-border">
                        <div className="space-y-6">
                            {selectedCustomer ? (
                                <>
                                    <div>
                                        <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Sparkles className="w-3 h-3 text-accent" /> Profil client
                                        </p>
                                        <p className="text-xl font-serif italic text-text-primary">
                                            {selectedCustomer.firstName} {selectedCustomer.lastName}
                                        </p>
                                        <p className="text-[11px] text-text-muted mt-1">{selectedCustomer.phone}</p>
                                        {selectedCustomer.email && (
                                            <p className="text-[10px] text-text-muted">{selectedCustomer.email}</p>
                                        )}
                                    </div>

                                    {selectedCustomer.preferences.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedCustomer.preferences.slice(0, 4).map((p, i) => (
                                                <span key={i} className="px-3 py-1 bg-bg-tertiary text-[9px] font-black text-text-muted rounded-xl border border-border uppercase tracking-widest">
                                                    {p}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="p-5 rounded-2xl bg-accent/5 border border-accent/20">
                                        <p className="text-[9px] font-black text-accent uppercase tracking-widest mb-2">Résumé</p>
                                        <p className="text-[11px] text-text-muted leading-relaxed">
                                            {formData.date} à {formData.time} — {formData.covers} couv.
                                            {(formData.tableId || suggestedTable) && (
                                                <> — Table #{(formData.tableId ? availableTables.find((t) => t.id === formData.tableId)?.number : suggestedTable?.number) ?? "?"}</>
                                            )}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="py-12 text-center space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto border border-dashed border-border">
                                        <Users strokeWidth={1} className="w-8 h-8 text-text-muted/30" />
                                    </div>
                                    <p className="text-[11px] font-black uppercase tracking-widest text-text-muted max-w-[160px] mx-auto leading-relaxed italic">
                                        Sélectionnez un client pour continuer
                                    </p>
                                </div>
                            )}
                        </div>

                        <button
                            disabled={!selectedCustomer || step !== 2 || saving}
                            onClick={handleSubmit}
                            className="w-full h-16 bg-accent text-bg-primary rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.25em] transition-all shadow-2xl shadow-amber-500/20 disabled:opacity-20 disabled:cursor-not-allowed hover:scale-[1.02] flex items-center justify-center gap-3"
                        >
                            <ArrowRight className="w-4 h-4" />
                            {saving ? "Enregistrement…" : "Confirmer"}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
