"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import type { StockItem } from '../types';
import type { JsonObject } from "@/shared/types/json";

export interface DLCStatus {
    daysLeft: number | null;
    label: string;
    className: string;
    rank: number;
}

export function computeDLCStatus(dlc: string | undefined): DLCStatus {
    if (!dlc) return { daysLeft: null, label: "—", className: "text-text-muted", rank: 99 };
    const d = new Date(dlc);
    if (isNaN(d.getTime())) return { daysLeft: null, label: "—", className: "text-text-muted", rank: 99 };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    const daysLeft = Math.round((d.getTime() - today.getTime()) / 86_400_000);
    if (daysLeft < 0) return { daysLeft, label: `Périmé (${Math.abs(daysLeft)}j)`, className: "text-red-600 font-semibold", rank: 0 };
    if (daysLeft === 0) return { daysLeft, label: "Aujourd'hui", className: "text-status-danger font-semibold", rank: 1 };
    if (daysLeft <= 3) return { daysLeft, label: `${daysLeft}j`, className: "text-orange-500 font-semibold", rank: 2 };
    if (daysLeft <= 7) return { daysLeft, label: `${daysLeft}j`, className: "text-action-primary", rank: 3 };
    return { daysLeft, label: `${daysLeft}j`, className: "text-text-muted", rank: 4 };
}

function ModalShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-surface-base rounded-2xl border border-border shadow-xl p-5 sm:p-6 w-[calc(100vw-2rem)] sm:w-96 max-w-md" onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
}

export function ThresholdModal({ item, onClose }: { item: StockItem; onClose: () => void }) {
    const [minQty, setMinQty] = useState(String(item.minQuantity ?? ""));
    const [reorderQty, setReorderQty] = useState(String((item as JsonObject).reorderQuantity ?? ""));
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const updates: Record<string, number> = {};
            const parsedMin = parseFloat(minQty);
            const parsedReorder = parseFloat(reorderQty);
            if (!isNaN(parsedMin)) updates.minQuantity = parsedMin;
            if (!isNaN(parsedReorder)) updates.reorderQuantity = parsedReorder;
            if (Object.keys(updates).length === 0) { toast.error("Veuillez saisir au moins une valeur valide."); return; }
            await Nexus.adapter.update(`ingredients/${item.ingredientId}`, updates);
            toast.success("Seuil mis à jour.");
            onClose();
        } catch { toast.error("Erreur lors de la mise à jour du seuil."); }
        finally { setSaving(false); }
    };

    return (
        <ModalShell onClose={onClose}>
            <h3 className="text-base font-semibold mb-4">Seuils — {item.name ?? item.ingredientName}</h3>
            <label className="block text-xs text-text-muted mb-1">Seuil d&apos;alerte ({item.unit})</label>
            <input type="number" min="0" step="any" value={minQty} onChange={(e) => setMinQty(e.target.value)} className="w-full mb-4 px-3 py-2 rounded-md border border-border bg-surface-sidebar text-sm focus:outline-none focus:ring-2 focus:ring-action-primary" placeholder={`ex: 2 ${item.unit}`} />
            <label className="block text-xs text-text-muted mb-1">Quantité de réassort ({item.unit})</label>
            <input type="number" min="0" step="any" value={reorderQty} onChange={(e) => setReorderQty(e.target.value)} className="w-full mb-6 px-3 py-2 rounded-md border border-border bg-surface-sidebar text-sm focus:outline-none focus:ring-2 focus:ring-action-primary" placeholder={`ex: 10 ${item.unit}`} />
            <div className="flex justify-end gap-2">
                <button onClick={onClose} className="px-4 py-2 rounded-md text-sm text-text-muted hover:bg-surface-hover">Annuler</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-md bg-action-primary text-text-primary text-sm font-medium hover:opacity-90 disabled:opacity-50">{saving ? "Enregistrement…" : "Enregistrer"}</button>
            </div>
        </ModalShell>
    );
}

