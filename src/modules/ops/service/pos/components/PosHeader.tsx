"use client";

import type { LucideIcon } from "lucide-react";
import {
    ArrowLeft,
    MoreHorizontal,
    Star,
    Pizza,
    UtensilsCrossed,
    GlassWater,
    Beef,
    Coffee,
    Wallet,
    RotateCcw,
    Tablet,
    BookOpen,
    Printer,
    Store,
    ShoppingBag,
    LifeBuoy,
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { ActionGuard } from "@/shared/components/rbac/ActionGuard";
import { PageHeaderWithDocs } from "@ui/PageHeaderWithDocs";

/**
 * PosHeader — bandeau éditorial de la caisse.
 *
 * Extrait de app/(client)/(ops)/pos/page.tsx dans le cadre du plan v3.1 P2.1.
 * Voir aussi ReservationsHeader et KDSHeader pour la même famille d'extraction.
 *
 * Cluster gauche : back + kicker/big-title table + rush pulse.
 * Cluster droit  : 3 role-grouped rails (mode + course · print/tiroir/void · tablet) + SOS.
 * Nav catégories : segmented underline gold, mêmes primitives que PageShell.Tab.
 */

const ICON_MAP: Record<string, LucideIcon> = {
    all: Star,
    pizzas: Pizza,
    pastas: UtensilsCrossed,
    boissons: GlassWater,
    entrees: UtensilsCrossed,
    plats: Beef,
    desserts: Coffee,
};

interface CategoryLike {
    id: string;
    name: string;
}

interface TableLike {
    id: string;
    number?: string | number | null;
    seats?: number;
}

interface PosHeaderProps {
    // Table & mode
    currentTable: TableLike | null | undefined;
    allTables: TableLike[];
    selectedTableId: string | null;
    setSelectedTableId: (id: string | null) => void;
    isTabletMode: boolean;
    setIsTabletMode: (updater: (v: boolean) => boolean) => void;
    isTablePickerOpen: boolean;
    setIsTablePickerOpen: (updater: (v: boolean) => boolean) => void;
    isRushMode: boolean;
    blurClass: string;
    // Consumption + course
    consumptionMode: "dine_in" | "takeaway";
    setConsumptionMode: (mode: "dine_in" | "takeaway") => void;
    isCourseViewOpen: boolean;
    setIsCourseViewOpen: (updater: (v: boolean) => boolean) => void;
    // Utilities
    cartItemsLength: number;
    handlePrintReceipt: () => void;
    setIsCashDrawerOpen: (open: boolean) => void;
    setIsVoidModalOpen: (open: boolean) => void;
    // SOS
    setIsSosModalOpen: (open: boolean) => void;
    // Categories rail
    categories: CategoryLike[];
    selectedCategory: string;
    setSelectedCategory: (id: string) => void;
}

export function PosHeader({
    currentTable,
    allTables,
    selectedTableId,
    setSelectedTableId,
    isTabletMode,
    setIsTabletMode,
    isTablePickerOpen,
    setIsTablePickerOpen,
    isRushMode,
    blurClass,
    consumptionMode,
    setConsumptionMode,
    isCourseViewOpen,
    setIsCourseViewOpen,
    cartItemsLength,
    handlePrintReceipt,
    setIsCashDrawerOpen,
    setIsVoidModalOpen,
    setIsSosModalOpen,
    categories,
    selectedCategory,
    setSelectedCategory,
}: PosHeaderProps) {
    return (
        <header
            className={cn(
                "px-ui pt-6 pb-5 border-b border-border/40 sticky top-0 z-40 transition-colors duration-300",
                isRushMode ? "bg-surface-sidebar/95" : "bg-surface-card/70 dark:bg-bg-primary/85",
                blurClass
            )}
        >
            <div className="flex items-center justify-between gap-4 mb-6">
                {/* Left cluster — back + title + rush pulse */}
                <div className="flex items-baseline gap-5 min-w-0">
                    <button
                        onClick={() => setSelectedTableId(null)}
                        aria-label="Retour à la sélection des tables"
                        className="shrink-0 w-9 h-9 -mb-1 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-glass-hover rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-[18px] h-[18px]" />
                    </button>

                    {isTabletMode ? (
                        <button
                            onClick={() => setIsTablePickerOpen((v) => !v)}
                            className="group flex items-baseline gap-3 pr-1 hover:opacity-90 transition-opacity"
                        >
                            <span className="font-serif font-black italic text-[11px] uppercase tracking-[0.32em] text-text-muted/70">Table</span>
                            <span className="font-serif font-black text-[38px] leading-none tracking-[-0.02em] text-accent-gold">
                                {currentTable?.number || "—"}
                            </span>
                            <MoreHorizontal className="w-4 h-4 text-accent-gold/60 group-hover:text-accent-gold transition-colors -translate-y-0.5" />
                        </button>
                    ) : (
                        <div className="flex items-baseline gap-3 min-w-0">
                            <span className="font-serif font-black italic text-[11px] uppercase tracking-[0.32em] text-text-muted/70">Table</span>
                            <PageHeaderWithDocs
                                categoryId="pos"
                                title={`${currentTable?.number || ""}`}
                                className="font-serif font-black text-[38px] leading-none tracking-[-0.02em] text-text-primary"
                            />
                        </div>
                    )}

                    {isRushMode && (
                        <span className="hidden sm:flex items-center gap-2 self-center pl-1">
                            <span className="relative flex w-2 h-2">
                                <span className="absolute inset-0 rounded-full bg-status-danger/60 animate-ping" />
                                <span className="relative rounded-full w-2 h-2 bg-status-danger" />
                            </span>
                            <span className="font-serif italic text-[11px] tracking-[0.24em] uppercase text-status-danger/90">Rush</span>
                        </span>
                    )}

                    {isTabletMode && isTablePickerOpen && (
                        <div className="absolute top-full mt-2 left-4 z-50 bg-surface-card border border-border rounded-2xl shadow-xl p-3 w-64 grid grid-cols-4 gap-1.5">
                            {allTables.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => {
                                        setSelectedTableId(t.id);
                                        setIsTablePickerOpen(() => false);
                                    }}
                                    className={cn(
                                        "h-10 rounded-lg border text-xs font-medium tracking-wide transition-colors",
                                        t.id === selectedTableId
                                            ? "bg-accent-gold border-accent-gold text-text-primary"
                                            : "border-border/60 text-text-muted hover:border-accent-gold/40 hover:text-accent-gold"
                                    )}
                                >
                                    {t.number ?? t.id.slice(-3)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right cluster — 3 role-grouped segments with vertical dividers */}
                <div className="flex items-center gap-3 shrink-0">
                    {/* Group A — consumption mode + course view (customer-facing intent) */}
                    <div className="flex items-center h-10 bg-surface-glass border border-border/50 rounded-xl overflow-hidden">
                        <button
                            onClick={() => setConsumptionMode(consumptionMode === "dine_in" ? "takeaway" : "dine_in")}
                            title={consumptionMode === "dine_in" ? "Sur place" : "À emporter"}
                            className={cn(
                                "h-full flex items-center gap-2 px-3.5 text-[11px] font-medium tracking-wide transition-colors border-r border-border/40",
                                consumptionMode === "dine_in" ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
                            )}
                        >
                            {consumptionMode === "dine_in" ? (
                                <Store className="w-[14px] h-[14px] text-action-primary" />
                            ) : (
                                <ShoppingBag className="w-[14px] h-[14px] text-action-primary" />
                            )}
                            <span>{consumptionMode === "dine_in" ? "Sur place" : "Emporter"}</span>
                        </button>
                        <button
                            onClick={() => setIsCourseViewOpen((v) => !v)}
                            title="Vue par cours"
                            aria-pressed={isCourseViewOpen}
                            className={cn(
                                "h-full w-10 flex items-center justify-center transition-colors",
                                isCourseViewOpen ? "text-accent-gold bg-accent-gold/10" : "text-text-secondary hover:text-text-primary"
                            )}
                        >
                            <BookOpen className="w-[15px] h-[15px]" />
                        </button>
                    </div>

                    {/* Group B — ticket utilities (imprimer / tiroir / annuler) */}
                    <div className="flex items-center h-10 bg-surface-glass border border-border/50 rounded-xl overflow-hidden">
                        <button
                            onClick={handlePrintReceipt}
                            disabled={cartItemsLength === 0}
                            title="Imprimer le ticket"
                            className="h-full w-10 flex items-center justify-center text-text-secondary hover:text-action-primary transition-colors disabled:opacity-25 disabled:cursor-not-allowed border-r border-border/40"
                        >
                            <Printer className="w-[15px] h-[15px]" />
                        </button>
                        <ActionGuard page="pos" action="cash_count">
                            <button
                                onClick={() => setIsCashDrawerOpen(true)}
                                title="Fond de caisse"
                                className="h-full w-10 flex items-center justify-center text-text-secondary hover:text-action-primary transition-colors border-r border-border/40"
                            >
                                <Wallet className="w-[15px] h-[15px]" />
                            </button>
                        </ActionGuard>
                        <ActionGuard page="pos" action="void_line">
                            <button
                                onClick={() => setIsVoidModalOpen(true)}
                                title="Annuler / Rembourser"
                                className="h-full w-10 flex items-center justify-center text-text-secondary hover:text-status-danger transition-colors"
                            >
                                <RotateCcw className="w-[15px] h-[15px]" />
                            </button>
                        </ActionGuard>
                    </div>

                    {/* Group C — tablet toggle */}
                    <button
                        onClick={() => setIsTabletMode((v) => !v)}
                        title={isTabletMode ? "Quitter le mode tablette" : "Mode tablette"}
                        aria-pressed={isTabletMode}
                        className={cn(
                            "h-10 w-10 flex items-center justify-center rounded-xl border transition-colors",
                            isTabletMode
                                ? "bg-action-primary text-text-on-primary border-action-primary"
                                : "bg-surface-glass border-border/50 text-text-secondary hover:text-text-primary"
                        )}
                    >
                        <Tablet className="w-[15px] h-[15px]" />
                    </button>

                    {/* SOS — dedicated distress button, single semantic red, no idle pulse */}
                    <button
                        onClick={() => setIsSosModalOpen(true)}
                        title="SOS Caisse & Urgence Service"
                        className="group h-10 pl-3 pr-4 rounded-xl bg-status-danger text-white hover:bg-status-danger/90 active:scale-[0.98] flex items-center gap-2 text-[11px] font-serif italic tracking-[0.2em] uppercase transition-all shadow-[0_4px_20px_-6px_rgba(239,68,68,0.5)]"
                    >
                        <LifeBuoy className="w-[14px] h-[14px]" />
                        <span className="hidden sm:inline">SOS</span>
                    </button>
                </div>
            </div>

            {/* Category rail — segmented navigation with under-line, no pill scaling, no grayscale wash */}
            <nav aria-label="Catégories" className="flex gap-6 overflow-x-auto no-scrollbar -mb-[9px] pb-[7px]">
                <button
                    onClick={() => setSelectedCategory("all")}
                    aria-current={selectedCategory === "all" ? "page" : undefined}
                    className={cn(
                        "group relative shrink-0 flex items-center gap-2 pb-2 text-xs font-medium tracking-wide transition-colors whitespace-nowrap",
                        selectedCategory === "all" ? "text-accent-gold" : "text-text-muted hover:text-text-primary"
                    )}
                >
                    <Star className={cn("w-[15px] h-[15px] transition-transform", selectedCategory === "all" && "fill-accent-gold/20")} />
                    <span>Favoris</span>
                    {selectedCategory === "all" && (
                        <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-accent-gold rounded-full" />
                    )}
                </button>
                {categories.map((cat) => {
                    const Icon = ICON_MAP[cat.id] || UtensilsCrossed;
                    const active = selectedCategory === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                                "group relative shrink-0 flex items-center gap-2 pb-2 text-xs font-medium tracking-wide transition-colors whitespace-nowrap",
                                active ? "text-accent-gold" : "text-text-muted hover:text-text-primary"
                            )}
                        >
                            <Icon className={cn("w-[15px] h-[15px] transition-transform", active && "fill-accent-gold/10")} />
                            <span>{cat.name}</span>
                            {active && (
                                <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-accent-gold rounded-full" />
                            )}
                        </button>
                    );
                })}
            </nav>
        </header>
    );
}
