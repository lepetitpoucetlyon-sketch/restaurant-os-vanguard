"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Calendar, Sparkles, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Modal } from "@ui/Modal";
import type { Customer, Reservation } from "@nexus/contracts";
import type { Table } from "@/modules/ops";

import { filterAvailableTables } from './reservation-create/reservationHelpers';
import { ResaStepCustomer } from './reservation-create/ResaStepCustomer';
import { ResaStepDetails } from './reservation-create/ResaStepDetails';
import { ResaSummaryPanel } from './reservation-create/ResaSummaryPanel';

import { useLanguage } from "@/shared/hooks";
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

export function ReservationCreateDialog({
    isOpen,
    onClose,
    onSave,
    customers,
    tables,
    terraceClosed = false,
}: ReservationCreateDialogProps) {
    const { t } = useLanguage();
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

    // Auto table suggestion
    const suggestedTable = useMemo(() => {
        const available = filterAvailableTables(tables, terraceClosed, formData.covers);
        available.sort((a, b) => (a.seats ?? 0) - (b.seats ?? 0));
        return available[0] ?? null;
    }, [tables, formData.covers, terraceClosed]);

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
                                    Nouvelle <span className="text-accent not-italic">{t('commerce.reservations.reservation')}</span>
                                    <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                                </h2>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-text-muted text-nano font-black uppercase tracking-[0.3em]">
                                        {step === 1 ? "Sélection du client" : "Détails de la réservation"}
                                    </span>
                                    <div className="h-1 w-1 rounded-full bg-accent/40" />
                                    <div className="flex items-center gap-1.5">
                                        <ShieldCheck className="w-3 h-3 text-accent" />
                                        <span className="text-accent text-nano font-black uppercase tracking-[0.2em]">Attribution auto</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button aria-label="Fermer"
                            onClick={handleClose}
                            className="w-11 h-11 rounded-2xl bg-bg-tertiary hover:bg-bg-primary border border-border flex items-center justify-center transition-all"
                        >
                            <X className="w-5 h-5 text-text-muted hover:text-text-primary" />
                        </button>
                    </div>

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
                    <div className="flex-1 p-10 overflow-y-auto border-r border-border">
                        <AnimatePresence mode="wait">
                            {step === 1 ? (
                                <ResaStepCustomer
                                    searchQuery={searchQuery}
                                    onSearchChange={setSearchQuery}
                                    filteredCustomers={filteredCustomers}
                                    selectedCustomer={selectedCustomer}
                                    onSelectCustomer={(c) => { setSelectedCustomer(c); setStep(2); }}
                                />
                            ) : (
                                <ResaStepDetails
                                    selectedCustomer={selectedCustomer}
                                    formData={formData}
                                    setFormData={setFormData}
                                    suggestedTable={suggestedTable}
                                    availableTables={availableTables}
                                    onBack={() => setStep(1)}
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    <ResaSummaryPanel
                        selectedCustomer={selectedCustomer}
                        formData={formData}
                        suggestedTable={suggestedTable}
                        availableTables={availableTables}
                        step={step}
                        saving={saving}
                        onSubmit={handleSubmit}
                    />
                </div>
            </div>
        </Modal>
    );
}
