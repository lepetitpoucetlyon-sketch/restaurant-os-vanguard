 
 
"use client";

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
    Sparkles,
} from "lucide-react";

import dynamic from "next/dynamic";
import {
    useInventoryPage,
    computeDLCStatus,
    RotatingCount,
} from "@/modules/logistics";
import { SecurityPinModal } from "@components/ui";
import { withPageGuard } from "@design/rbac/PageGuard";
import { JsonObject } from "@/lib/types/json";
import { POSModalSkeleton } from "@/modules/ops/service/pos/components/POSModalSkeleton";

// Dynamic Lazy Imports for Inventory Modals
const StockReceptionModal = dynamic(() => import("@/modules/logistics").then(m => m.StockReceptionModal), { loading: () => <POSModalSkeleton /> });
const StockTransferModal = dynamic(() => import("@/modules/logistics").then(m => m.StockTransferModal), { loading: () => <POSModalSkeleton /> });
const CreatePreparationModal = dynamic(() => import("@/modules/logistics").then(m => m.CreatePreparationModal), { loading: () => <POSModalSkeleton /> });
const OracleModal = dynamic(() => import("@/modules/logistics").then(m => m.OracleModal), { loading: () => <POSModalSkeleton /> });
const ThresholdModal = dynamic(() => import("@/modules/logistics").then(m => m.ThresholdModal), { loading: () => <POSModalSkeleton /> });
const PhysicalCountModal = dynamic(() => import("@/modules/logistics").then(m => m.PhysicalCountModal), { loading: () => <POSModalSkeleton /> });
const AdjustStockModal = dynamic(() => import("@/modules/logistics").then(m => m.AdjustStockModal), { loading: () => <POSModalSkeleton /> });

