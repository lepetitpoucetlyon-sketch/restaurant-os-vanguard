// @ts-nocheck
"use client";

import React from "react";
import { 
  Sparkles, 
  ChevronRight, 
  BookOpen, 
  MapPin, 
  ThermometerSun 
} from "lucide-react";
import { WineRegion } from "@/domain/types/bar";

interface SommelierTabProps {
  regions: WineRegion[];
}

export const SommelierTab: React.FC<SommelierTabProps> = ({ regions }) => {
  return (
    <div className="animate-in fade-in duration-150">
        <div className="flex items-center justify-between mb-8">
            <div>
                <h2 className="text-2xl font-black text-text-primary">Sommellerie</h2>
                <p className="text-text-muted text-sm mt-1">Accords mets-vins et recommandations</p>
            </div>
        </div>

        {/* Pairing Suggestions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-bg-secondary rounded-2xl p-6 border border-border shadow-sm">
                <h3 className="text-lg font-black text-text-primary mb-6 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    Accords du Jour
                </h3>
                <div className="space-y-4">
                    {[
                        { dish: 'Filet de Boeuf Rossini', wine: 'Château Margaux 2015', reason: 'La puissance du vin sublime le foie gras' },
                        { dish: 'Homard Thermidor', wine: 'Dom Pérignon 2012', reason: 'Bulles fines et richesse du homard' },
                        { dish: 'Pigeon aux Cerises', wine: 'Romanée-Conti 2018', reason: 'Pinot Noir et fruits rouges en harmonie' },
                    ].map((pairing, i) => (
                        <div key={i} className="p-4 rounded-xl bg-bg-primary dark:bg-bg-tertiary border border-border">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-text-primary">{pairing.dish}</span>
                                <ChevronRight className="w-4 h-4 text-text-muted" />
                            </div>
                            <p className="text-accent font-bold text-sm">{pairing.wine}</p>
                            <p className="text-[12px] text-text-muted mt-1">{pairing.reason}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Wine Knowledge Base */}
            <div className="bg-bg-secondary rounded-2xl p-6 border border-border shadow-sm">
                <h3 className="text-lg font-black text-text-primary mb-6 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-accent" />
                    Fiches Région
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    {regions.slice(0, 4).map((region) => (
                        <div
                            key={region.id}
                            className="p-4 rounded-xl border border-border hover:shadow-md transition-all cursor-pointer"
                        >
                            <div
                                className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center"
                                style={{ backgroundColor: `${region.color}20` }}
                            >
                                <MapPin className="w-5 h-5" style={{ color: region.color }} />
                            </div>
                            <h4 className="font-bold text-text-primary">{region.name}</h4>
                            <p className="text-sm text-text-muted">{region.country}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Temperature Guide */}
        <div className="bg-gradient-to-br from-accent to-bg-tertiary/20 dark:to-accent/50 rounded-2xl p-6 text-white">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                <ThermometerSun className="w-5 h-5" />
                Guide des Températures de Service
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { type: 'Champagne', temp: '6-8°C', icon: '🍾' },
                    { type: 'Blanc sec', temp: '8-10°C', icon: '🥂' },
                    { type: 'Rouge léger', temp: '12-14°C', icon: '🍷' },
                    { type: 'Rouge corsé', temp: '16-18°C', icon: '🍷' },
                ].map((item, i) => (
                    <div key={i} className="p-4 bg-white/10 rounded-xl text-center">
                        <span className="text-2xl">{item.icon}</span>
                        <p className="font-bold mt-2">{item.type}</p>
                        <p className="text-2xl font-black mt-1">{item.temp}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};
