
"use client";

import { Package } from "lucide-react";
import { Ingredient } from "@nexus/contracts";

export function DraggingIngredientOverlay({ ingredient }: { ingredient: Ingredient }) {
    return (
        <div className="flex items-center gap-3 p-4 bg-surface-card dark:bg-bg-secondary rounded-2xl border-2 border-emerald-500 shadow-2xl shadow-emerald-500/20 min-w-[13.75rem]">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-status-success to-status-success flex items-center justify-center text-text-primary">
                <Package className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-primary dark:text-text-primary uppercase tracking-tight">{ingredient.name}</p>
                <p className="text-nano font-bold text-status-success uppercase tracking-wider mt-0.5">
                    Déposer sur un emplacement
                </p>
            </div>
        </div>
    );
}
