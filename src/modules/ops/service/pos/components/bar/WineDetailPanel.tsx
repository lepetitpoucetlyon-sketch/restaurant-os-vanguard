"use client";

import React from "react";
import { 
  Wine, 
  Star, 
  Plus, 
  Edit3 
} from "lucide-react";
import { Button } from "@ui/Button";
import type { Wine as WineType, WineRegion } from '../../../../types/bar';

interface WineDetailPanelProps {
  selectedWine: WineType | null;
  regions: WineRegion[];
  onClose: () => void;
  onEdit?: (wine: WineType) => void;
  onOrderRestock?: (wine: WineType) => void;
}

export const WineDetailPanel: React.FC<WineDetailPanelProps> = ({ 
  selectedWine,
  regions,
  onClose,
  onEdit,
  onOrderRestock
}) => {
  if (!selectedWine) return null;

  const region = regions.find(r => r.id === selectedWine.region);

  return (
    <div className="w-96 bg-surface-card dark:bg-bg-secondary border-l border-subtle dark:border-border overflow-auto h-full fixed right-0 top-[80px] md:top-[100px] z-30 shadow-2xl animate-in slide-in-from-right duration-300">
        <div
            className="p-6 text-text-primary relative"
            style={{ backgroundColor: region?.color || '#722F37' }}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-surface-card/10 rounded-lg text-text-primary text-2xl leading-none"
            >
                &times;
            </button>
            <Wine className="w-12 h-12 mb-4 text-text-primary/60" />
            <h3 className="text-xl font-black">{selectedWine.name}</h3>
            <p className="text-text-primary/60 mt-1">{selectedWine.vintage} • {selectedWine.type}</p>
        </div>

        <div className="p-6 space-y-6">
            {/* Rating & Price */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Star className="w-6 h-6 text-status-warning fill-amber-500" />
                    <span className="text-2xl font-black">{selectedWine.rating}/100</span>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-wine dark:text-text-primary">{((selectedWine.priceInMicrounits / 1_000_000)).toLocaleString('fr-FR')} €</p>
                    <p className="text-micro text-text-muted">Coût: {(selectedWine.costPriceInMicrounits / 1_000_000).toLocaleString('fr-FR')} €</p>
                </div>
            </div>

            {/* Details */}
            <div className="space-y-4">
                <div className="p-3 bg-bg-primary dark:bg-bg-tertiary rounded-xl">
                    <p className="text-nano font-black text-text-muted uppercase">Cépage</p>
                    <p className="font-bold text-text-primary">{selectedWine.grape}</p>
                </div>
                <div className="p-3 bg-bg-primary dark:bg-bg-tertiary rounded-xl">
                    <p className="text-nano font-black text-text-muted uppercase">Température de service</p>
                    <p className="font-bold text-text-primary">{selectedWine.servingTemp}</p>
                </div>
                <div className="p-3 bg-bg-primary dark:bg-bg-tertiary rounded-xl">
                    <p className="text-nano font-black text-text-muted uppercase">Emplacement</p>
                    <p className="font-bold text-text-primary">{selectedWine.location}</p>
                </div>
            </div>

            {/* Pairings */}
            <div>
                <p className="text-nano font-black text-text-muted uppercase mb-3">Accords suggérés</p>
                <div className="flex flex-wrap gap-2">
                    {selectedWine.pairings.map((pairing, i) => (
                        <span key={i} className="px-3 py-1.5 bg-wine/10 text-wine rounded-lg text-sm font-bold">
                            {pairing}
                        </span>
                    ))}
                </div>
            </div>

            {/* Notes */}
            <div className="p-4 bg-status-warning dark:bg-status-warning/10 rounded-xl border border-amber-100 dark:border-action-primary/30">
                <p className="text-sm text-text-primary italic">"{selectedWine.notes}"</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-subtle dark:border-border">
                <Button 
                    variant="outline" 
                    onClick={() => onEdit?.(selectedWine)}
                    className="flex-1 h-11 rounded-xl"
                >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Modifier
                </Button>
                <Button 
                    onClick={() => onOrderRestock?.(selectedWine)}
                    className="flex-1 h-11 bg-wine hover:bg-[#5A252C] rounded-xl text-text-primary"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Commander
                </Button>
            </div>
        </div>
    </div>
  );
};
