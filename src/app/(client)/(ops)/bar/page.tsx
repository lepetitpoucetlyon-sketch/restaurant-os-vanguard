"use client";

import React, { useState, useMemo } from "react";
import { useAtomValue } from "jotai";
import { useToast } from "@ui/Toast";
import {
  RecipeDetailDialog,
  winesAtom,
  cocktailsAtom,
  wineRegionsAtom,
  useKitchen,
  BarSidebar,
  KdsTab,
  WineCellarTab,
  SommelierTab,
  CocktailTab,
  StocksTab,
  WineDetailPanel,
  ProductFormModal,
  type BarTab,
  type Wine,
  type Cocktail,
} from "@/modules/ops";
import type { Recipe } from "@nexus/contracts";
import { withPageGuard } from "@/shared/components/rbac/PageGuard";
import { PageShell } from "@/shared/components/ui/PageShell";
import { Wine as WineIcon } from "lucide-react";

function BarPage() {
    const { showToast } = useToast();
    const { orders: kitchenOrders, updateOrderStatus: nexusUpdateOrderStatus } = useKitchen();

    const wines = useAtomValue(winesAtom);
    const cocktails = useAtomValue(cocktailsAtom);
    const regions = useAtomValue(wineRegionsAtom);

    const [activeTab, setActiveTab] = useState<BarTab>('kds');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchQueryKDS, setSearchQueryKDS] = useState('');
    const [rushMode, setRushMode] = useState(false);

    interface BarOrderItem {
      name?: string;
      quantity?: number;
      station?: string;
      category?: string;
      modifiers?: Array<string | { name: string }>;
      notes?: string;
    }

    const isBarItem = (item: BarOrderItem) => {
      if (item.station === 'bar' || item.category === 'boissons') return true;
      const lower = (item.name || '').toLowerCase();
      return ['cocktail','wine','vin','beer','bière','coffee','café','espresso','soda','juice','jus','mojito','margarita','spritz','kir'].some(kw => lower.includes(kw));
    };

    const orders = useMemo(() => {
      return kitchenOrders
        .filter(o => o.status !== 'delivered' && o.status !== 'paid' && (o.items || []).some((item: BarOrderItem) => isBarItem(item)))
        .map(o => ({
          id: o.id,
          table: o.tableNumber ?? 'T?',
          serverName: o.serverName ?? '—',
          status: o.status ?? 'new',
          priority: 'normal',
          elapsed: o.createdAt ? Math.floor((Date.now() - new Date(o.createdAt as string | number).getTime()) / 1000) : 0,
          items: ((o.items || []) as BarOrderItem[])
            .filter(item => isBarItem(item))
            .map(item => ({
              name: item.name ?? 'Article',
              qty: item.quantity ?? 1,
              station: 'bar',
              modifiers: (item.modifiers ?? []).map(m => typeof m === 'string' ? m : m.name),
              notes: item.notes,
            })),
        }))
        .filter(o => o.items.length > 0);
    }, [kitchenOrders]);

    const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
    const [filterRegion, setFilterRegion] = useState<string | null>(null);
    const [showCocktailModal, setShowCocktailModal] = useState(false);
    const [editingCocktail, setEditingCocktail] = useState<Cocktail | null>(null);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

    const updateOrderStatus = async (orderId: string, nextStatus: string) => {
        await nexusUpdateOrderStatus(orderId, nextStatus);
        showToast(`Commande ${nextStatus === 'delivered' ? 'terminée' : nextStatus === 'preparing' ? 'lancée' : 'prête'}`, "success");
    };

    const filteredWines = useMemo(() => wines.filter(w => {
        if (filterRegion && w.region !== filterRegion) return false;
        if (searchQuery && !w.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    }), [wines, filterRegion, searchQuery]);

    const totalCellarValue = useMemo(() =>
        wines.reduce((sum, w) => sum + (w.priceInMicrounits / 1_000_000 * w.stock), 0),
        [wines]
    );
    const lowStockWines = useMemo(() =>
        wines.filter(w => w.stock <= w.minStock),
        [wines]
    );

    return (
        <PageShell
            title="Bar & Mixologie"
            subtitle="KDS Bar, gestion de la cave, cocktails et accords mets-vins."
            icon={WineIcon}
            breadcrumbs={[{ label: "Opérations" }, { label: "Bar & Mixologie" }]}
        >
            <div className="flex flex-1 h-[calc(100vh-140px)] overflow-hidden">
                <BarSidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    cellarValue={totalCellarValue}
                    referenceCount={wines.length}
                />

                <div className="flex-1 flex flex-col min-w-0 bg-surface-bg overflow-y-auto">
                    {activeTab === 'kds' && (
                        <KdsTab
                            orders={orders}
                            searchQueryKDS={searchQueryKDS}
                            rushMode={rushMode}
                            gridColumns={3}
                            updateOrderStatus={updateOrderStatus}
                            setSearchQueryKDS={setSearchQueryKDS}
                            setRushMode={setRushMode}
                            setSelectedRecipe={setSelectedRecipe}
                        />
                    )}

                    {activeTab === 'wines' && (
                        <WineCellarTab
                            wines={filteredWines}
                            regions={regions}
                            filterRegion={filterRegion}
                            searchQuery={searchQuery}
                            setFilterRegion={setFilterRegion}
                            setSearchQuery={setSearchQuery}
                            setSelectedWine={setSelectedWine}
                        />
                    )}

                    {activeTab === 'sommelier' && (
                        <SommelierTab regions={regions} />
                    )}

                    {activeTab === 'cocktails' && (
                        <CocktailTab
                            cocktails={cocktails}
                            setShowCocktailModal={setShowCocktailModal}
                            setEditingCocktail={setEditingCocktail}
                        />
                    )}

                    {activeTab === 'stocks' && (
                        <StocksTab
                            lowStockWines={lowStockWines.length}
                            totalCellarValue={totalCellarValue}
                            wineCount={wines.length}
                        />
                    )}
                </div>
            </div>

            <WineDetailPanel
                selectedWine={selectedWine}
                regions={regions}
                onClose={() => setSelectedWine(null)}
            />

            {selectedRecipe && (
                <RecipeDetailDialog
                    recipe={selectedRecipe}
                    isOpen={true}
                    onClose={() => setSelectedRecipe(null)}
                />
            )}

            <ProductFormModal
                isOpen={showCocktailModal}
                onClose={() => {
                    setShowCocktailModal(false);
                    setEditingCocktail(null);
                }}
                productType="cocktail"
                editProduct={editingCocktail as unknown as import("@nexus/contracts").Recipe}
            />
        </PageShell>
    );
}

export default withPageGuard(BarPage, "bar");