function InventoryPage() {
    const {
        activeTab, setActiveTab,
        receptionOpen, setReceptionOpen,
        transferOpen, setTransferOpen, transferItem,
        prepOpen, setPrepOpen,
        pinOpen, setPinOpen, setPendingDeleteId,
        editThresholdItem, setEditThresholdItem,
        physCountItem, setPhysCountItem,
        adjustItem, setAdjustItem,
        oracleItem, setOracleItem,
        deletePermission, physCountPermission, adjustPermission,
        stockItems, storageLocations, lowStockItems, isLoading,
        openTransfer,
        handleDeleteClick,
        handlePinSuccess,
        handlePhysCountClick,
        handleAdjustClick,
    } = useInventoryPage();

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
                    <button onClick={() => setReceptionOpen(true)} className="flex items-center gap-2 px-3 py-2 rounded-md bg-action-primary text-text-primary text-sm font-medium hover:opacity-90">
                        <PlusCircle className="w-4 h-4" /> Réception
                    </button>
                    <button onClick={() => setPrepOpen(true)} className="flex items-center gap-2 px-3 py-2 rounded-md border border-border text-sm font-medium hover:bg-surface-hover">
                        <ChefHat className="w-4 h-4" /> Préparation
                    </button>
                </div>
            </header>

            <nav className="flex gap-1 border-b border-border mb-6">
                {([
                    { id: "stock", icon: <Package className="w-4 h-4" />, label: "Stocks" },
                    { id: "storage", icon: <Warehouse className="w-4 h-4" />, label: "Plan de stockage" },
                    { id: "rotating_count", icon: <RotateCcw className="w-4 h-4" />, label: "Comptage tournant" },
                ] as const).map(({ id, icon, label }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === id ? "border-action-primary text-action-primary" : "border-transparent text-text-muted hover:text-text-primary"}`}
                    >
                        {icon} {label}
                    </button>
                ))}
            </nav>

            <main>
                {activeTab === "stock" && (
                    <section>
                        {lowStockItems.length > 0 && (
                            <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-md bg-action-primary/10 text-amber-600 text-sm">
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
                                        <th className="px-4 py-2.5 font-medium">DLC</th>
                                        <th className="px-4 py-2.5 font-medium">Seuil</th>
                                        <th className="px-4 py-2.5 font-medium">Réassort</th>
                                        <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...stockItems]
                                        .sort((a, b) => computeDLCStatus(a.dlc as string | undefined).rank - computeDLCStatus(b.dlc as string | undefined).rank)
                                        .map((item) => {
                                            const reorderQty = (item as JsonObject).reorderQuantity as number | undefined;
                                            const isLow = item.quantity <= (item.minQuantity ?? 0);
                                            const dlcStatus = computeDLCStatus(item.dlc as string | undefined);
                                            return (
                                                <tr key={item.id} className="border-t border-border hover:bg-surface-hover">
                                                    <td className="px-4 py-2.5 font-medium">{item.name ?? item.ingredientName}</td>
                                                    <td className={`px-4 py-2.5 tabular-nums ${isLow ? "text-action-primary font-semibold" : ""}`}>{item.quantity}</td>
                                                    <td className="px-4 py-2.5 text-text-muted">{item.unit}</td>
                                                    <td className={`px-4 py-2.5 tabular-nums ${dlcStatus.className}`} title={item.dlc as string | undefined}>{dlcStatus.label}</td>
                                                    <td className="px-4 py-2.5 tabular-nums text-text-muted">{item.minQuantity != null ? `${item.minQuantity} ${item.unit}` : "—"}</td>
                                                    <td className="px-4 py-2.5 tabular-nums text-text-muted">{reorderQty != null ? `${reorderQty} ${item.unit}` : "—"}</td>
                                                    <td className="px-4 py-2.5">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button onClick={() => openTransfer(item)} title="Transférer" className="p-1.5 rounded hover:bg-surface-hover text-action-primary">
                                                                <ArrowLeftRight className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => setEditThresholdItem(item)} title="Modifier seuil & réassort" className="p-1.5 rounded hover:bg-surface-hover text-text-muted hover:text-text-primary">
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => handlePhysCountClick(item)} title={physCountPermission.allowed ? "Comptage physique" : "Accès insuffisant"} className={`p-1.5 rounded hover:bg-surface-hover ${physCountPermission.allowed ? "text-text-muted hover:text-text-primary" : "opacity-40 cursor-not-allowed"}`}>
                                                                <ClipboardCheck className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => handleAdjustClick(item)} title={adjustPermission.allowed ? "Ajustement manuel" : "Accès insuffisant"} className={`p-1.5 rounded hover:bg-surface-hover ${adjustPermission.allowed ? "text-text-muted hover:text-text-primary" : "opacity-40 cursor-not-allowed"}`}>
                                                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => setOracleItem(item)} title="Prévision Oracle" className="p-1.5 rounded hover:bg-surface-hover text-accent-gold hover:text-accent-gold/80">
                                                                <Sparkles className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => handleDeleteClick(item)} title={deletePermission.allowed ? "Supprimer" : "Accès insuffisant"} className={`p-1.5 rounded hover:bg-surface-hover ${deletePermission.allowed ? "text-status-danger hover:text-red-600" : "opacity-40 cursor-not-allowed text-text-muted"}`}>
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    {!isLoading && stockItems.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-text-muted italic">Aucun article en stock.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {activeTab === "storage" && (
                    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {storageLocations.map((loc: { id: string; name: string; type?: string }) => (
                            <div key={loc.id} className="rounded-lg border border-border p-4 bg-surface-sidebar">
                                <div className="flex items-center gap-2 font-medium">
                                    <Warehouse className="w-4 h-4 text-action-primary" /> {loc.name}
                                </div>
                                <p className="text-xs text-text-muted mt-1">{loc.type ?? "Zone de stockage"}</p>
                            </div>
                        ))}
                        {storageLocations.length === 0 && (
                            <p className="text-sm text-text-muted italic py-8 col-span-full text-center">Aucun emplacement de stockage configuré.</p>
                        )}
                    </section>
                )}

                {activeTab === "rotating_count" && (
                    <section><RotatingCount /></section>
                )}
            </main>

            <StockReceptionModal isOpen={receptionOpen} onClose={() => setReceptionOpen(false)} />
            <CreatePreparationModal isOpen={prepOpen} onClose={() => setPrepOpen(false)} />
            <StockTransferModal isOpen={transferOpen} onClose={() => setTransferOpen(false)} stockItem={transferItem} />

            {editThresholdItem && <ThresholdModal item={editThresholdItem} onClose={() => setEditThresholdItem(null)} />}
            {physCountItem && <PhysicalCountModal item={physCountItem} onClose={() => setPhysCountItem(null)} />}
            {adjustItem && <AdjustStockModal item={adjustItem} onClose={() => setAdjustItem(null)} />}
            {oracleItem && <OracleModal item={oracleItem} onClose={() => setOracleItem(null)} />}

            <SecurityPinModal
                isOpen={pinOpen}
                onClose={() => { setPinOpen(false); setPendingDeleteId(null); }}
                onSuccess={handlePinSuccess}
                title="Confirmation de suppression"
                description="Saisissez votre code PIN pour supprimer cet article du stock."
            />
        </div>
    );
}

export default withPageGuard(InventoryPage, "inventory");
