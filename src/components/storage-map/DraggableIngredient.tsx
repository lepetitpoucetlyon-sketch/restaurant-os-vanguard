
"use client";

import { useDraggable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/ui.foundations";;
import { Ingredient } from "@/types";

interface DraggableIngredientProps {
    ingredient: Ingredient;
    stockCount: number;
    highlightQuery?: string;
    onClick?: () => void;
    isSelected?: boolean;
}

export function DraggableIngredient({ ingredient, stockCount, highlightQuery, onClick, isSelected }: DraggableIngredientProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `ingredient-${ingredient.id}`,
        data: { type: 'ingredient', ingredient }
    });

    const highlightText = (text: string, query: string) => {
        if (!query) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) =>
                    part.toLowerCase() === query.toLowerCase()
                        ? <span key={i} className="bg-emerald-100 text-emerald-700 rounded-sm px-0.5">{part}</span>
                        : part
                )}
            </span>
        );
    };

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={onClick}
            className={cn(
                "flex items-center gap-4 p-4 rounded-xl border transition-all group relative overflow-hidden",
                isDragging
                    ? "opacity-50 border-dashed border-accent bg-accent/5 scale-105 shadow-2xl z-50"
                    : isSelected
                        ? "bg-bg-secondary border-accent shadow-premium shadow-accent/10 lg:pl-5"
                        : "bg-bg-primary border-border hover:border-accent/30 hover:shadow-lg dark:hover:bg-white/5 cursor-grab active:cursor-grabbing"
            )}
        >
            {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />}

            <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors shadow-sm border border-black/5 dark:border-white/5",
                isSelected ? "bg-accent text-white" : "bg-bg-tertiary text-text-muted group-hover:text-accent"
            )}>
                <GripVertical className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className={cn(
                    "font-serif text-sm truncate leading-tight transition-colors",
                    isSelected ? "text-accent font-medium italic" : "text-text-primary font-light"
                )}>
                    {highlightQuery ? highlightText(ingredient.name, highlightQuery) : ingredient.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest bg-bg-tertiary px-1.5 py-0.5 rounded-sm">
                        {highlightQuery ? highlightText(ingredient.category, highlightQuery) : ingredient.category}
                    </span>
                </div>
            </div>
            <div className="flex flex-col items-end gap-1">
                <div className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-black transition-colors shadow-sm border border-black/5",
                    isSelected ? "bg-accent text-white border-accent" : "bg-bg-tertiary text-text-primary"
                )}>
                    {stockCount}
                </div>
            </div>
        </div>
    );
}
