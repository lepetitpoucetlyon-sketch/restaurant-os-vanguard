"use client";

import React from "react";
import { 
  AlertCircle, 
  Wine, 
  Grape, 
  Beer, 
  GlassWater 
} from "lucide-react";
import { Button } from "@ui/Button";

interface StocksTabProps {
  lowStockWines: number;
  totalCellarValue: number;
  wineCount: number;
  onViewAlerts?: () => void;
  categories?: Array<{
    name: string;
    count: number;
    value: number;
    icon: React.ElementType;
    color: string;
  }>;
}

export const StocksTab: React.FC<StocksTabProps> = ({ 
  lowStockWines,
  totalCellarValue,
  wineCount,
  onViewAlerts,
  categories
}) => {
  const displayCategories = categories || [
    { name: 'Spiritueux', count: 45, value: 8500, icon: Wine, color: '#722F37' },
    { name: 'Vins', count: wineCount, value: totalCellarValue, icon: Grape, color: '#8B0000' },
    { name: 'Bières', count: 12, value: 450, icon: Beer, color: '#D4A574' },
    { name: 'Softs', count: 28, value: 320, icon: GlassWater, color: '#4285F4' },
  ];

  return (
    <div className="animate-in fade-in duration-300">
        <div className="flex items-center justify-between mb-8">
            <div>
                <h2 className="text-2xl font-black text-text-primary">Stocks Bar</h2>
                <p className="text-text-muted text-sm mt-1">Spiritueux, softs et consommables</p>
            </div>
        </div>

        {/* Stock Alerts */}
        {lowStockWines > 0 && (
            <div className="p-4 mb-6 bg-status-danger/10 rounded-2xl border border-status-danger/30 flex items-center gap-4">
                <AlertCircle className="w-6 h-6 text-status-danger" />
                <div>
                    <p className="font-bold text-status-danger">{lowStockWines} références en stock critique</p>
                    <p className="text-sm text-text-muted">Passez commande auprès de vos fournisseurs</p>
                </div>
                <Button 
                    variant="outline" 
                    onClick={onViewAlerts}
                    className="ml-auto rounded-xl border-status-danger text-status-danger hover:bg-status-danger/10 transition-colors"
                >
                    Voir les alertes
                </Button>
            </div>
        )}

        {/* Stock Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayCategories.map((cat, i) => {
                const Icon = cat.icon;
                return (
                    <div key={i} className="bg-surface-card dark:bg-bg-secondary rounded-2xl p-6 border border-subtle dark:border-border shadow-sm">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                            style={{ backgroundColor: `${cat.color}15` }}
                        >
                            <Icon className="w-6 h-6" style={{ color: cat.color }} />
                        </div>
                        <h3 className="font-black text-lg text-text-primary">{cat.name}</h3>
                        <p className="text-sm text-text-muted">{cat.count} références</p>
                        <p className="text-xl font-black mt-2" style={{ color: cat.color }}>
                            {cat.value.toLocaleString('fr-FR')} €
                        </p>
                    </div>
                );
            })}
        </div>
    </div>
  );
};
