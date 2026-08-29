"use client";

import React, { useState } from "react";
import { Coins, Users, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/ui.foundations";
import { TipDistributionService } from "../services/tipDistribution";
import { toMicrounits } from "@/shared/schemas/primitives";
import { toast } from "sonner";

export function TipPoolManager() {
  const [totalTipsEur, setTotalTipsEur] = useState<number>(130);
  const [rule, setRule] = useState<'hours_worked' | 'equal' | 'rank_weighted'>('hours_worked');
  const [isDistributed, setIsDistributed] = useState(false);

  const staff = [
    { userId: "emp_1", role: "server", hoursWorked: 7.5 },
    { userId: "emp_2", role: "server", hoursWorked: 7.0 },
    { userId: "emp_3", role: "runner", hoursWorked: 6.0 },
  ];

  const totalMicrounits = toMicrounits(totalTipsEur);
  const shares = TipDistributionService.distribute(totalMicrounits, staff, rule);

  const handleCloture = () => {
    setIsDistributed(true);
    toast.success("Pourboires répartis et enregistrés selon la convention HCR");
  };

  return (
    <div className="bg-surface-card border border-border-default rounded-3xl p-6 space-y-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-border-default pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-text-primary">Répartition des Pourboires (Tip Pooling)</h3>
            <p className="text-xs text-text-muted">Calcul déterministe via TipDistributionService sans perte de centime.</p>
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
              { id: "hours_worked" as const, label: "Prorata Heures Travaillées" },
              { id: "equal" as const, label: "Part Égale par Membre Brigade" },
              { id: "rank_weighted" as const, label: "Pondération selon Rang" },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setRule(m.id)} aria-label={`Sélectionner méthode ${m.label}`}
                className={cn(
                  "w-full px-4 py-2.5 rounded-xl text-xs font-bold text-left transition-all",
                  rule === m.id
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
          <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">Parts Calculées</label>
          <div className="space-y-2">
            {shares.map((share, idx) => (
              <div key={share.userId} className="flex items-center justify-between p-3 rounded-xl bg-surface-bg border border-border-default">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-text-muted" />
                  <span className="text-xs font-bold text-text-primary">Employé #{idx + 1} ({share.userId})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-text-muted font-mono">{share.percent.toFixed(1)}%</span>
                  <span className="text-sm font-bold text-text-primary font-mono">
                    {formatCurrency(share.amountInMicrounits / 1_000_000)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3">
            <button
              onClick={handleCloture} aria-label="Valider la répartition des pourboires et générer l'écriture"
              disabled={isDistributed}
              className={cn(
                "w-full py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                isDistributed
                  ? "bg-status-success/20 text-status-success border border-status-success/30 cursor-default"
                  : "bg-action-primary text-text-on-primary hover:opacity-90"
              )}
            >
              {isDistributed ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Pourboires Clôturés & Comptabilisés
                </>
              ) : (
                "Valider la Répartition & Générer l'Écriture"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
