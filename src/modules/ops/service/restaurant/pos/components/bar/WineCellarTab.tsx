"use client";

import React from "react";
import { 
  Search, 
  Plus, 
  Star, 
  Grape, 
  ThermometerSun 
} from "lucide-react";
import { Button } from "@ui/Button";
import { cn } from "@/lib/ui.foundations";
import type { Wine, WineRegion } from '../../../../../types/bar';
import { formatCurrency } from "@/lib/formatters";

interface WineCellarTabProps {
  wines: Wine[];
  regions: WineRegion[];
  filterRegion: string | null;
  searchQuery: string;
  setFilterRegion: (region: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedWine: (wine: Wine) => void;
  onAddWine?: () => void;
}

export const WineCellarTab: React.FC<WineCellarTabProps> = ({
  wines,
  regions,
  filterRegion,
  searchQuery,
  setFilterRegion,
  setSearchQuery,
  setSelectedWine,
  onAddWine
}) => {
  return (
    <div className="animate-in fade-in duration-300">
        <div className="flex items-center justify-between mb-8">
            <div>
                <h2 className="text-2xl font-black text-text-primary">Cave à Vins</h2>
                <p className="text-text-muted text-sm mt-1">Gérez votre cave et vos références</p>
            </div>
            <div className="flex gap-3">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-64 h-11 pl-11 pr-4 bg-bg-secondary dark:bg-bg-tertiary border border-border rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                </div>
                <Button 
                    onClick={onAddWine}
                    className="h-11 bg-accent hover:bg-accent/90 rounded-xl"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter Vin
                </Button>
            </div>
        </div>

        {/* Region Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
            <button
                onClick={() => setFilterRegion(null)}
                className={cn(
                    "px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                    !filterRegion ? "bg-accent text-text-primary" : "bg-bg-secondary dark:bg-bg-tertiary hover:bg-bg-tertiary text-text-primary"
                )}
            >
                Toutes régions
            </button>
            {regions.map((region) => (
                <button
                    key={region.id}
                    onClick={() => setFilterRegion(filterRegion === region.id ? null : region.id)}
                    className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2",
                        filterRegion === region.id ? "bg-accent text-text-primary" : "bg-bg-secondary dark:bg-bg-tertiary hover:bg-bg-tertiary text-text-primary"
                    )}
                >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: region.color }} />
                    {region.name}
                </button>
            ))}
        </div>

        {/* Wine Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wines.map((wine) => {
                const region = regions.find(r => r.id === wine.region);
                const isLowStock = wine.stock <= wine.minStock;
                return (
                    <div role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (e.currentTarget as HTMLElement).click(); } }}
                        key={wine.id}
                        className="bg-bg-secondary rounded-2xl p-6 border border-border shadow-sm hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
                        onClick={() => setSelectedWine(wine)}
                    >
                        {/* Region Color Strip */}
                        <div
                            className="absolute top-0 left-0 w-2 h-full"
                            style={{ backgroundColor: region?.color }}
                        />

                        <div className="pl-4">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-black text-lg text-text-primary">{wine.name}</h3>
                                    <p className="text-sm text-text-muted">{wine.type} • {region?.name}</p>
                                </div>
                                <div className="flex items-center gap-1 px-2 py-1 bg-warning-soft dark:bg-warning/10 rounded-lg">
                                    <Star className="w-4 h-4 text-warning fill-warning" />
                                    <span className="font-black text-warning">{wine.rating}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 mb-4 text-sm text-text-muted">
                                <span className="flex items-center gap-1">
                                    <Grape className="w-4 h-4" />
                                    {wine.vintage}
                                </span>
                                <span className="flex items-center gap-1">
                                    <ThermometerSun className="w-4 h-4" />
                                    {wine.servingTemp}
                                </span>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-border">
                                <div>
                                    <p className="text-2xl font-black text-accent dark:text-text-primary">{formatCurrency(wine.priceInMicrounits / 1_000_000)}</p>
                                    <p className="text-nano text-text-muted">Marge: {(((wine.priceInMicrounits - (wine.costPriceInMicrounits ?? 0)) / wine.priceInMicrounits) * 100).toFixed(0)}%</p>
                                </div>
                                <div className={cn(
                                    "px-3 py-1.5 rounded-lg text-sm font-bold",
                                    isLowStock ? "bg-error-soft text-error" : "bg-success-soft text-success"
                                )}>
                                    {wine.stock} en stock
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
};
