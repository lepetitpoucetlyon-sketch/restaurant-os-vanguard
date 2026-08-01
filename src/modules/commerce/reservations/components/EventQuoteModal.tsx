"use client";

/**
 * EventQuoteModal — res-8
 * Devis privatisation / événement.
 * - Formulaire: client, date, couverts, formule, montant HT, acompte 30 %
 * - Persiste en Nexus: tenants/{tenantId}/eventQuotes/{id}  status: 'draft'
 * - Bouton "Générer contrat" → generatePrivatisationContract (jsPDF, client-side)
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { X, FileText, Sparkles, Calendar, Users, Coins, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/ui.foundations";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { whiteLabelInstanceConfig } from "@/config/instance";

        // FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
        // eslint-disable-next-line vanguard/no-inter-module-imports
import type { PrivatisationFormule, PrivatisationData } from "@/modules/finance/documents";

// ── Constants ─────────────────────────────────────────────────────────────────

const FORMULE_OPTIONS: { value: PrivatisationFormule; label: string; desc: string }[] = [
    { value: "menu", label: "Menu assis", desc: "Service à la table, menu servi" },
    { value: "cocktail_dinatoire", label: "Cocktail dînatoire", desc: "Buffet debout, service circulant" },
    { value: "buffet", label: "Buffet libre", desc: "Self-service, convives libres" },
];

interface EventQuoteFormData {
    // Client
    clientNom: string;
    clientPrenom: string;
    clientEmail: string;
    clientTelephone: string;

    // Événement
    evenementNom: string;
    dateEvenement: string;
    heureDebut: string;
    heureFin: string;
    nombreConvives: number;
    formule: PrivatisationFormule;
    descriptionFormule: string;

    // Tarification
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

// ── Props ─────────────────────────────────────────────────────────────────────

interface EventQuoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    tenantId: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EventQuoteModal({ isOpen, onClose, tenantId }: EventQuoteModalProps) {
    const [form, setForm] = useState<EventQuoteFormData>(INITIAL);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [savedId, setSavedId] = useState<string | null>(null);

    // Reset when modal opens
    useEffect(() => {
        if (!isOpen) {
            setForm(INITIAL);
            setSavedId(null);
        }
    }, [isOpen]);

    // Derived: acompte 30 %
    const acompte30 = useMemo(() => form.montantHT * 0.3, [form.montantHT]);
    const montantTTC = useMemo(() => form.montantHT * 1.2, [form.montantHT]);

    // ── Helpers ───────────────────────────────────────────────────────────────

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

    // ── Save draft ────────────────────────────────────────────────────────────

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

    // ── Generate PDF contract ─────────────────────────────────────────────────

    const handleGenerateContract = useCallback(async () => {
        if (!isValid) {
            toast.error("Veuillez remplir tous les champs obligatoires");
            return;
        }

        setGenerating(true);
        try {
            // Ensure there is a saved record
            let quoteId = savedId;
            if (!quoteId) {
                quoteId = await handleSaveDraft();
                if (!quoteId) {
                    setGenerating(false);
                    return;
                }
            }

            // Lazy-load jsPDF-dependent generator (client-only)
        // FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
        // eslint-disable-next-line vanguard/no-inter-module-imports
            const { generatePrivatisationContract } = await import("@/modules/finance/documents");

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

    // ── Render ────────────────────────────────────────────────────────────────

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
                        {/* Header */}
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
                            {/* ── Section: Client ─────────────────────────────── */}
                            <section className="space-y-4">
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] border-b border-border pb-2">
                                    Informations client
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Prénom *">
                                        <input
                                            type="text"
                                            value={form.clientPrenom}
                                            onChange={(e) => set("clientPrenom", e.target.value)}
                                            placeholder="Jean"
                                            className={inputClass}
                                        />
                                    </Field>
                                    <Field label="Nom *">
                                        <input
                                            type="text"
                                            value={form.clientNom}
                                            onChange={(e) => set("clientNom", e.target.value)}
                                            placeholder="Dupont"
                                            className={inputClass}
                                        />
                                    </Field>
                                    <Field label="Email *">
                                        <input
                                            type="email"
                                            value={form.clientEmail}
                                            onChange={(e) => set("clientEmail", e.target.value)}
                                            placeholder="jean.dupont@example.com"
                                            className={inputClass}
                                        />
                                    </Field>
                                    <Field label="Téléphone">
                                        <input
                                            type="tel"
                                            value={form.clientTelephone}
                                            onChange={(e) => set("clientTelephone", e.target.value)}
                                            placeholder="+33 6 12 34 56 78"
                                            className={inputClass}
                                        />
                                    </Field>
                                </div>
                            </section>

                            {/* ── Section: Événement ──────────────────────────── */}
                            <section className="space-y-4">
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] border-b border-border pb-2 flex items-center gap-2">
                                    <Calendar className="w-3 h-3" /> Détails de l'événement
                                </p>
                                <Field label="Nom de l'événement *">
                                    <input
                                        type="text"
                                        value={form.evenementNom}
                                        onChange={(e) => set("evenementNom", e.target.value)}
                                        placeholder="Soirée anniversaire Dupont, Séminaire Acme 2026…"
                                        className={inputClass}
                                    />
                                </Field>
                                <div className="grid grid-cols-3 gap-4">
                                    <Field label="Date *">
                                        <input
                                            type="date"
                                            value={form.dateEvenement}
                                            onChange={(e) => set("dateEvenement", e.target.value)}
                                            className={inputClass}
                                        />
                                    </Field>
                                    <Field label="Heure début">
                                        <input
                                            type="time"
                                            value={form.heureDebut}
                                            onChange={(e) => set("heureDebut", e.target.value)}
                                            className={inputClass}
                                        />
                                    </Field>
                                    <Field label="Heure fin">
                                        <input
                                            type="time"
                                            value={form.heureFin}
                                            onChange={(e) => set("heureFin", e.target.value)}
                                            className={inputClass}
                                        />
                                    </Field>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Nb couverts estimés *">
                                        <div className="flex items-center justify-between bg-bg-secondary border border-border rounded-2xl p-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => set("nombreConvives", Math.max(1, form.nombreConvives - 5))}
                                                className="w-9 h-9 rounded-xl bg-bg-tertiary flex items-center justify-center text-text-primary font-black hover:bg-bg-primary transition-all"
                                            >
                                                −
                                            </button>
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-accent" />
                                                <span className="text-xl font-mono font-light text-text-primary">{form.nombreConvives}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => set("nombreConvives", form.nombreConvives + 5)}
                                                className="w-9 h-9 rounded-xl bg-bg-tertiary flex items-center justify-center text-text-primary font-black hover:bg-bg-primary transition-all"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </Field>

                                    <Field label="Formule *">
                                        <div className="relative">
                                            <select
                                                value={form.formule}
                                                onChange={(e) => set("formule", e.target.value as PrivatisationFormule)}
                                                className={cn(inputClass, "appearance-none pr-10 cursor-pointer")}
                                            >
                                                {FORMULE_OPTIONS.map((o) => (
                                                    <option key={o.value} value={o.value}>{o.label}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                                        </div>
                                        <p className="text-[9px] text-text-muted mt-1 pl-1">
                                            {FORMULE_OPTIONS.find((o) => o.value === form.formule)?.desc}
                                        </p>
                                    </Field>
                                </div>

                                <Field label="Précisions sur la formule / menu">
                                    <textarea
                                        value={form.descriptionFormule}
                                        onChange={(e) => set("descriptionFormule", e.target.value)}
                                        rows={2}
                                        placeholder="Restrictions alimentaires, thème, demandes spéciales…"
                                        className={cn(inputClass, "resize-none")}
                                    />
                                </Field>
                            </section>

                            {/* ── Section: Tarification ────────────────────────── */}
                            <section className="space-y-4">
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] border-b border-border pb-2 flex items-center gap-2">
                                    <Coins className="w-3 h-3" /> Tarification
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Montant HT estimé (€) *">
                                        <input
                                            type="number"
                                            min={0}
                                            step={100}
                                            value={form.montantHT || ""}
                                            onChange={(e) => set("montantHT", Math.max(0, Number(e.target.value)))}
                                            placeholder="5000"
                                            className={inputClass}
                                        />
                                    </Field>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Récapitulatif</p>
                                        <div className="bg-bg-secondary border border-border rounded-2xl px-5 py-3 space-y-2">
                                            <Row label="Montant HT" value={fmt(form.montantHT)} />
                                            <Row label="TVA 20 %" value={fmt(form.montantHT * 0.2)} muted />
                                            <Row label="Montant TTC" value={fmt(montantTTC)} accent />
                                            <div className="border-t border-border pt-2 mt-2">
                                                <Row label="Acompte 30 % (à la commande)" value={fmt(acompte30)} accent />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* ── Actions ──────────────────────────────────────── */}
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

// ── Sub-components ────────────────────────────────────────────────────────────

const inputClass =
    "w-full bg-bg-secondary border border-border rounded-2xl px-5 py-3 text-sm text-text-primary focus:outline-none focus:border-accent/50 transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">{label}</label>
            {children}
        </div>
    );
}

function Row({
    label,
    value,
    muted = false,
    accent = false,
}: {
    label: string;
    value: string;
    muted?: boolean;
    accent?: boolean;
}) {
    return (
        <div className="flex items-center justify-between">
            <span className={cn("text-[10px] uppercase tracking-wider", muted ? "text-text-muted/60" : "text-text-muted")}>
                {label}
            </span>
            <span className={cn("text-[11px] font-black", accent ? "text-accent" : "text-text-primary")}>
                {value}
            </span>
        </div>
    );
}

function fmt(amount: number): string {
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
