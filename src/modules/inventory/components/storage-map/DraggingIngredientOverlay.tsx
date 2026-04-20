
"use client";

import { Package } from "lucide-react";
import { Ingredient } from "@/types";

export function DraggingIngredientOverlay({ ingredient }: { ingredient: Ingredient }) {
    return (
        <div className="flex items-center gap-3 p-4 bg-white dark:bg-bg-secondary rounded-2xl border-2 border-emerald-500 shadow-2xl shadow-emerald-500/20 min-w-[220px]">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center text-white">
                <Package className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-neutral-900 dark:text-text-primary uppercase tracking-tight">{ingredient.name}</p>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-0.5">
                    Déposer sur un emplacement
                </p>
            </div>
        </div>
    );
}