export function PhysicalCountModal({ item, onClose }: { item: StockItem; onClose: () => void }) {
    const [counted, setCounted] = useState(String(item.quantity));
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        const qty = parseFloat(counted);
        if (isNaN(qty) || qty < 0) { toast.error("Quantité invalide."); return; }
        setSaving(true);
        try {
            await Nexus.adapter.update(`stockItems/${item.id}`, { quantity: qty, lastPhysicalCountAt: new Date().toISOString() });
            toast.success("Comptage enregistré.");
            onClose();
        } catch { toast.error("Erreur lors de l'enregistrement du comptage."); }
        finally { setSaving(false); }
    };

    return (
        <ModalShell onClose={onClose}>
            <h3 className="text-base font-semibold mb-1">Comptage physique</h3>
            <p className="text-xs text-text-muted mb-4">{item.name ?? item.ingredientName} — attendu : <strong>{item.quantity} {item.unit}</strong></p>
            <label className="block text-xs text-text-muted mb-1">Quantité comptée ({item.unit})</label>
            <input type="number" min="0" step="any" value={counted} onChange={(e) => setCounted(e.target.value)} className="w-full mb-6 px-3 py-2 rounded-md border border-border bg-surface-sidebar text-sm focus:outline-none focus:ring-2 focus:ring-action-primary" />
            <div className="flex justify-end gap-2">
                <button onClick={onClose} className="px-4 py-2 rounded-md text-sm text-text-muted hover:bg-surface-hover">Annuler</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-md bg-action-primary text-text-primary text-sm font-medium hover:opacity-90 disabled:opacity-50">{saving ? "Enregistrement…" : "Valider"}</button>
            </div>
        </ModalShell>
    );
}

export function AdjustStockModal({ item, onClose }: { item: StockItem; onClose: () => void }) {
    const [delta, setDelta] = useState("0");
    const [reason, setReason] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        const d = parseFloat(delta);
        if (isNaN(d)) { toast.error("Valeur invalide."); return; }
        setSaving(true);
        try {
            await Nexus.adapter.update(`stockItems/${item.id}`, { quantity: Math.max(0, item.quantity + d), lastAdjustmentAt: new Date().toISOString(), lastAdjustmentReason: reason || "Ajustement manuel" });
            toast.success(d >= 0 ? `+${d} ${item.unit} ajouté(s) au stock.` : `${Math.abs(d)} ${item.unit} retiré(s) du stock.`);
            onClose();
        } catch { toast.error("Erreur lors de l'ajustement."); }
        finally { setSaving(false); }
    };

    return (
        <ModalShell onClose={onClose}>
            <h3 className="text-base font-semibold mb-1">Ajustement manuel</h3>
            <p className="text-xs text-text-muted mb-4">{item.name ?? item.ingredientName} — stock actuel : <strong>{item.quantity} {item.unit}</strong></p>
            <label className="block text-xs text-text-muted mb-1">Delta ({item.unit}) — négatif pour retirer</label>
            <input type="number" step="any" value={delta} onChange={(e) => setDelta(e.target.value)} className="w-full mb-4 px-3 py-2 rounded-md border border-border bg-surface-sidebar text-sm focus:outline-none focus:ring-2 focus:ring-action-primary" />
            <label className="block text-xs text-text-muted mb-1">Motif (optionnel)</label>
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full mb-6 px-3 py-2 rounded-md border border-border bg-surface-sidebar text-sm focus:outline-none focus:ring-2 focus:ring-action-primary" placeholder="Perte, correction inventaire…" />
            <div className="flex justify-end gap-2">
                <button onClick={onClose} className="px-4 py-2 rounded-md text-sm text-text-muted hover:bg-surface-hover">Annuler</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-md bg-action-primary text-text-primary text-sm font-medium hover:opacity-90 disabled:opacity-50">{saving ? "Enregistrement…" : "Appliquer"}</button>
            </div>
        </ModalShell>
    );
}
