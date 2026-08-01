"use client";

import React from "react";
import { 
  Clock, 
  Wine, 
  Award, 
  Martini, 
  Package 
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { BarTab } from "@/modules/ops/types/bar";
import { formatCurrency } from "@/lib/formatters";

interface BarSidebarProps {
  activeTab: BarTab;
  setActiveTab: (tab: BarTab) => void;
  cellarValue: number;
  referenceCount: number;
}

export const BarSidebar: React.FC<BarSidebarProps> = ({ 
  activeTab, 
  setActiveTab,
  cellarValue,
  referenceCount
}) => {
  const navItems = [
    { id: 'kds', label: 'KDS Bar', icon: Clock },
    { id: 'wines', label: 'Cave à Vins', icon: Wine },
    { id: 'sommelier', label: 'Sommellerie', icon: Award },
    { id: 'cocktails', label: 'Cocktails', icon: Martini },
    { id: 'stocks', label: 'Stocks Bar', icon: Package },
  ] as const;

  return (
    <div className="w-72 bg-bg-secondary border-r border-border flex flex-col p-6 h-full">
        <div className="mb-8 flex items-center justify-between">
            <div>
                <h1 className="text-xl font-black text-text-primary tracking-tight leading-none">Bar & Sommellerie</h1>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mt-2">
                    Cave • Cocktails • Service
                </p>
            </div>
        </div>

        <nav className="space-y-2 flex-1">
            {navItems.map((item) => {
                const Icon = item.icon;
                return (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-300",
                            activeTab === item.id 
                                ? "bg-accent text-text-primary shadow-xl shadow-accent/20" 
                                : "text-text-muted hover:bg-bg-tertiary hover:text-text-primary"
                        )}
                    >
                        <Icon className="w-5 h-5" />
                        {item.label}
                    </button>
                );
            })}
        </nav>

        {/* Quick Stats Overlay */}
        <div className="mt-auto p-5 bg-gradient-to-br from-accent/90 to-bg-tertiary dark:to-accent/30 rounded-[2rem] text-text-primary shadow-lg relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-surface-card/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            
            <div className="flex items-center gap-3 mb-3 relative z-10">
                <Wine className="w-5 h-5 text-text-primary/60" />
                <span className="text-[9px] font-black uppercase tracking-widest text-text-primary/60">Valeur Cave</span>
            </div>
            <p className="text-2xl font-black relative z-10 tracking-tighter">
                {formatCurrency(cellarValue)}
            </p>
            <p className="text-[10px] text-text-primary/60 mt-1 relative z-10 font-bold uppercase tracking-wider">
                {referenceCount} références actives
            </p>
        </div>
    </div>
  );
};
