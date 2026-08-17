"use client";

import { Plus, GripVertical } from "lucide-react";
import type { Category } from "@nexus/contracts";

interface CategorySidebarProps {
    categories: Category[];
    activeCategory: string;
    onSelectCategory: (id: string) => void;
}

export function CategorySidebar({
    categories,
    activeCategory,
    onSelectCategory,
}: CategorySidebarProps) {
    return (
        <div className="w-80 flex flex-col bg-bg-secondary rounded-[2.5rem] border border-border shadow-premium overflow-hidden">
            <div className="p-6 border-b border-border/50">
                <h2 className="text-xl font-brand font-black text-text-primary mb-4">Catégories</h2>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-primary text-text-primary rounded-2xl font-bold hover:bg-brand-primary/90 transition-all">
                    <Plus className="w-5 h-5" />
                    Nouvelle Catégorie
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {categories.length === 0 && (
                    <p className="text-sm text-text-muted p-4 text-center">Aucune catégorie. Créez-en une pour commencer.</p>
                )}
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => onSelectCategory(cat.id)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                            activeCategory === cat.id
                                ? 'bg-brand-primary/10 border-brand-primary text-brand-primary'
                                : 'bg-bg-tertiary border-transparent text-text-secondary hover:bg-bg-tertiary/80'
                        } border`}
                    >
                        <span className="font-bold">{cat.name}</span>
                        <GripVertical className="w-4 h-4 opacity-30" />
                    </button>
                ))}
            </div>
        </div>
    );
}
