"use client";

import { Loader2, Gift } from "lucide-react";
import type { DEFAULT_FORM } from "./promoConstants";

interface PromoCodeFormProps {
  form: typeof DEFAULT_FORM;
  setForm: React.Dispatch<React.SetStateAction<typeof DEFAULT_FORM>>;
  saving: boolean;
  onCancel: () => void;
  onSubmit: () => Promise<void>;
}

export function PromoCodeForm({
  form,
  setForm,
  saving,
  onCancel,
  onSubmit,
}: PromoCodeFormProps) {
  return (
    <div className="bg-surface-card border border-border rounded-2xl p-6 space-y-4">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Créer un code promo</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Code</label>
          <input
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            placeholder="EX: SUMMER25"
            className="w-full h-10 px-3 rounded-lg border border-border bg-surface-base text-sm text-text-primary focus:outline-none focus:border-action-primary font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Label</label>
          <input
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder="Description courte"
            className="w-full h-10 px-3 rounded-lg border border-border bg-surface-base text-sm text-text-primary focus:outline-none focus:border-action-primary"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Type de remise</label>
          <select
            value={form.discountType}
            onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as "percent" | "fixed" }))}
            className="w-full h-10 px-3 rounded-lg border border-border bg-surface-base text-sm text-text-primary focus:outline-none focus:border-action-primary"
          >
            <option value="percent">Pourcentage (%)</option>
            <option value="fixed">Montant fixe (€)</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wide">
            Valeur ({form.discountType === "percent" ? "%" : "€"})
          </label>
          <input
            type="number"
            min={1}
            max={form.discountType === "percent" ? 100 : 500}
            value={form.value}
            onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))}
            className="w-full h-10 px-3 rounded-lg border border-border bg-surface-base text-sm text-text-primary focus:outline-none focus:border-action-primary"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Commande min. (€)</label>
          <input
            type="number"
            min={0}
            value={form.minOrder}
            onChange={(e) => setForm((f) => ({ ...f, minOrder: Number(e.target.value) }))}
            className="w-full h-10 px-3 rounded-lg border border-border bg-surface-base text-sm text-text-primary focus:outline-none focus:border-action-primary"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Utilisations max.</label>
          <input
            type="number"
            min={1}
            value={form.maxUses}
            onChange={(e) => setForm((f) => ({ ...f, maxUses: Number(e.target.value) }))}
            className="w-full h-10 px-3 rounded-lg border border-border bg-surface-base text-sm text-text-primary focus:outline-none focus:border-action-primary"
          />
        </div>
        <div className="space-y-1.5 col-span-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Date d'expiration</label>
          <input
            type="date"
            value={form.expiresAt}
            onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
            className="w-full h-10 px-3 rounded-lg border border-border bg-surface-base text-sm text-text-primary focus:outline-none focus:border-action-primary"
          />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 h-10 rounded-lg border border-border text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={onSubmit}
          disabled={saving}
          className="flex-1 h-10 rounded-lg bg-action-primary text-text-primary text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
          Créer le code
        </button>
      </div>
    </div>
  );
}
