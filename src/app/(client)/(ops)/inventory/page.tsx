"use client";

import Link from "next/link";
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
    Wrench,
} from "lucide-react";

import {
    useInventoryPage,
    RotatingCount,
    StockReceptionModal,
    StockTransferModal,
    CreatePreparationModal,
    OracleModal,
    ThresholdModal,
    PhysicalCountModal,
    AdjustStockModal,
    computeDLCStatus,
} from "@/modules/logistics";
import { SecurityPinModal } from "@components/ui";
import { withPageGuard } from "@/shared/components/rbac/PageGuard";
import { PageShell } from "@/shared/components/ui/PageShell";
import { TabGuard } from "@/shared/components/rbac/TabGuard";
import { ActionGuard } from "@/shared/components/rbac/ActionGuard";
import { cn } from "@/lib/ui.foundations";
import type { JsonObject } from "@/shared/types/json";

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
        <PageShell
            kicker="Logistique"
            title="Stocks & Inventaire"
            subtitle="Réception, transferts, préparations et cartographie du stockage."
            icon={Package}
            breadcrumbs={[{ label: "Opérations" }, { label: "Inventaire" }]}
            actions={
                <>
                    <Link
                        href="/facility"
                        className="h-10 px-3.5 rounded-xl bg-surface-glass border border-border/40 hover:border-accent-gold/50 text-text-muted hover:text-accent-gold text-xs font-medium tracking-tight transition-colors flex items-center gap-2"
                    >
                        <Wrench className="w-[14px] h-[14px]" /> <span>GMAO</span>
                    </Link>
                    <button
                        onClick={() => setPrepOpen(true)}
                        className="h-10 px-3.5 rounded-xl bg-surface-glass border border-border/40 hover:border-accent-gold/50 text-text-muted hover:text-accent-gold text-xs font-medium tracking-tight transition-colors flex items-center gap-2"
                    >
                        <ChefHat className="w-[14px] h-[14px]" /> <span>Préparation</span>
                    </button>
                    <ActionGuard page="inventory" action="adjust_stock">
                        <PageShell.CTA onClick={() => setReceptionOpen(true)}>
                            <PlusCircle className="w-[15px] h-[15px]" /> <span>Réception</span>
                        </PageShell.CTA>
                    </ActionGuard>
                </>
            }
            tabs={
                <>
                    <PageShell.Tab
                        active={activeTab === "stock"}
                        onClick={() => setActiveTab("stock")}
                        icon={Package}
                    >
                        Stocks
                    </PageShell.Tab>
                    <TabGuard pageKey="inventory" tabKey="storage">
                        <PageShell.Tab
                            active={activeTab === "storage"}
                            onClick={() => setActiveTab("storage")}
                            icon={Warehouse}
                        >
                            Plan de stockage
                        </PageShell.Tab>
                    </TabGuard>
                    <TabGuard pageKey="inventory" tabKey="rotating_count">
                        <PageShell.Tab
                            active={activeTab === "rotating_count"}
                            onClick={() => setActiveTab("rotating_count")}
                            icon={RotateCcw}
                        >
                            Comptage tournant
                        </PageShell.Tab>
                    </TabGuard>
                </>
            }
        >

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
        </PageShell>
    );
}

export default withPageGuard(InventoryPage, "inventory");
