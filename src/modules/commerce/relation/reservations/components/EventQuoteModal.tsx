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
import { logger } from "@/lib/logger";
import { toError } from "@/lib/toError";
import { saveEventQuoteDraft } from '../actions/eventQuote.action';
import { whiteLabelInstanceConfig } from "@/config/instance";
import { useTenant } from "@/kernel/hooks";
import type { PlatformVariant } from "@nexus/contracts";
import { resolveEventFormules } from "@/verticals/_shared/eventFormules";
import { resolveMetricLabels } from "@/verticals/_shared/labels";

import type { PrivatisationFormule, PrivatisationData } from "@/modules/commerce";
import { EventQuoteClientSection } from "./event-quote/EventQuoteClientSection";
import { EventQuoteDetailsSection } from "./event-quote/EventQuoteDetailsSection";
import { EventQuoteTariffSection } from "./event-quote/EventQuoteTariffSection";

interface EventQuoteFormData {
    clientNom: string;
    clientPrenom: string;
    clientEmail: string;
    clientTelephone: string;
    evenementNom: string;
    dateEvenement: string;
    heureDebut: string;
    heureFin: string;
    nombreConvives: number;
    formule: PrivatisationFormule;
    descriptionFormule: string;
    montantHT: number;
}

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
    const { activeTenantConfig } = useTenant();
    const variant = (activeTenantConfig?.variant ?? 'restaurant') as PlatformVariant;
    const formuleOptions = resolveEventFormules(variant);
    const labels = resolveMetricLabels(variant);

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

    const set = useCallback((key: string, val: unknown) => {
        setForm((f) => ({ ...f, [key]: val }));
    }, []);

    const isValid =
        form.clientNom.trim() !== "" &&
        form.clientPrenom.trim() !== "" &&
        form.clientEmail.trim() !== "" &&
        form.evenementNom.trim() !== "" &&
        form.montantHT > 0;

    const handleSaveDraft = async () => {
        if (!isValid) return;
        setSaving(true);
        try {
            const id = savedId || `eq-${Date.now()}`;
            const payload: Record<string, unknown> = {
                id,
                tenantId,
                status: "draft",
                createdAt: new Date().toISOString(),
                ...form,
                acompte30,
                montantTTC,
            };
            
            const result = await saveEventQuoteDraft(tenantId, id, payload);
            if (!result.success) {
                throw new Error(result.error);
            }
            
            setSavedId(id);
            toast.success("Brouillon enregistré avec succès (Optimistic)");
        } catch (err) {
            logger.error("Erreur lors de l'enregistrement du devis", { error: toError(err).message, savedId });
            toast.error("Erreur lors de l'enregistrement du devis");
        } finally {
            setSaving(false);
        }
    };

    const handleGenerateContract = async () => {
        if (!isValid) return;
        setGenerating(true);
        try {
            const { generatePrivatisationContract } = await import(
                "@/modules/finance/comptabilite/documents/PrivatisationContract"
            );

            const contractData: PrivatisationData = {
                clientNom: form.clientNom,
                clientPrenom: form.clientPrenom,
                clientEmail: form.clientEmail,
                clientTelephone: form.clientTelephone || "",
                evenementNom: form.evenementNom,
                dateEvenement: form.dateEvenement,
                heureDebut: form.heureDebut,
                heureFin: form.heureFin,
                nombreConvives: form.nombreConvives,
                formule: form.formule,
                descriptionFormule: form.descriptionFormule || undefined,
                montantHT: form.montantHT,
                restaurantNom: whiteLabelInstanceConfig.appName,
                restaurantAdresse: (activeTenantConfig?.branding as Record<string, string> | undefined)?.['address'] ?? '',
            };

            await generatePrivatisationContract(contractData);
            toast.success("Contrat PDF généré et téléchargé");
        } catch (err) {
            logger.error("Erreur lors de la génération du contrat PDF", { error: toError(err).message, clientEmail: form.clientEmail });
            toast.error("Erreur lors de la génération du contrat PDF");
        } finally {
            setGenerating(false);
        }
    };

    const handleClose = useCallback(() => {
        setForm(INITIAL);
        setSavedId(null);
        onClose();
    }, [onClose]);

    const inputClass =
        "w-full h-11 bg-bg-secondary border border-border rounded-2xl px-4 text-xs font-semibold text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-all";

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
                            <EventQuoteClientSection
                                clientPrenom={form.clientPrenom}
                                clientNom={form.clientNom}
                                clientEmail={form.clientEmail}
                                clientTelephone={form.clientTelephone}
                                onChange={set}
                                inputClass={inputClass}
                            />

                            <EventQuoteDetailsSection
                                evenementNom={form.evenementNom}
                                dateEvenement={form.dateEvenement}
                                heureDebut={form.heureDebut}
                                heureFin={form.heureFin}
                                nombreConvives={form.nombreConvives}
                                formule={form.formule}
                                descriptionFormule={form.descriptionFormule}
                                formuleOptions={formuleOptions}
                                unitLabel={labels.unitPlural}
                                onChange={set}
                                inputClass={inputClass}
                            />

                            <EventQuoteTariffSection
                                montantHT={form.montantHT}
                                acompte30={acompte30}
                                montantTTC={montantTTC}
                                onChange={set}
                                inputClass={inputClass}
                            />
                        </div>

                        <div className="sticky bottom-0 bg-bg-primary/95 backdrop-blur-md px-8 py-5 border-t border-border flex items-center justify-between rounded-b-[2.5rem]">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-5 py-2.5 rounded-2xl bg-bg-tertiary text-text-muted text-xs font-bold hover:text-text-primary transition-colors"
                            >
                                Annuler
                            </button>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleSaveDraft}
                                    disabled={!isValid || saving}
                                    className="px-5 py-2.5 rounded-2xl bg-bg-secondary border border-border text-text-primary text-xs font-bold hover:bg-bg-tertiary disabled:opacity-40 transition-all flex items-center gap-2"
                                >
                                    {saving ? "Enregistrement…" : "Enregistrer brouillon"}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleGenerateContract}
                                    disabled={!isValid || generating}
                                    className="px-6 py-2.5 rounded-2xl bg-accent text-text-on-accent text-xs font-black uppercase tracking-wider hover:opacity-90 disabled:opacity-40 transition-all shadow-lg shadow-accent/20 flex items-center gap-2"
                                >
                                    <FileText className="w-4 h-4" />
                                    {generating ? "Génération PDF…" : "Générer contrat"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
