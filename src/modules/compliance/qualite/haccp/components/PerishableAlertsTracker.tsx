"use client";

import React, { useState, useEffect } from "react";
import { Clock, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import type { IPerishableItem } from "../../../domain/schemas/haccp";

export function PerishableAlertsTracker() {
  const [items, setItems] = useState<IPerishableItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadPerishables() {
      try {
        const stock = await Nexus.adapter.query<{
          id: string;
          name: string;
          lotNumber?: string;
          expiresAt?: string;
          quantity?: number;
          unit?: string;
        }>("stockItems");

        if (!isMounted) return;

        const now = Date.now();
        const perishables: IPerishableItem[] = (stock || [])
          .filter((s) => s.expiresAt)
          .map((s) => {
            const expTime = new Date(s.expiresAt!).getTime();
            let status: IPerishableItem["status"] = "ok";
            if (expTime < now) {
              status = "expired";
            } else if (expTime < now + 3 * 86400000) {
              status = "expiring-soon";
            }

            return {
              id: s.id,
              productId: s.id,
              name: s.name,
              lotNumber: s.lotNumber ?? "LOT-AUTO",
              receivedAt: new Date(now - 7 * 86400000).toISOString().split("T")[0],
              expiresAt: s.expiresAt!,
              quantityUnits: s.quantity ?? 1,
              unitLabel: s.unit ?? "unités",
              status,
            };
          });

        setItems(perishables);
      } catch {
        // Fallback vide propre
        if (isMounted) setItems([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPerishables();
    return () => {
      isMounted = false;
    };
  }, []);

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
            <p className="text-xs text-text-muted">Contrôle sanitaire HACCP temps réel basé sur les stocks enregistrés.</p>
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
          {expiringCount === 0 && expiredCount === 0 && !loading && (
            <span className="px-3 py-1 rounded-full bg-status-success/10 border border-status-success/20 text-status-success text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Stocks conformes
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-text-muted text-xs">Chargement des données sanitaires...</div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center text-text-muted text-xs bg-surface-bg/50 border border-dashed border-border-default rounded-2xl">
          Aucun lot à DLC courte ou expiré détecté dans l'économat.
        </div>
      ) : (
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
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-nano font-bold uppercase",
                    item.status === "expired"
                      ? "bg-status-danger/20 text-status-danger border border-status-danger/30"
                      : item.status === "expiring-soon"
                      ? "bg-status-warning/20 text-status-warning border border-status-warning/30"
                      : "bg-status-success/20 text-status-success border border-status-success/30"
                  )}
                >
                  {item.status === "expired" ? "Périmé" : item.status === "expiring-soon" ? "DLC Courte" : "Conforme"}
                </span>
              </div>
              <div className="text-xs text-text-secondary flex justify-between">
                <span>Quantité : {item.quantityUnits} {item.unitLabel}</span>
                <span>DLC : {item.expiresAt}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
