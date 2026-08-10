"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useAtomValue } from "jotai";
import { Star, Tractor, Puzzle, MinusCircle } from "lucide-react";
import { menuAnalysisSelector } from "@/bootstrap/store/pillars/commerce";
import { cn } from "@/lib/ui.foundations";

/**
 * Matrice Menu Engineering (Kasavana & Smith) : Star / Plowhorse / Puzzle / Dog.
 *
 * Un plat se classe selon deux axes normalisés par la moyenne du menu :
 *  - popularité (nombre de ventes)
 *  - profitabilité (prix − food cost)
 *
 * Quadrants :
 *  - Star     = très rentable + très populaire → conserver, mettre en avant
 *  - Plowhorse= populaire mais peu rentable   → réingénierie du coût
 *  - Puzzle   = rentable mais peu populaire   → marketing / carte / suggestion
 *  - Dog      = les deux faibles              → retrait ou refonte
 *
 * Le classement est calculé côté selector Jotai (analyticsAtoms.ts).
 */

type Category = "star" | "plowhorse" | "puzzle" | "dog";

const QUADRANTS: Record<
    Category,
    { label: string; help: string; icon: typeof Star; className: string }
> = {
    star: {
        label: "Stars",
        help: "Rentables · populaires — pilier de la carte",
        icon: Star,
        className: "bg-accent-gold/10 border-accent-gold/40 text-accent-gold",
    },
    plowhorse: {
        label: "Plowhorses",
        help: "Populaires · peu rentables — travailler le coût matière",
        icon: Tractor,
        className: "bg-status-danger/10 border-status-danger/30 text-status-danger",
    },
    puzzle: {
        label: "Puzzles",
        help: "Rentables · peu populaires — visibilité, formation service",
        icon: Puzzle,
        className: "bg-status-info/10 border-blue-500/30 text-blue-500",
    },
    dog: {
        label: "Dogs",
        help: "Ni rentables · ni populaires — candidats au retrait",
        icon: MinusCircle,
        className: "bg-text-muted/10 border-border text-text-muted",
    },
};

const ORDER: Category[] = ["star", "plowhorse", "puzzle", "dog"];

export const MenuEngineeringMatrix: React.FC = () => {
    const analysis = useAtomValue(menuAnalysisSelector);

    const groups = useMemo(() => {
        const map: Record<Category, typeof analysis> = {
            star: [],
            plowhorse: [],
            puzzle: [],
            dog: [],
        };
        for (const item of analysis) {
            const cat: Category = item.category as Category;
            map[cat].push(item);
        }
        // Chaque quadrant : plus performant en tête (popularité × marge)
        for (const key of ORDER) {
            map[key].sort((a: (typeof analysis)[number], b: (typeof analysis)[number]) => b.popularity * b.profitability - a.popularity * a.profitability);
        }
        return map;
    }, [analysis]);

    if (analysis.length === 0) {
        return (
            <div className="rounded-2xl border border-border p-8 text-center text-text-muted italic bg-surface-card">
                Pas encore de données de vente — la matrice s'active dès les premières commandes payées.
            </div>
        );
    }

    return (
        <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
        >
            <header>
                <h2 className="text-lg font-serif font-black italic text-text-primary">
                    Matrice Menu Engineering
                </h2>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-1">
                    Classement Kasavana & Smith · popularité × marge
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ORDER.map(key => {
                    const q = QUADRANTS[key];
                    const items = groups[key];
                    const Icon = q.icon;
                    return (
                        <div
                            key={key}
                            className={cn(
                                "rounded-2xl border p-5 flex flex-col",
                                q.className,
                            )}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <Icon className="w-5 h-5" strokeWidth={2.5} />
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-widest">
                                        {q.label}
                                        <span className="ml-2 text-xs opacity-70 tabular-nums">
                                            ({items.length})
                                        </span>
                                    </h3>
                                    <p className="text-[10px] opacity-70 leading-tight">{q.help}</p>
                                </div>
                            </div>

                            <ul className="space-y-1.5 mt-1">
                                {items.slice(0, 6).map((item: (typeof analysis)[number]) => (
                                    <li
                                        key={item.productId}
                                        className="flex items-center justify-between text-xs bg-surface-card/60 rounded-lg px-3 py-1.5"
                                    >
                                        <span className="truncate font-medium text-text-primary">{item.name}</span>
                                        <span className="tabular-nums text-text-muted ml-2 whitespace-nowrap">
                                            {item.popularity} · {(item.profitability / 100).toFixed(2)}€
                                        </span>
                                    </li>
                                ))}
                                {items.length === 0 && (
                                    <li className="text-xs italic opacity-60 px-3 py-1.5">Aucun plat</li>
                                )}
                                {items.length > 6 && (
                                    <li className="text-[10px] opacity-60 px-3 pt-1">
                                        +{items.length - 6} autres
                                    </li>
                                )}
                            </ul>
                        </div>
                    );
                })}
            </div>
        </motion.section>
    );
};
