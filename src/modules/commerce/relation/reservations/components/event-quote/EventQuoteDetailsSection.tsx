"use client";

import React from "react";
import { Calendar, Users } from "lucide-react";
import type { PrivatisationFormule } from "@/domain/schemas/commerce";

interface EventQuoteDetailsSectionProps {
  evenementNom: string;
  dateEvenement: string;
  heureDebut: string;
  heureFin: string;
  nombreConvives: number;
  formule: PrivatisationFormule;
  descriptionFormule: string;
  formuleOptions: { value: PrivatisationFormule; label: string; desc: string }[];
  onChange: (key: string, val: unknown) => void;
  inputClass: string;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
        {label}
      </label>
      {children}
    </div>
  );
}

export function EventQuoteDetailsSection({
  evenementNom,
  dateEvenement,
  heureDebut,
  heureFin,
  nombreConvives,
  formule,
  descriptionFormule,
  formuleOptions,
  onChange,
  inputClass,
}: EventQuoteDetailsSectionProps) {
  return (
    <section className="space-y-4">
      <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] border-b border-border pb-2 flex items-center gap-2">
        <Calendar className="w-3 h-3" /> Détails de l&apos;événement
      </p>
      <Field label="Nom de l'événement *">
        <input
          type="text"
          value={evenementNom}
          onChange={(e) => onChange("evenementNom", e.target.value)}
          placeholder="Soirée anniversaire Dupont, Séminaire Acme 2026…"
          className={inputClass}
        />
      </Field>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Date *">
          <input
            type="date"
            value={dateEvenement}
            onChange={(e) => onChange("dateEvenement", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Heure début">
          <input
            type="time"
            value={heureDebut}
            onChange={(e) => onChange("heureDebut", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Heure fin">
          <input
            type="time"
            value={heureFin}
            onChange={(e) => onChange("heureFin", e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nb couverts estimés *">
          <div className="flex items-center justify-between bg-bg-secondary border border-border rounded-2xl p-2 gap-2">
            <button
              type="button"
              onClick={() => onChange("nombreConvives", Math.max(1, nombreConvives - 5))}
              className="w-9 h-9 rounded-xl bg-bg-tertiary flex items-center justify-center text-text-primary font-black hover:bg-bg-primary transition-all"
            >
              −
            </button>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" />
              <span className="text-xl font-mono font-light text-text-primary">{nombreConvives}</span>
            </div>
            <button
              type="button"
              onClick={() => onChange("nombreConvives", nombreConvives + 5)}
              className="w-9 h-9 rounded-xl bg-bg-tertiary flex items-center justify-center text-text-primary font-black hover:bg-bg-primary transition-all"
            >
              +
            </button>
          </div>
        </Field>
        <Field label="Formule de restauration">
          <div className="grid grid-cols-1 gap-2">
            {formuleOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange("formule", opt.value)}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                  formule === opt.value
                    ? "bg-accent/10 border-accent text-text-primary shadow-sm"
                    : "bg-bg-secondary border-border text-text-secondary hover:border-text-muted"
                }`}
              >
                <div>
                  <p className="text-xs font-bold">{opt.label}</p>
                  <p className="text-[10px] text-text-muted">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </Field>
      </div>
      <Field label="Description personnalisée de la formule">
        <textarea
          value={descriptionFormule}
          onChange={(e) => onChange("descriptionFormule", e.target.value)}
          placeholder="ex: Pièces cocktail salées & sucrées, 2 verres de vin inclus par convive…"
          rows={2}
          className={`${inputClass} resize-none`}
        />
      </Field>
    </section>
  );
}
