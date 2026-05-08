"use client";

import { useAtomValue } from "jotai";
import { categoriesAtom } from "@/store/pillars/logistics";
import { cn } from "@/lib/ui.foundations";;
import { Store, Pizza, Coffee, GlassWater, Beef, UtensilsCrossed, Star, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";


interface CategoryListProps {
    selectedCategory: string;
    onSelectCategory: (id: string) => void;
    onBack: () => void;
}

import { useLanguage } from "@/hooks";

const ICON_MAP: Record<string, import('lucide-react').LucideIcon> = {
    all: Star,
    pizzas: Pizza,
    pastas: UtensilsCrossed,
    boissons: GlassWater,
    entrees: UtensilsCrossed,
    plats: Beef,
    desserts: Coffee
};

export function CategoryList({ selectedCategory, onSelectCategory, onBack }: CategoryListProps) {
    const { t } = useLanguage();
    const categories = useAtomValue(categoriesAtom);

    return (
        <div className="w-16 md:w-[160px] bg-bg-secondary border-r border-border/50 flex flex-col h-full overflow-y-auto scrollbar-hide transition-colors duration-700 relative z-20">
            {/* Visual Header Gradient */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-accent-gold/5 to-transparent pointer-events-none" />

            <div className="p-2 md:p-4 space-y-2 relative z-10">
                {/* NEW: Retour Button moved here */}
                <button
                    onClick={onBack}
                    className="w-full flex flex-col items-center gap-3 p-4 md:p-6 rounded-[24px] text-text-muted hover:bg-bg-tertiary/60 transition-all duration-500 group relative overflow-hidden mb-2"
                >
                    <div className="w-8 h-8 rounded-full bg-surface-card dark:bg-surface-card/5 flex items-center justify-center border border-border/50 shadow-sm group-hover:bg-accent-gold group-hover:text-white transition-all">
                        <ArrowLeft strokeWidth={1.5} className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                    </div>
                    <span className="hidden md:block text-[9px] font-black uppercase tracking-[0.3em] group-hover:text-accent-gold transition-colors">{t('pos.back')}</span>
                </button>

                <div className="h-px w-8 mx-auto bg-border/40 mb-4" />

                <button
                    onClick={() => onSelectCategory("all")}
                    className={cn(
                        "w-full flex flex-col items-center gap-3 p-4 md:p-6 rounded-[24px] transition-all duration-500 group relative overflow-hidden",
                        selectedCategory === "all"
                            ? "bg-surface-card dark:bg-surface-card/5 text-text-primary shadow-premium border border-accent-gold/20"
                            : "text-text-muted hover:bg-bg-tertiary/60"
                    )}
                >
                    <Star strokeWidth={1.5} className={cn("w-5 h-5 transition-all duration-500 relative z-10", selectedCategory === "all" ? "text-accent-gold fill-accent-gold/10" : "group-hover:scale-110")} />
                    <span className="hidden md:block text-[9px] font-black uppercase tracking-[0.3em] relative z-10">{t('pos.favorites')}</span>
                </button>

                <div className="h-px w-8 mx-auto bg-border/40 my-4" />

                {categories.map((cat) => {

                    const Icon = ICON_MAP[cat.id] || UtensilsCrossed;
                    const isActive = selectedCategory === cat.id;

                    return (
                        <button
                            key={cat.id}
                            onClick={() => onSelectCategory(cat.id)}
                            className={cn(
                                "w-full flex flex-col items-center gap-3 p-4 md:p-6 rounded-[24px] transition-all duration-500 group relative overflow-hidden",
                                isActive
                                    ? "bg-surface-card dark:bg-surface-card/5 text-text-primary shadow-premium border border-accent-gold/30"
                                    : "text-text-muted hover:bg-bg-tertiary/60"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="cat-glow"
                                    className="absolute inset-0 bg-accent-gold/5 blur-xl pointer-events-none"
                                />
                            )}
                            <Icon strokeWidth={1.5} className={cn("w-4 h-4 md:w-5 md:h-5 transition-all duration-500 relative z-10", isActive ? "text-accent-gold scale-110" : "group-hover:scale-110 group-hover:text-text-primary")} />
                            <span className="hidden md:block text-[9px] font-black uppercase tracking-[0.2em] text-center relative z-10">{t(`pos.categories.${cat.id}`)}</span>

                            {isActive && (
                                <motion.div
                                    layoutId="cat-indicator"
                                    className="absolute left-0 w-1 h-8 bg-accent-gold rounded-r-full"
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="mt-auto p-4 flex flex-col items-center gap-6 mb-8 relative z-10">
                <div className="w-full h-px bg-border/40" />

                <div className="w-full h-px bg-border/40" />

                {/* Executive Logo Mark */}
                <div className="flex flex-col items-center gap-2 group cursor-default">
                    <div className="w-11 h-11 rounded-full bg-text-primary text-white flex items-center justify-center shadow-premium group-hover:rotate-12 transition-all">
                        <span className="font-serif italic font-bold text-xl">R</span>
                    </div>
                    <div className="flex flex-col items-center opacity-40">
                        <span className="hidden md:block text-[7px] font-black text-text-muted uppercase tracking-[0.5em]">OS v2.4</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
