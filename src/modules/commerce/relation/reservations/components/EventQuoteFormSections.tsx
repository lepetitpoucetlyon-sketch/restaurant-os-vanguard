import React from "react";
import { Calendar, Users, Coins, ChevronDown } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import type { EventQuoteFormData } from "./EventQuoteTypes";
import type { PrivatisationFormule } from "../../../domain/schemas/commerce";

const inputClass =
    "w-full bg-bg-secondary border border-border rounded-2xl px-5 py-3 text-sm text-text-primary focus:outline-none focus:border-accent/50 transition-all";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">{label}</label>
            {children}
        </div>
    );
}

export function Row({
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

export function fmt(amount: number): string {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
}

const FORMULE_OPTIONS: { value: PrivatisationFormule; label: string; desc: string }[] = [
    { value: "menu", label: "Menu assis", desc: "Service à la table, menu servi" },
    { value: "cocktail_dinatoire", label: "Cocktail dînatoire", desc: "Buffet debout, service circulant" },
    { value: "buffet", label: "Buffet libre", desc: "Self-service, convives libres" },
];

export function EventQuoteClientSection({ form, set }: { form: EventQuoteFormData, set: <K extends keyof EventQuoteFormData>(key: K, val: EventQuoteFormData[K]) => void }) {
    return (
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
    );
}

export function EventQuoteEventSection({ form, set }: { form: EventQuoteFormData, set: <K extends keyof EventQuoteFormData>(key: K, val: EventQuoteFormData[K]) => void }) {
    return (
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
    );
}

export function EventQuoteFinancialSection({ form, set, acompte30, montantTTC }: { form: EventQuoteFormData, set: <K extends keyof EventQuoteFormData>(key: K, val: EventQuoteFormData[K]) => void, acompte30: number, montantTTC: number }) {
    return (
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
    );
}
