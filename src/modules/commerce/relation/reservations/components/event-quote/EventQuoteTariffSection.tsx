"use client";

import React from "react";
import { Coins } from "lucide-react";

interface EventQuoteTariffSectionProps {
  montantHT: number;
  acompte30: number;
  montantTTC: number;
  onChange: (key: "montantHT", val: number) => void;
  inputClass: string;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-micro font-bold uppercase tracking-wider text-text-secondary">
        {label}
      </label>
      {children}
    </div>
  );
}

export function EventQuoteTariffSection({
  montantHT,
  acompte30,
  montantTTC,
  onChange,
  inputClass,
}: EventQuoteTariffSectionProps) {
  return (
    <section className="space-y-4">
      <p className="text-nano font-black text-text-muted uppercase tracking-[0.3em] border-b border-border pb-2 flex items-center gap-2">
        <Coins className="w-3 h-3 text-accent" /> Tarification &amp; Acompte
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Field label="Montant Total HT (€) *">
          <input
            type="number"
            min={0}
            step={50}
            value={montantHT || ""}
            onChange={(e) => onChange("montantHT", Math.max(0, parseFloat(e.target.value) || 0))}
            placeholder="2500"
            className={inputClass}
          />
        </Field>
        <Field label="Acompte 30 % (€)">
          <div className="h-12 bg-bg-secondary border border-border rounded-2xl px-4 flex items-center justify-between font-mono font-bold text-accent">
            <span>{acompte30.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span>
            <span className="text-nano text-text-muted font-sans font-normal">Exigé</span>
          </div>
        </Field>
        <Field label="Total TTC estimé (TVA 20%)">
          <div className="h-12 bg-bg-secondary border border-border rounded-2xl px-4 flex items-center justify-between font-mono font-bold text-text-primary">
            <span>{montantTTC.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span>
          </div>
        </Field>
      </div>
    </section>
  );
}
