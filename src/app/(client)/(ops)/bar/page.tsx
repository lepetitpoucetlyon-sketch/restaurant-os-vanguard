"use client";

import React, { useState } from "react";
import { useToast } from "@ui/Toast";
import dynamic from "next/dynamic";
const ProductFormModal = dynamic(
  () => import("@/modules/ops/pos/components").then(m => m.ProductFormModal),
  { ssr: false, loading: () => null }
);
import { RecipeDetailDialog } from "@modules/ops";

// Domain & Constants
import { BarTab, Wine, Cocktail } from "@domain/types/bar";
import {
  WINE_REGIONS,
  WINE_CELLAR,
  COCKTAILS,
} from "@domain/constants/bar-data";
import { Recipe } from "@nexus/contracts";
import { useKitchen } from "@/modules/ops/providers";

// Components
import { BarSidebar } from "@modules/ops";
import { KdsTab } from "@modules/ops";
import { WineCellarTab } from "@modules/ops";
import { SommelierTab } from "@modules/ops";
import { CocktailTab } from "@modules/ops";
import { StocksTab } from "@modules/ops";
import { WineDetailPanel } from "@modules/ops";

export default function BarPage() {
    const { showToast } = useToast();
    const { orders: kitchenOrders, updateOrderStatus: nexusUpdateOrderStatus } = useKitchen();

    // UI State
    const [activeTab, setActiveTab] = useState<BarTab>('kds');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchQueryKDS, setSearchQueryKDS] = useState('');
    const [rushMode, setRushMode] = useState(false);

    // Bar orders: real-time Firestore orders filtered to bar station
    const orders = React.useMemo(() => {
      return kitchenOrders
        .filter(o => o.status !== 'delivered' && o.status !== 'paid' && o.items.some(item => {
          const extra = item as unknown as { station?: string; category?: string };
          if (extra.station === 'bar' || extra.category === 'boissons') return true;
          const lower = item.name.toLowerCase();
          return ['cocktail','wine','vin','beer','bière','coffee','café','espresso','soda','juice','jus','mojito','margarita','spritz','kir'].some(kw => lower.includes(kw));
        }))
        .map(o => ({
          id: o.id,
          table: o.tableNumber ?? 'T?',
          serverName: o.serverName ?? '—',
          status: (['new','preparing','ready','delivered'].includes(o.status) ? o.status : 'new') as 'new' | 'preparing' | 'ready' | 'delivered',
          priority: 'normal',
          elapsed: o.createdAt ? Math.floor((Date.now() - new Date(o.createdAt as string | number).getTime()) / 1000) : 0,
          items: o.items
            .filter(item => {
              const extra = item as unknown as { station?: string; category?: string };
              if (extra.station === 'bar' || extra.category === 'boissons') return true;
              const lower = item.name.toLowerCase();
              return ['cocktail','wine','vin','beer','bière','coffee','café','espresso','soda','juice','jus','mojito','margarita','spritz','kir'].some(kw => lower.includes(kw));
            })
            .map(item => ({
              name: item.name,
              qty: item.quantity,
              station: 'bar' as const,
              modifiers: (item.modifiers ?? []).map(m => typeof m === 'string' ? m : m.name),
              notes: item.notes,
            })),
        }))
        .filter(o => o.items.length > 0);
    }, [kitchenOrders]);
    
    // Selection State
    const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
    const [filterRegion, setFilterRegion] = useState<string | null>(null);
    const [showCocktailModal, setShowCocktailModal] = useState(false);
    const [editingCocktail, setEditingCocktail] = useState<Cocktail | null>(null);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

    const updateOrderStatus = async (orderId: string, nextStatus: string) => {
        await nexusUpdateOrderStatus(orderId, nextStatus);
        showToast(`Commande ${nextStatus === 'delivered' ? 'terminée' : nextStatus === 'preparing' ? 'lancée' : 'prête'}`, "success");
    };

    const filteredWines = WINE_CELLAR.filter(w => {
        if (filterRegion && w.region !== filterRegion) return false;
        if (searchQuery && !w.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const totalCellarValue = WINE_CELLAR.reduce((sum, w) => sum + (w.priceInMicrounits / 1_000_000 * w.stock), 0);
    const lowStockWines = WINE_CELLAR.filter(w => w.stock <= w.minStock).length;

    return (
        <div className="flex h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] -m-4 md:-m-8 bg-bg-primary overflow-hidden pb-20 md:pb-0">
            {/* Modular Sidebar */}
            <BarSidebar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab}
                cellarValue={totalCellarValue}
                referenceCount={WINE_CELLAR.length}
            />

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto p-8 custom-scrollbar">
                {activeTab === 'kds' && (
                    <KdsTab 
                        orders={orders}
                        rushMode={rushMode}
                        searchQueryKDS={searchQueryKDS}
                        gridColumns={3}
                        updateOrderStatus={updateOrderStatus}
                        setRushMode={setRushMode}
                        setSearchQueryKDS={setSearchQueryKDS}
                        setSelectedRecipe={setSelectedRecipe}
                    />
                )}

                {activeTab === 'wines' && (
                    <WineCellarTab 
                        wines={filteredWines}
                        regions={WINE_REGIONS}
                        filterRegion={filterRegion}
                        searchQuery={searchQuery}
                        setFilterRegion={setFilterRegion}
                        setSearchQuery={setSearchQuery}
                        setSelectedWine={setSelectedWine}
                    />
                )}

                {activeTab === 'sommelier' && (
                    <SommelierTab regions={WINE_REGIONS} />
                )}

                {activeTab === 'cocktails' && (
                    <CocktailTab 
                        cocktails={COCKTAILS}
                        setShowCocktailModal={setShowCocktailModal}
                        setEditingCocktail={setEditingCocktail}
                    />
                )}

                {activeTab === 'stocks' && (
                    <StocksTab
                        lowStockWines={lowStockWines}
                        totalCellarValue={totalCellarValue}
                        wineCount={WINE_CELLAR.length}
                    />
                )}
            </div>

            {/* Contextual Panels */}
            <WineDetailPanel 
                selectedWine={selectedWine}
                regions={WINE_REGIONS}
                onClose={() => setSelectedWine(null)}
            />

            {/* Modals & Dialogs */}
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
        </div>
    );
}
