"use client";

import React, { useState } from "react";
import { AlertTriangle, Clock, ShieldCheck, Trash2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import type { IPerishableItem, IPerishableAlert } from "../../../domain/schemas/haccp";

const SAMPLE_PERISHABLES: IPerishableItem[] = [
  { id: "per_1", productId: "prod_creme", name: "Crème Fraîche Épaisse 35%", lotNumber: "LOT-CR-8921", receivedAt: "2026-08-20", expiresAt: "2026-08-24", quantityUnits: 6, unitLabel: "L", status: "expiring-soon" },
  { id: "per_2", productId: "prod_saumon", name: "Pavé de Saumon Frais Label Rouge", lotNumber: "LOT-SA-4412", receivedAt: "2026-08-21", expiresAt: "2026-08-25", quantityUnits: 4.5, unitLabel: "kg", status: "expiring-soon" },
  { id: "per_3", productId: "prod_oeufs", name: "Œufs Bio Plein Air", lotNumber: "LOT-OE-1039", receivedAt: "2026-08-15", expiresAt: "2026-08-30", quantityUnits: 120, unitLabel: "pièces", status: "ok" },
  { id: "per_4", productId: "prod_beurre", name: "Beurre AOP Charentes-Poitou", lotNumber: "LOT-BU-7711", receivedAt: "2026-08-10", expiresAt: "2026-08-22", quantityUnits: 2, unitLabel: "kg", status: "expired" },
];

export function PerishableAlertsTracker() {
  const [items, setItems] = useState<IPerishableItem[]>(SAMPLE_PERISHABLES);

  const expiringCount = items.filter((i) => i.status === "expiring-soon").length;
  const expiredCount = items.filter((i) => i.status === "expired").length;

  return (
    <div className="bg-surface-card border border-border-default rounded-3xl p-6 space-y-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-border-default pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-status-danger/10 text-status-danger">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-text-primary">Suivi des DLC Courtes & Denrées Périssables</h3>
            <p className="text-xs text-text-muted">Contrôle sanitaire HACCP, déclassement en cuisine et anti-gaspillage.</p>
          </div>
        </div>

        <div className="flex gap-2">
          {expiringCount > 0 && (
            <span className="px-3 py-1 rounded-full bg-status-warning/10 border border-status-warning/20 text-status-warning text-xs font-bold">
              {expiringCount} à consommer rapidement
            </span>
          )}
          {expiredCount > 0 && (
            <span className="px-3 py-1 rounded-full bg-status-danger/10 border border-status-danger/20 text-status-danger text-xs font-bold">
              {expiredCount} périmé(s)
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-2xl bg-surface-bg border border-border-default space-y-3 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-sm text-text-primary">{item.name}</h4>
                <span className="text-nano font-mono text-text-muted">Lot : {item.lotNumber}</span>
              </div>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-nano font-bold uppercase",
                item.status === 'ok' ? "bg-status-success/10 text-status-success" :
                item.status === 'expiring-soon' ? "bg-status-warning/10 text-status-warning" :
                "bg-status-danger/10 text-status-danger"
              )}>
                {item.status === 'ok' ? 'Conforme' : item.status === 'expiring-soon' ? 'DLC Proche' : 'Périmé'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-border-default">
              <span className="text-text-muted">DLC : <strong className="text-text-primary font-mono">{item.expiresAt}</strong></span>
              <span className="font-bold text-text-primary">{item.quantityUnits} {item.unitLabel}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
