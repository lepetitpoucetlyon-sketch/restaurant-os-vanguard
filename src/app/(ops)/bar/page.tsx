"use client";

import React, { useState } from "react";
import { cn } from "@/lib/ui.foundations";
import { useToast } from "@/components/ui/Toast";
import { ProductFormModal } from "@/components/modals/ProductFormModal";
import { RecipeDetailDialog } from "@/modules/ops/components/kitchen/RecipeDetailDialog";
import { PRODUCTS } from "@/lib/mock-data";

// Domain & Constants
import { BarTab, Wine, Cocktail } from "@/domain/types/bar";
import { 
  WINE_REGIONS, 
  WINE_CELLAR, 
  COCKTAILS, 
  BAR_ORDERS 
} from "@/domain/constants/bar-data";

// Components
import { BarSidebar } from "@/components/bar/BarSidebar";
import { KdsTab } from "@/components/bar/KdsTab";
import { WineCellarTab } from "@/components/bar/WineCellarTab";
import { SommelierTab } from "@/components/bar/SommelierTab";
import { CocktailTab } from "@/components/bar/CocktailTab";
import { StocksTab } from "@/components/bar/StocksTab";
import { WineDetailPanel } from "@/components/bar/WineDetailPanel";

export default function BarPage() {
    const { showToast } = useToast();
    
    // UI State
    const [activeTab, setActiveTab] = useState<BarTab>('kds');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchQueryKDS, setSearchQueryKDS] = useState('');
    const [rushMode, setRushMode] = useState(false);
    
    // Data State
    const [orders, setOrders] = useState(BAR_ORDERS.map(o => ({ 
      ...o, 
      status: (o.items[0]?.status === 'done' ? 'ready' : (o.items[0]?.status === 'preparing' ? 'preparing' : 'new')) as any
    })));
    
    // Selection State
    const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
    const [filterRegion, setFilterRegion] = useState<string | null>(null);
    const [showCocktailModal, setShowCocktailModal] = useState(false);
    const [editingCocktail, setEditingCocktail] = useState<Cocktail | null>(null);
    const [selectedRecipe, setSelectedRecipe] = useState<any>(null);

    const updateOrderStatus = (orderId: string, nextStatus: string) => {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus as any } : o));
        showToast(`Commande ${nextStatus === 'delivered' ? 'terminée' : nextStatus === 'preparing' ? 'lancée' : 'prête'}`, "success");
    };

    const filteredWines = WINE_CELLAR.filter(w => {
        if (filterRegion && w.region !== filterRegion) return false;
        if (searchQuery && !w.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const totalCellarValue = WINE_CELLAR.reduce((sum, w) => sum + (w.priceInCents * w.stock), 0);
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
                        orders={orders as any}
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
                        totalCellarValue={totalCellarValue / 100}
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
            <RecipeDetailDialog
                recipe={selectedRecipe}
                isOpen={!!selectedRecipe}
                onClose={() => setSelectedRecipe(null)}
            />

            <ProductFormModal
                isOpen={showCocktailModal}
                onClose={() => {
                    setShowCocktailModal(false);
                    setEditingCocktail(null);
                }}
                productType="cocktail"
                editProduct={editingCocktail}
            />
        </div>
    );
}
