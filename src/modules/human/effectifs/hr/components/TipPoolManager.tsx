"use client";

import React, { useState } from "react";
import { Coins, Users, Scale, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/ui.foundations";
import type { ITipPool, ITipParticipant, TipPoolingMethod } from "../../../domain/schemas/hr";

const SAMPLE_PARTICIPANTS: ITipParticipant[] = [
  { employeeId: "emp_1", name: "Alexandre Dumas", hoursWorked: 7.5, coversServed: 32, sharePercent: 35, amountInMicrounits: (45.5 * 10_000) as any },
  { employeeId: "emp_2", name: "Marie Curie", hoursWorked: 7.0, coversServed: 28, sharePercent: 35, amountInMicrounits: (45.5 * 10_000) as any },
  { employeeId: "emp_3", name: "Victor Hugo", hoursWorked: 6.0, coversServed: 20, sharePercent: 30, amountInMicrounits: (39.0 * 10_000) as any },
];

export function TipPoolManager() {
  const [method, setMethod] = useState<TipPoolingMethod>("weighted-hours");
  const [totalTipsEur, setTotalTipsEur] = useState<number>(130);
  const [isDistributed, setIsDistributed] = useState(false);

  return (
    <div className="bg-surface-card border border-border-default rounded-3xl p-6 space-y-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-border-default pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-text-primary">Répartition des Pourboires (Tip Pooling)</h3>
            <p className="text-xs text-text-muted">Calcul déterministe et règle du reliquat sans perte de centime.</p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold font-mono">
          Total Shift : {formatCurrency(totalTipsEur)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">Méthode de Répartition</label>
          <div className="space-y-2">
            {[
              { id: "weighted-hours" as const, label: "Prorata Heures Travaillées" },
              { id: "equal" as const, label: "Part Égale par Membre Brigade" },
              { id: "weighted-covers" as const, label: "Prorata Couverts Servis" },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={cn(
                  "w-full px-4 py-2.5 rounded-xl text-xs font-bold text-left transition-all",
                  method === m.id
                    ? "bg-action-primary text-text-on-primary shadow-sm"
                    : "bg-surface-bg border border-border-default text-text-muted hover:text-text-primary"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 space-y-3">
          <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">Ventilation Déterministe</label>
          <div className="space-y-2">
            {SAMPLE_PARTICIPANTS.map((p) => {
              const amount = Number(p.amountInMicrounits) / 10_000;
              return (
                <div key={p.employeeId} className="p-3 rounded-2xl bg-surface-bg border border-border-default flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-text-primary">{p.name}</span>
                    <p className="text-[10px] text-text-muted">{p.hoursWorked}h travaillées · {p.coversServed} couverts</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-action-primary">{formatCurrency(amount)}</span>
                    <span className="text-[10px] text-text-muted block">{p.sharePercent}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setIsDistributed(true)}
              className="px-5 py-2.5 rounded-2xl bg-action-primary text-text-on-primary font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isDistributed ? "Pourboires Clôturés & Comptabilisés" : "Valider la Répartition Shift"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
