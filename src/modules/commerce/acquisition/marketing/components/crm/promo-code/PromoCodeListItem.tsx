"use client";

import { Power, AlertCircle, Percent, Euro } from "lucide-react";
import type { PromoCodeRecord } from '../types';

interface PromoCodeListItemProps {
  promo: PromoCodeRecord;
  toggleActive: (promo: PromoCodeRecord) => Promise<void>;
}

export function PromoCodeListItem({ promo, toggleActive }: PromoCodeListItemProps) {
  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();
  const expired = isExpired(promo.expiresAt);
  const usageRatio = promo.maxUses > 0 ? promo.currentUses / promo.maxUses : 0;

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
        !promo.isActive || expired
          ? "border-border/50 bg-surface-card/30 opacity-60"
          : "border-border bg-surface-card hover:border-action-primary/30"
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
        promo.discountType === "percent" ? "bg-status-info/10" : "bg-status-success/10"
      }`}>
        {promo.discountType === "percent" ? (
          <Percent className="w-5 h-5 text-blue-500" />
        ) : (
          <Euro className="w-5 h-5 text-status-success" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-sm text-text-primary">{promo.code}</span>
          {expired && (
            <span className="text-nano px-2 py-0.5 rounded-full bg-status-danger/10 text-status-danger font-medium">
              Expiré
            </span>
          )}
          {!promo.isActive && !expired && (
            <span className="text-nano px-2 py-0.5 rounded-full bg-gray-500/10 text-text-muted font-medium">
              Inactif
            </span>
          )}
        </div>
        <p className="text-xs text-text-muted mt-0.5">
          {promo.label || promo.code} —{" "}
          <strong>
            {promo.discountType === "percent" ? `${promo.value}%` : `${promo.value}€`}
          </strong>
          {promo.minOrderInMicrounits > 0 && (
            <> · min. {(promo.minOrderInMicrounits / 1_000_000).toFixed(0)}€</>
          )}
        </p>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-action-primary rounded-full transition-all"
              style={{ width: `${Math.min(usageRatio * 100, 100)}%` }}
            />
          </div>
          <span className="text-nano text-text-muted whitespace-nowrap font-mono">
            {promo.currentUses}/{promo.maxUses}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {expired && (
          <AlertCircle className="w-4 h-4 text-status-danger" />
        )}
        <button
          onClick={() => toggleActive(promo)}
          disabled={expired}
          title={promo.isActive ? "Désactiver" : "Réactiver"}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:cursor-not-allowed ${
            promo.isActive
              ? "bg-action-primary/10 text-action-primary hover:bg-action-primary/20"
              : "bg-border/50 text-text-muted hover:bg-border"
          }`}
        >
          <Power className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
