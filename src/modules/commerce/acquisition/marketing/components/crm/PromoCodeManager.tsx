"use client";

import { useState, useEffect, useCallback } from "react";
import { Tag, PlusCircle, Loader2 } from "lucide-react";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { NexusEventBus } from "@/shared/eventBus/NexusEventBus";
import { toast } from "sonner";
import { toMicrounits } from "@/shared/schemas/primitives";
import { useTenant } from "@/shared/hooks/useTenant";

import type { PromoCodeRecord } from './types';
import { SEED_CODES, DEFAULT_FORM } from "./promo-code/promoConstants";
import { PromoCodeForm } from "./promo-code/PromoCodeForm";
import { PromoCodeListItem } from "./promo-code/PromoCodeListItem";

export type { PromoCodeRecord };

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

      await NexusEventBus.emitDurable('commerce.promotion_activated', {
        v: 1,
        tenantId: tenantId ?? 'restaurant-os',
        promotionId: id,
        discountBps: record.discountType === 'percent' ? Math.round(record.value * 100) : 1000,
        productIds: [],
      });

      setCodes((prev) => [record, ...prev]);
      setForm(DEFAULT_FORM);
      setShowForm(false);
      toast.success(`Code ${record.code} créé et activé`);
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

      if (updated.isActive) {
        await NexusEventBus.emitDurable('commerce.promotion_activated', {
          v: 1,
          tenantId: tenantId ?? 'restaurant-os',
          promotionId: promo.id,
          discountBps: promo.discountType === 'percent' ? Math.round(promo.value * 100) : 1000,
          productIds: [],
        });
      }

      setCodes((prev) => prev.map((c) => (c.id === promo.id ? updated : c)));
      toast.success(updated.isActive ? `${promo.code} réactivé` : `${promo.code} désactivé`);
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

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
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-action-primary text-text-primary text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <PlusCircle className="w-4 h-4" />
          Nouveau code
        </button>
      </div>

      {showForm && (
        <PromoCodeForm
          form={form}
          setForm={setForm}
          saving={saving}
          onCancel={() => setShowForm(false)}
          onSubmit={handleCreate}
        />
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
          {codes.map((promo) => (
            <PromoCodeListItem
              key={promo.id}
              promo={promo}
              toggleActive={toggleActive}
            />
          ))}
        </div>
      )}
    </div>
  );
}
