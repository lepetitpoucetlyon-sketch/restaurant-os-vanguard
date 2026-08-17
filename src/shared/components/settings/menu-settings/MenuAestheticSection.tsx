"use client";

import { motion } from "framer-motion";
import {
    LayoutGrid,
    AlertTriangle,
    Leaf,
    Flame,
    Sparkles,
    FileText,
    ImageIcon as FileImageIcon
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";

export interface MenuAestheticSettings {
    showImages: boolean;
    showDescriptions: boolean;
    showAllergens: boolean;
    showNutrition: boolean;
    showCalories: boolean;
    pricingMode: 'ttc' | 'ht';
    defaultVAT: number;
    suggestionsEnabled: boolean;
    seasonalLabels: boolean;
}

interface MenuAestheticSectionProps {
    menuSettings: MenuAestheticSettings;
    setMenuSettings: React.Dispatch<React.SetStateAction<MenuAestheticSettings>>;
}

export function MenuAestheticSection({ menuSettings, setMenuSettings }: MenuAestheticSectionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10 overflow-hidden relative group"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -mr-32 -mt-32 transition-opacity group-hover:opacity-100 opacity-50 pointer-events-none" />

            <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent">
                    <LayoutGrid className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-2xl font-serif text-text-primary uppercase tracking-tight italic">
                        Menu Aesthetic Engine
                    </h3>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Global Terminal Presentation Params</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { key: 'showImages', label: 'Visual Synthesis', sub: 'Photo projection', icon: FileImageIcon },
                    { key: 'showDescriptions', label: 'Semantic Data', sub: 'Detailed descriptions', icon: FileText },
                    { key: 'showAllergens', label: 'Bioshield Intel', sub: 'Allergen signaling', icon: AlertTriangle },
                    { key: 'showCalories', label: 'Thermal Units', sub: 'Calorie projection', icon: Flame },
                    { key: 'seasonalLabels', label: 'Cycle Logic', sub: 'Seasonal identifiers', icon: Leaf },
                    { key: 'suggestionsEnabled', label: 'Neural Recs', sub: 'AI upselling engine', icon: Sparkles },
                ].map((setting) => {
                    const Icon = setting.icon;
                    const isEnabled = menuSettings[setting.key as keyof MenuAestheticSettings];
                    return (
                        <motion.button
                            key={setting.key}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setMenuSettings(s => ({ ...s, [setting.key]: !s[setting.key as keyof MenuAestheticSettings] }))}
                            className={cn(
                                "p-6 rounded-[2rem] border transition-all duration-500 relative overflow-hidden group/item flex flex-col justify-between h-40 text-left",
                                isEnabled
                                    ? "bg-bg-primary border-accent/20 shadow-lg shadow-accent/5"
                                    : "bg-bg-tertiary/50 border-transparent hover:bg-bg-primary/50"
                            )}
                        >
                            <div className="flex justify-between items-start" data-tutorial={setting.key === 'showImages' ? 'settings-3-0' : undefined}>
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
                                    isEnabled ? "bg-accent text-bg-primary" : "bg-bg-tertiary text-text-muted group-hover/item:text-text-primary"
                                )}>
                                    <Icon className="w-5 h-5 transition-transform group-hover/item:scale-110" />
                                </div>
                                <div className={cn(
                                    "w-8 h-4 rounded-full relative transition-all duration-500",
                                    isEnabled ? "bg-status-success" : "bg-bg-tertiary border border-border"
                                )}>
                                    <motion.div
                                        animate={{ x: isEnabled ? 18 : 2 }}
                                        className="absolute top-1 w-2 h-2 bg-surface-card rounded-full shadow-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <p className="font-serif text-text-primary uppercase tracking-tight text-xs mb-1 italic">{setting.label}</p>
                                <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{setting.sub}</p>
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </motion.div>
    );
}
