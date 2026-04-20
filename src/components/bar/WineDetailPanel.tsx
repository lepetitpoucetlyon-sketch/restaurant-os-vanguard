// @ts-nocheck
"use client";

import React from "react";
import { 
  Wine, 
  Star, 
  Plus, 
  Edit3 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wine as WineType, WineRegion } from "@/domain/types/bar";

interface WineDetailPanelProps {
  selectedWine: WineType | null;
  regions: WineRegion[];
  onClose: () => void;
}

export const WineDetailPanel: React.FC<WineDetailPanelProps> = ({ 
  selectedWine,
  regions,
  onClose
}) => {
  if (!selectedWine) return null;

  const region = regions.find(r => r.id === selectedWine.region);

  return (
    <div className="w-96 bg-white dark:bg-bg-secondary border-l border-neutral-100 dark:border-border overflow-auto h-full fixed right-0 top-[80px] md:top-[100px] z-30 shadow-2xl animate-in slide-in-from-right duration-300">
        <div
            className="p-6 text-white relative"
            style={{ backgroundColor: region?.color || '#722F37' }}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg text-white text-2xl leading-none"
            >
                &times;
            </button>
            <Wine className="w-12 h-12 mb-4 text-white/60" />
            <h3 className="text-xl font-black">{selectedWine.name}</h3>
            <p className="text-white/60 mt-1">{selectedWine.vintage} • {selectedWine.type}</p>
        </div>

        <div className="p-6 space-y-6">
            {/* Rating & Price */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                    <span className="text-2xl font-black">{selectedWine.rating}/100</span>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-[#722F37] dark:text-text-primary">{(selectedWine.priceInCents / 100).toLocaleString('fr-FR')} €</p>
                    <p className="text-[11px] text-text-muted">Coût: {(selectedWine.costPriceInCents / 100).toLocaleString('fr-FR')} €</p>
                </div>
            </div>

            {/* Details */}
            <div className="space-y-4">
                <div className="p-3 bg-bg-primary dark:bg-bg-tertiary rounded-xl">
                    <p className="text-[10px] font-black text-text-muted uppercase">Cépage</p>
                    <p className="font-bold text-text-primary">{selectedWine.grape}</p>
                </div>
                <div className="p-3 bg-bg-primary dark:bg-bg-tertiary rounded-xl">
                    <p className="text-[10px] font-black text-text-muted uppercase">Température de service</p>
                    <p className="font-bold text-text-primary">{selectedWine.servingTemp}</p>
                </div>
                <div className="p-3 bg-bg-primary dark:bg-bg-tertiary rounded-xl">
                    <p className="text-[10px] font-black text-text-muted uppercase">Emplacement</p>
                    <p className="font-bold text-text-primary">{selectedWine.location}</p>
                </div>
            </div>

            {/* Pairings */}
            <div>
                <p className="text-[10px] font-black text-text-muted uppercase mb-3">Accords suggérés</p>
                <div className="flex flex-wrap gap-2">
                    {selectedWine.pairings.map((pairing, i) => (
                        <span key={i} className="px-3 py-1.5 bg-[#722F37]/10 text-[#722F37] rounded-lg text-sm font-bold">
                            {pairing}
                        </span>
                    ))}
                </div>
            </div>

            {/* Notes */}
            <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-100 dark:border-amber-500/30">
                <p className="text-sm text-text-primary italic">"{selectedWine.notes}"</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-neutral-100 dark:border-border">
                <Button variant="outline" className="flex-1 h-11 rounded-xl">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Modifier
                </Button>
                <Button className="flex-1 h-11 bg-[#722F37] hover:bg-[#5A252C] rounded-xl text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Commander
                </Button>
            </div>
        </div>
    </div>
  );
};
