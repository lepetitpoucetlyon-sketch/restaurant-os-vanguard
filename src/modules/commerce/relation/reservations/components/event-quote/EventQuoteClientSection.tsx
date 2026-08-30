"use client";

import React from "react";
import { Input } from "@/shared/components/ui/Input";

interface EventQuoteClientSectionProps {
  clientPrenom: string;
  clientNom: string;
  clientEmail: string;
  clientTelephone: string;
  onChange: <K extends "clientPrenom" | "clientNom" | "clientEmail" | "clientTelephone">(
    key: K,
    val: string
  ) => void;
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

export function EventQuoteClientSection({
  clientPrenom,
  clientNom,
  clientEmail,
  clientTelephone,
  onChange,
  inputClass,
}: EventQuoteClientSectionProps) {
  return (
    <section className="space-y-4">
      <p className="text-nano font-black text-text-muted uppercase tracking-[0.3em] border-b border-border pb-2">
        Informations client
      </p>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Prénom *">
          <Input
            type="text"
            value={clientPrenom}
            onChange={(e) => onChange("clientPrenom", e.target.value)}
            placeholder="Jean"
            className={inputClass}
          />
        </Field>
        <Field label="Nom *">
          <Input
            type="text"
            value={clientNom}
            onChange={(e) => onChange("clientNom", e.target.value)}
            placeholder="Dupont"
            className={inputClass}
          />
        </Field>
        <Field label="Email *">
          <Input
            type="email"
            value={clientEmail}
            onChange={(e) => onChange("clientEmail", e.target.value)}
            placeholder="jean.dupont@example.com"
            className={inputClass}
          />
        </Field>
        <Field label="Téléphone">
          <Input
            type="tel"
            value={clientTelephone}
            onChange={(e) => onChange("clientTelephone", e.target.value)}
            placeholder="+33 6 12 34 56 78"
            className={inputClass}
          />
        </Field>
      </div>
    </section>
  );
}
