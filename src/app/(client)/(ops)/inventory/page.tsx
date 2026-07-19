"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
    Package,
    Warehouse,
    PlusCircle,
    ArrowLeftRight,
    ChefHat,
    AlertTriangle,
    Pencil,
    Trash2,
    ClipboardCheck,
    SlidersHorizontal,
    RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

import { useInventory } from "@modules/logistics/inventory";
import type { StockItem } from "@modules/logistics/inventory/types";
import {
    StockReceptionModal,
    StockTransferModal,
    CreatePreparationModal,
} from "@modules/logistics/inventory/components";
import { useActionPermission } from "@/hooks/useActionPermission";
import { SecurityPinModal } from "@/components/ui";
import { RotatingCount } from "@/components/inventory/RotatingCount";
import { Nexus } from "@/lib/nexus/NexusAdapter";

type InvTab = "stock" | "storage" | "rotating_count";

// ── Inline modals ─────────────────────────────────────────────────────────────

/** Small overlay for editing threshold (minQuantity) + reorder qty (log-2 / log-3) */
function ThresholdModal({
    item,
    onClose,
}: {
    item: StockItem;
    onClose: () => void;
}) {
    const [minQty, setMinQty] = useState(String(item.minQuantity ?? ""));
    const [reorderQty, setReorderQty] = useState(
        String((item as Record<string, unknown>).reorderQuantity ?? "")
    );
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const updates: Record<string, number> = {};
            const parsedMin = parseFloat(minQty);
            const parsedReorder = parseFloat(reorderQty);

            if (!isNaN(parsedMin)) updates.minQuantity = parsedMin;
            if (!isNaN(parsedReorder)) updates.reorderQuantity = parsedReorder;

            if (Object.keys(updates).length === 0) {
                toast.error("Veuillez saisir au moins une valeur valide.");
                return;
            }

            // Update ingredient record (SovereignGuard adds tenant prefix)
            await Nexus.adapter.update(`ingredients/${item.ingredientId}`, updates);
            toast.success("Seuil mis à jour.");
            onClose();
        } catch {
            toast.error("Erreur lors de la mise à jour du seuil.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={onClose}
        >
            <div
                className="bg-surface-base rounded-xl border border-border shadow-xl p-6 w-80"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-base font-semibold mb-4">
                    Seuils — {item.name ?? item.ingredientName}
                </h3>

                <label className="block text-xs text-text-muted mb-1">
                    Seuil d&apos;alerte ({item.unit})
                </label>
                <input
                    type="number"
                    min="0"
                    step="any"
                    value={minQty}
                    onChange={(e) => setMinQty(e.target.value)}
                    className="w-full mb-4 px-3 py-2 rounded-md border border-border bg-surface-sidebar text-sm focus:outline-none focus:ring-2 focus:ring-action-primary"
                    placeholder={`ex: 2 ${item.unit}`}
                />

                <label className="block text-xs text-text-muted mb-1">
                    Quantité de réassort ({item.unit})
                </label>
                <input
                    type="number"
                    min="0"
                    step="any"
                    value={reorderQty}
                    onChange={(e) => setReorderQty(e.target.value)}
                    className="w-full mb-6 px-3 py-2 rounded-md border border-border bg-surface-sidebar text-sm focus:outline-none focus:ring-2 focus:ring-action-primary"
                    placeholder={`ex: 10 ${item.unit}`}
                />

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md text-sm text-text-muted hover:bg-surface-hover"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 rounded-md bg-action-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                    >
                        {saving ? "Enregistrement…" : "Enregistrer"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/** Small overlay for physical count entry (rbac-4 / log-2 context) */
function PhysicalCountModal({
    item,
    onClose,
}: {
    item: StockItem;
    onClose: () => void;
}) {
    const [counted, setCounted] = useState(String(item.quantity));
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        const qty = parseFloat(counted);
        if (isNaN(qty) || qty < 0) {
            toast.error("Quantité invalide.");
            return;
        }
        setSaving(true);
        try {
            await Nexus.adapter.update(`stockItems/${item.id}`, {
                quantity: qty,
                lastPhysicalCountAt: new Date().toISOString(),
            });
            toast.success("Comptage enregistré.");
            onClose();
        } catch {
            toast.error("Erreur lors de l'enregistrement du comptage.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={onClose}
        >
            <div
                className="bg-surface-base rounded-xl border border-border shadow-xl p-6 w-80"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-base font-semibold mb-1">Comptage physique</h3>
                <p className="text-xs text-text-muted mb-4">
                    {item.name ?? item.ingredientName} — attendu :{" "}
                    <strong>{item.quantity} {item.unit}</strong>
                </p>

                <label className="block text-xs text-text-muted mb-1">
                    Quantité comptée ({item.unit})
                </label>
                <input
                    type="number"
                    min="0"
                    step="any"
                    value={counted}
                    onChange={(e) => setCounted(e.target.value)}
                    className="w-full mb-6 px-3 py-2 rounded-md border border-border bg-surface-sidebar text-sm focus:outline-none focus:ring-2 focus:ring-action-primary"
                />

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md text-sm text-text-muted hover:bg-surface-hover"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 rounded-md bg-action-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                    >
                        {saving ? "Enregistrement…" : "Valider"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/** Small overlay for manual stock adjustment (rbac-4) */
function AdjustStockModal({
    item,
    onClose,
}: {
    item: StockItem;
    onClose: () => void;
}) {
    const [delta, setDelta] = useState("0");
    const [reason, setReason] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        const d = parseFloat(delta);
        if (isNaN(d)) {
            toast.error("Valeur invalide.");
            return;
        }
        setSaving(true);
        try {
            const newQty = Math.max(0, item.quantity + d);
            await Nexus.adapter.update(`stockItems/${item.id}`, {
                quantity: newQty,
                lastAdjustmentAt: new Date().toISOString(),
                lastAdjustmentReason: reason || "Ajustement manuel",
            });
            toast.success(
                d >= 0
                    ? `+${d} ${item.unit} ajouté(s) au stock.`
                    : `${Math.abs(d)} ${item.unit} retiré(s) du stock.`
            );
            onClose();
        } catch {
            toast.error("Erreur lors de l'ajustement.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={onClose}
        >
            <div
                className="bg-surface-base rounded-xl border border-border shadow-xl p-6 w-80"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-base font-semibold mb-1">Ajustement manuel</h3>
                <p className="text-xs text-text-muted mb-4">
                    {item.name ?? item.ingredientName} — stock actuel :{" "}
                    <strong>{item.quantity} {item.unit}</strong>
                </p>

                <label className="block text-xs text-text-muted mb-1">
                    Delta ({item.unit}) — négatif pour retirer
                </label>
                <input
                    type="number"
                    step="any"
                    value={delta}
                    onChange={(e) => setDelta(e.target.value)}
                    className="w-full mb-4 px-3 py-2 rounded-md border border-border bg-surface-sidebar text-sm focus:outline-none focus:ring-2 focus:ring-action-primary"
                />

                <label className="block text-xs text-text-muted mb-1">
                    Motif (optionnel)
                </label>
                <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full mb-6 px-3 py-2 rounded-md border border-border bg-surface-sidebar text-sm focus:outline-none focus:ring-2 focus:ring-action-primary"
                    placeholder="Perte, correction inventaire…"
                />

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md text-sm text-text-muted hover:bg-surface-hover"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 rounded-md bg-action-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                    >
                        {saving ? "Enregistrement…" : "Appliquer"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function InventoryPage() {
    const searchParams = useSearchParams();
const _TAB_ALIASES: Record<string, InvTab> = { stockage: "storage", stocks: "stock" };
const _VALID_INV_TABS: InvTab[] = ["stock", "storage", "rotating_count"];
const _rawTab = searchParams.get("tab") ?? "";
const _initTab: InvTab = _VALID_INV_TABS.includes(_rawTab as InvTab)
    ? (_rawTab as InvTab)
    : (_TAB_ALIASES[_rawTab] ?? "stock");
const [activeTab, setActiveTab] = useState<InvTab>(_initTab);
    const [receptionOpen, setReceptionOpen] = useState(false);
    const [transferOpen, setTransferOpen] = useState(false);
    const [prepOpen, setPrepOpen] = useState(false);
    const [transferItem, setTransferItem] = useState<StockItem | undefined>(undefined);

    // RBAC guards (rbac-4)
    const deletePermission = useActionPermission("inventory", "delete_item");
    const physCountPermission = useActionPermission("inventory", "physical_count");
    const adjustPermission = useActionPermission("inventory", "adjust_stock");

    // PIN modal state (delete_item requires PIN)
    const [pinOpen, setPinOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    // Threshold / reorder modal state (log-2 / log-3)
    const [editThresholdItem, setEditThresholdItem] = useState<StockItem | null>(null);

    // Physical count modal state
    const [physCountItem, setPhysCountItem] = useState<StockItem | null>(null);

    // Adjust stock modal state
    const [adjustItem, setAdjustItem] = useState<StockItem | null>(null);

    const {
        stockItems,
        storageLocations,
        lowStockItems,
        isLoading,
    } = useInventory();

    const openTransfer = (item?: StockItem) => {
        setTransferItem(item);
        setTransferOpen(true);
    };

    // ── Delete handlers ──────────────────────────────────────────────────────
    const handleDeleteClick = (item: StockItem) => {
        if (!deletePermission.allowed) {
            toast.error(deletePermission.reason ?? "Accès refusé.");
            return;
        }
        if (deletePermission.requiresPin) {
            setPendingDeleteId(item.id);
            setPinOpen(true);
        } else {
            void executeDelete(item.id);
        }
    };

    const handlePinSuccess = () => {
        if (pendingDeleteId) {
            void executeDelete(pendingDeleteId);
            setPendingDeleteId(null);
        }
    };

    const executeDelete = async (id: string) => {
        try {
            await Nexus.adapter.delete(`stockItems/${id}`);
            toast.success("Article supprimé.");
        } catch {
            toast.error("Erreur lors de la suppression.");
        }
    };

    // ── Physical count handler ───────────────────────────────────────────────
    const handlePhysCountClick = (item: StockItem) => {
        if (!physCountPermission.allowed) {
            toast.error(physCountPermission.reason ?? "Accès refusé.");
            return;
        }
        setPhysCountItem(item);
    };

    // ── Adjust stock handler ─────────────────────────────────────────────────
    const handleAdjustClick = (item: StockItem) => {
        if (!adjustPermission.allowed) {
            toast.error(adjustPermission.reason ?? "Accès refusé.");
            return;
        }
        setAdjustItem(item);
    };

    return (
        <div className="min-h-screen bg-surface-base text-text-primary p-6">
            <header className="mb-6 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-serif font-bold">Stocks &amp; Inventaire</h1>
                    <p className="text-sm text-text-muted mt-1">
                        Réception, transferts, préparations et cartographie du stockage.
                        Les déductions s&apos;effectuent automatiquement à la clôture des commandes.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setReceptionOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 rounded-md bg-action-primary text-white text-sm font-medium hover:opacity-90"
                    >
                        <PlusCircle className="w-4 h-4" /> Réception
                    </button>
                    <button
                        onClick={() => setPrepOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 rounded-md border border-border text-sm font-medium hover:bg-surface-hover"
                    >
                        <ChefHat className="w-4 h-4" /> Préparation
                    </button>
                </div>
            </header>

            <nav className="flex gap-1 border-b border-border mb-6">
                <button
                    onClick={() => setActiveTab("stock")}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === "stock"
                            ? "border-action-primary text-action-primary"
                            : "border-transparent text-text-muted hover:text-text-primary"
                    }`}
                >
                    <Package className="w-4 h-4" /> Stocks
                </button>
                <button
                    onClick={() => setActiveTab("storage")}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === "storage"
                            ? "border-action-primary text-action-primary"
                            : "border-transparent text-text-muted hover:text-text-primary"
                    }`}
                >
                    <Warehouse className="w-4 h-4" /> Plan de stockage
                </button>
                <button
                    onClick={() => setActiveTab("rotating_count")}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === "rotating_count"
                            ? "border-action-primary text-action-primary"
                            : "border-transparent text-text-muted hover:text-text-primary"
                    }`}
                >
                    <RotateCcw className="w-4 h-4" /> Comptage tournant
                </button>
            </nav>

            <main>
                {activeTab === "stock" && (
                    <section>
                        {lowStockItems.length > 0 && (
                            <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-md bg-amber-500/10 text-amber-600 text-sm">
                                <AlertTriangle className="w-4 h-4" />
                                {lowStockItems.length} article(s) en stock bas.
                            </div>
                        )}
                        <div className="overflow-x-auto rounded-lg border border-border">
                            <table className="w-full text-sm">
                                <thead className="bg-surface-sidebar text-text-muted text-left">
                                    <tr>
                                        <th className="px-4 py-2.5 font-medium">Article</th>
                                        <th className="px-4 py-2.5 font-medium">Quantité</th>
                                        <th className="px-4 py-2.5 font-medium">Unité</th>
                                        <th className="px-4 py-2.5 font-medium">Seuil</th>
                                        <th className="px-4 py-2.5 font-medium">Réassort</th>
                                        <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stockItems.map((item) => {
                                        const reorderQty =
                                            (item as Record<string, unknown>).reorderQuantity as
                                                | number
                                                | undefined;
                                        const isLow =
                                            item.quantity <= (item.minQuantity ?? 0);
                                        return (
                                            <tr
                                                key={item.id}
                                                className="border-t border-border hover:bg-surface-hover"
                                            >
                                                <td className="px-4 py-2.5 font-medium">
                                                    {item.name ?? item.ingredientName}
                                                </td>
                                                <td
                                                    className={`px-4 py-2.5 tabular-nums ${
                                                        isLow ? "text-amber-500 font-semibold" : ""
                                                    }`}
                                                >
                                                    {item.quantity}
                                                </td>
                                                <td className="px-4 py-2.5 text-text-muted">
                                                    {item.unit}
                                                </td>
                                                {/* Seuil d'alerte (log-2) */}
                                                <td className="px-4 py-2.5 tabular-nums text-text-muted">
                                                    {item.minQuantity != null
                                                        ? `${item.minQuantity} ${item.unit}`
                                                        : "—"}
                                                </td>
                                                {/* Quantité de réassort (log-3) */}
                                                <td className="px-4 py-2.5 tabular-nums text-text-muted">
                                                    {reorderQty != null
                                                        ? `${reorderQty} ${item.unit}`
                                                        : "—"}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {/* Transfer */}
                                                        <button
                                                            onClick={() => openTransfer(item)}
                                                            title="Transférer"
                                                            className="p-1.5 rounded hover:bg-surface-hover text-action-primary"
                                                        >
                                                            <ArrowLeftRight className="w-3.5 h-3.5" />
                                                        </button>

                                                        {/* Edit threshold / reorder (log-2, log-3) */}
                                                        <button
                                                            onClick={() => setEditThresholdItem(item)}
                                                            title="Modifier seuil & réassort"
                                                            className="p-1.5 rounded hover:bg-surface-hover text-text-muted hover:text-text-primary"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>

                                                        {/* Physical count (rbac-4) */}
                                                        <button
                                                            onClick={() => handlePhysCountClick(item)}
                                                            title={
                                                                physCountPermission.allowed
                                                                    ? "Comptage physique"
                                                                    : "Accès insuffisant"
                                                            }
                                                            className={`p-1.5 rounded hover:bg-surface-hover ${
                                                                physCountPermission.allowed
                                                                    ? "text-text-muted hover:text-text-primary"
                                                                    : "opacity-40 cursor-not-allowed"
                                                            }`}
                                                        >
                                                            <ClipboardCheck className="w-3.5 h-3.5" />
                                                        </button>

                                                        {/* Adjust stock (rbac-4) */}
                                                        <button
                                                            onClick={() => handleAdjustClick(item)}
                                                            title={
                                                                adjustPermission.allowed
                                                                    ? "Ajustement manuel"
                                                                    : "Accès insuffisant"
                                                            }
                                                            className={`p-1.5 rounded hover:bg-surface-hover ${
                                                                adjustPermission.allowed
                                                                    ? "text-text-muted hover:text-text-primary"
                                                                    : "opacity-40 cursor-not-allowed"
                                                            }`}
                                                        >
                                                            <SlidersHorizontal className="w-3.5 h-3.5" />
                                                        </button>

                                                        {/* Delete (rbac-4 — requires PIN) */}
                                                        <button
                                                            onClick={() => handleDeleteClick(item)}
                                                            title={
                                                                deletePermission.allowed
                                                                    ? "Supprimer"
                                                                    : "Accès insuffisant"
                                                            }
                                                            className={`p-1.5 rounded hover:bg-surface-hover ${
                                                                deletePermission.allowed
                                                                    ? "text-red-500 hover:text-red-600"
                                                                    : "opacity-40 cursor-not-allowed text-text-muted"
                                                            }`}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {!isLoading && stockItems.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-4 py-8 text-center text-text-muted italic"
                                            >
                                                Aucun article en stock.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {activeTab === "storage" && (
                    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {storageLocations.map((loc) => (
                            <div
                                key={loc.id}
                                className="rounded-lg border border-border p-4 bg-surface-sidebar"
                            >
                                <div className="flex items-center gap-2 font-medium">
                                    <Warehouse className="w-4 h-4 text-action-primary" />
                                    {loc.name}
                                </div>
                                <p className="text-xs text-text-muted mt-1">
                                    {loc.type ?? "Zone de stockage"}
                                </p>
                            </div>
                        ))}
                        {storageLocations.length === 0 && (
                            <p className="text-sm text-text-muted italic py-8 col-span-full text-center">
                                Aucun emplacement de stockage configuré.
                            </p>
                        )}
                    </section>
                )}

                {/* log-7: Rotating count section */}
                {activeTab === "rotating_count" && (
                    <section>
                        <RotatingCount />
                    </section>
                )}
            </main>

            {/* ── Stock modals ──────────────────────────────────────────── */}
            <StockReceptionModal
                isOpen={receptionOpen}
                onClose={() => setReceptionOpen(false)}
            />
            <CreatePreparationModal
                isOpen={prepOpen}
                onClose={() => setPrepOpen(false)}
            />
            <StockTransferModal
                isOpen={transferOpen}
                onClose={() => setTransferOpen(false)}
                stockItem={transferItem}
            />

            {/* ── Threshold / reorder edit modal (log-2, log-3) ─────────── */}
            {editThresholdItem && (
                <ThresholdModal
                    item={editThresholdItem}
                    onClose={() => setEditThresholdItem(null)}
                />
            )}

            {/* ── Physical count modal (rbac-4) ─────────────────────────── */}
            {physCountItem && (
                <PhysicalCountModal
                    item={physCountItem}
                    onClose={() => setPhysCountItem(null)}
                />
            )}

            {/* ── Manual adjust modal (rbac-4) ──────────────────────────── */}
            {adjustItem && (
                <AdjustStockModal
                    item={adjustItem}
                    onClose={() => setAdjustItem(null)}
                />
            )}

            {/* ── PIN modal for delete_item guard (rbac-4) ──────────────── */}
            <SecurityPinModal
                isOpen={pinOpen}
                onClose={() => {
                    setPinOpen(false);
                    setPendingDeleteId(null);
                }}
                onSuccess={handlePinSuccess}
                title="Confirmation de suppression"
                description="Saisissez votre code PIN pour supprimer cet article du stock."
            />
        </div>
    );
}
