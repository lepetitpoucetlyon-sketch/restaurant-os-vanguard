"use client";

import { useState, useEffect, useCallback } from "react";
import { Tag, PlusCircle, Power, AlertCircle, Loader2, Gift, Percent, Euro } from "lucide-react";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { toast } from "sonner";
import { toMicrounits } from "@/domain/schemas/primitives";
import { useTenant } from "@/shared/hooks";

export interface PromoCodeRecord {
  id: string;
  code: string;
  discountType: "percent" | "fixed";
  value: number;
  label?: string;
  minOrderInMicrounits: number;
  maxUses: number;
  currentUses: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const SEED_CODES: Omit<PromoCodeRecord, "id" | "createdAt" | "updatedAt">[] = [
  {
    code: "BIENVENUE10",
    discountType: "percent",
    value: 10,
    label: "Bienvenue",
    minOrderInMicrounits: toMicrounits(0),
    maxUses: 1000,
    currentUses: 0,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
  },
  {
    code: "NEXUS20",
    discountType: "percent",
    value: 20,
    label: "Offre Nexus",
    minOrderInMicrounits: toMicrounits(20),
    maxUses: 500,
    currentUses: 0,
    expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
  },
  {
    code: "FREE3",
    discountType: "fixed",
    value: 3,
    label: "Remise 3€",
    minOrderInMicrounits: toMicrounits(15),
    maxUses: 200,
    currentUses: 0,
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
  },
];

const DEFAULT_FORM = {
  code: "",
  discountType: "percent" as "percent" | "fixed",
  value: 10,
  label: "",
  minOrder: 0,
  maxUses: 100,
  expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
};

export function PromoCodeManager() {
  const { tenantId } = useTenant();
  const getPath = useCallback((id?: string) => {
    const coll = tenantId ? `tenants/${tenantId}/promoCodes` : "promoCodes";
    return id ? `${coll}/${id}` : coll;
  }, [tenantId]);

  const [codes, setCodes] = useState<PromoCodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const loadCodes = useCallback(async () => {
    setLoading(true);
    try {
      const collPath = getPath();
      const data = await Nexus.adapter.query<PromoCodeRecord>(collPath);
      if (data.length === 0) {
        // Seed default codes if none exist
        const now = new Date().toISOString();
        for (const seed of SEED_CODES) {
          const id = Nexus.adapter.generateId(collPath);
          const record: PromoCodeRecord = { ...seed, id, createdAt: now, updatedAt: now };
          await Nexus.adapter.set(getPath(id), record);
        }
        const seeded = await Nexus.adapter.query<PromoCodeRecord>(collPath);
        setCodes(seeded);
      } else {
        setCodes(data);
      }
    } catch {
      toast.error("Impossible de charger les codes promo");
    } finally {
      setLoading(false);
    }
  }, [getPath]);

  useEffect(() => {
    loadCodes();
  }, [loadCodes]);

  const handleCreate = async () => {
    if (!form.code.trim()) {
      toast.error("Le code est obligatoire");
      return;
    }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const collPath = getPath();
      const id = Nexus.adapter.generateId(collPath);
      const record: PromoCodeRecord = {
        id,
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        value: Number(form.value),
        label: form.label || form.code.trim().toUpperCase(),
        minOrderInMicrounits: toMicrounits(Number(form.minOrder)),
        maxUses: Number(form.maxUses),
        currentUses: 0,
        expiresAt: new Date(form.expiresAt).toISOString(),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      await Nexus.adapter.set(getPath(id), record);
      setCodes((prev) => [record, ...prev]);
      setForm(DEFAULT_FORM);
      setShowForm(false);
      toast.success(`Code ${record.code} créé`);
    } catch {
      toast.error("Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (promo: PromoCodeRecord) => {
    try {
      const updated = { ...promo, isActive: !promo.isActive, updatedAt: new Date().toISOString() };
      await Nexus.adapter.update(getPath(promo.id), { isActive: updated.isActive, updatedAt: updated.updatedAt });
      setCodes((prev) => prev.map((c) => (c.id === promo.id ? updated : c)));
      toast.success(updated.isActive ? `${promo.code} réactivé` : `${promo.code} désactivé`);
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-action-primary/10 flex items-center justify-center">
            <Tag className="w-5 h-5 text-action-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Codes Promo</h2>
            <p className="text-xs text-text-muted">{codes.length} code{codes.length !== 1 ? "s" : ""} enregistré{codes.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-action-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <PlusCircle className="w-4 h-4" />
          Nouveau code
        </button>
      </div>

      {showForm && (
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
              onClick={() => setShowForm(false)}
              className="flex-1 h-10 rounded-lg border border-border text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex-1 h-10 rounded-lg bg-action-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
              Créer le code
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
        </div>
      ) : codes.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun code promo</p>
        </div>
      ) : (
        <div className="space-y-3">
          {codes.map((promo) => {
            const expired = isExpired(promo.expiresAt);
            const usageRatio = promo.maxUses > 0 ? promo.currentUses / promo.maxUses : 0;
            return (
              <div
                key={promo.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  !promo.isActive || expired
                    ? "border-border/50 bg-surface-card/30 opacity-60"
                    : "border-border bg-surface-card hover:border-action-primary/30"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  promo.discountType === "percent" ? "bg-blue-500/10" : "bg-green-500/10"
                }`}>
                  {promo.discountType === "percent" ? (
                    <Percent className="w-5 h-5 text-blue-500" />
                  ) : (
                    <Euro className="w-5 h-5 text-green-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-text-primary">{promo.code}</span>
                    {expired && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-medium">
                        Expiré
                      </span>
                    )}
                    {!promo.isActive && !expired && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-500 font-medium">
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
                    <span className="text-[10px] text-text-muted whitespace-nowrap font-mono">
                      {promo.currentUses}/{promo.maxUses}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {expired && (
                    <AlertCircle className="w-4 h-4 text-red-400" />
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
          })}
        </div>
      )}
    </div>
  );
}
