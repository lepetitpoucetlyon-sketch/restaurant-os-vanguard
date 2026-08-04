"use client";

/**
 * EventQuoteModal — res-8
 * Devis privatisation / événement.
 * - Formulaire: client, date, couverts, formule, montant HT, acompte 30 %
 * - Persiste en Nexus: tenants/{tenantId}/eventQuotes/{id}  status: 'draft'
 * - Bouton "Générer contrat" → generatePrivatisationContract (jsPDF, client-side)
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { X, FileText, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/ui.foundations";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { whiteLabelInstanceConfig } from "@/config/instance";

import type { PrivatisationData } from "@/domain/schemas/commerce";
import type { EventQuoteFormData } from "./EventQuoteTypes";
import { EventQuoteClientSection, EventQuoteEventSection, EventQuoteFinancialSection } from "./EventQuoteFormSections";

const INITIAL: EventQuoteFormData = {
    clientNom: "",
    clientPrenom: "",
    clientEmail: "",
    clientTelephone: "",
    evenementNom: "",
    dateEvenement: format(new Date(), "yyyy-MM-dd"),
    heureDebut: "19:00",
    heureFin: "23:30",
    nombreConvives: 50,
    formule: "menu",
    descriptionFormule: "",
    montantHT: 0,
};

interface EventQuoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    tenantId: string;
}

export function EventQuoteModal({ isOpen, onClose, tenantId }: EventQuoteModalProps) {
    const [form, setForm] = useState<EventQuoteFormData>(INITIAL);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [savedId, setSavedId] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setForm(INITIAL);
            setSavedId(null);
        }
    }, [isOpen]);

    const acompte30 = useMemo(() => form.montantHT * 0.3, [form.montantHT]);
    const montantTTC = useMemo(() => form.montantHT * 1.2, [form.montantHT]);

    const set = useCallback(<K extends keyof EventQuoteFormData>(key: K, val: EventQuoteFormData[K]) => {
        setForm((f) => ({ ...f, [key]: val }));
    }, []);

    const isValid =
        form.clientNom.trim() !== "" &&
        form.clientEmail.includes("@") &&
        form.evenementNom.trim() !== "" &&
        form.dateEvenement !== "" &&
        form.nombreConvives > 0 &&
        form.montantHT > 0;

    const handleSaveDraft = useCallback(async (): Promise<string | null> => {
        if (!isValid) return null;
        setSaving(true);
        try {
            const arr = new Uint32Array(1);
            crypto.getRandomValues(arr);
            const id = `evq_${arr[0].toString(36)}`;

            await Nexus.adapter.set(`tenants/${tenantId}/eventQuotes/${id}`, {
                id,
                status: "draft",
                ...form,
                acompte30,
                montantTTC,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            setSavedId(id);
            toast.success("Devis enregistré en brouillon");
            return id;
        } catch {
            toast.error("Erreur lors de la sauvegarde du devis");
            return null;
        } finally {
            setSaving(false);
        }
    }, [form, isValid, tenantId, acompte30, montantTTC]);

    const handleGenerateContract = useCallback(async () => {
        if (!isValid) {
            toast.error("Veuillez remplir tous les champs obligatoires");
            return;
        }

        setGenerating(true);
        try {
            let quoteId = savedId;
            if (!quoteId) {
                quoteId = await handleSaveDraft();
                if (!quoteId) {
                    setGenerating(false);
                    return;
                }
            }

        // FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
         
            const { generatePrivatisationContract } = await import("@/shared/nexus/engines/Ledger/documents");

            const restaurantNom = whiteLabelInstanceConfig.identityDefaults.name || whiteLabelInstanceConfig.appName;

            const data: PrivatisationData = {
                clientNom: form.clientNom,
                clientPrenom: form.clientPrenom,
                clientEmail: form.clientEmail,
                clientTelephone: form.clientTelephone,

                evenementNom: form.evenementNom,
                dateEvenement: form.dateEvenement,
                heureDebut: form.heureDebut,
                heureFin: form.heureFin,
                nombreConvives: form.nombreConvives,
                formule: form.formule,
                descriptionFormule: form.descriptionFormule || undefined,

                montantHT: form.montantHT,

                restaurantNom,
                restaurantAdresse: whiteLabelInstanceConfig.identityDefaults.shortDescription || "—",
                restaurantTelephone: whiteLabelInstanceConfig.supportPhone || undefined,
                restaurantEmail: whiteLabelInstanceConfig.supportEmail || undefined,

                numeroContrat: quoteId.toUpperCase(),
                dateSignature: format(new Date(), "yyyy-MM-dd"),
            };

            generatePrivatisationContract(data);
            toast.success("Contrat PDF généré");
        } catch {
            toast.error("Erreur lors de la génération du contrat");
        } finally {
            setGenerating(false);
        }
    }, [form, isValid, savedId, handleSaveDraft]);

    const handleClose = useCallback(() => {
        setForm(INITIAL);
        setSavedId(null);
        onClose();
    }, [onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="event-quote-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 24 }}
                        transition={{ type: "spring", stiffness: 380, damping: 28 }}
                        className="bg-bg-primary border border-border rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
                    >
                        <div className="sticky top-0 z-10 bg-bg-primary/95 backdrop-blur-md px-8 py-6 border-b border-border flex items-center justify-between rounded-t-[2.5rem]">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-2xl bg-accent/10 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-accent" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black uppercase tracking-widest text-text-primary flex items-center gap-2">
                                        Devis Événement
                                        <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
                                    </h2>
                                    <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">
                                        Privatisation / Séminaire / Banquet
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="w-9 h-9 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            <EventQuoteClientSection form={form} set={set} />
                            <EventQuoteEventSection form={form} set={set} />
                            <EventQuoteFinancialSection form={form} set={set} acompte30={acompte30} montantTTC={montantTTC} />

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="h-12 px-6 rounded-2xl border border-border text-text-muted text-[11px] font-black uppercase tracking-widest hover:border-text-muted/40 hover:text-text-primary transition-all"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveDraft}
                                    disabled={!isValid || saving}
                                    className={cn(
                                        "flex-1 h-12 rounded-2xl border border-accent/30 text-accent text-[11px] font-black uppercase tracking-widest transition-all",
                                        "hover:bg-accent/10 disabled:opacity-30 disabled:cursor-not-allowed",
                                        savedId ? "bg-accent/10" : ""
                                    )}
                                >
                                    {saving ? "Sauvegarde…" : savedId ? "Brouillon sauvegardé" : "Sauvegarder le devis"}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleGenerateContract}
                                    disabled={!isValid || generating}
                                    className={cn(
                                        "flex-1 h-12 rounded-2xl bg-accent text-bg-primary text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20",
                                        "hover:shadow-amber-500/30 hover:scale-[1.02] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100",
                                        "flex items-center justify-center gap-2"
                                    )}
                                >
                                    <FileText className="w-4 h-4" />
                                    {generating ? "Génération…" : "Générer contrat"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
