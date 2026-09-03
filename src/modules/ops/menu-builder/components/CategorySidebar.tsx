"use client";

import { useState } from "react";
import { Plus, GripVertical, Check, X } from "lucide-react";
import type { Category } from "@nexus/contracts";
import { useLanguage } from "@/shared/hooks";

interface CategorySidebarProps {
    categories: Category[];
    activeCategory: string;
    onSelectCategory: (id: string) => void;
    onCreateCategory: (name: string) => void | Promise<void>;
}

export function CategorySidebar({
    categories,
    activeCategory,
    onSelectCategory,
    onCreateCategory,
}: CategorySidebarProps) {
    const { t } = useLanguage();
    // Saisie en place plutôt qu'une fenêtre : créer une catégorie tient en un mot,
    // et l'écran de carte se manipule souvent sur tablette en plein service.
    const [isNaming, setIsNaming] = useState(false);
    const [draftName, setDraftName] = useState("");

    const commit = async () => {
        const name = draftName.trim();
        if (!name) return;
        await onCreateCategory(name);
        setDraftName("");
        setIsNaming(false);
    };

    const cancel = () => {
        setDraftName("");
        setIsNaming(false);
    };

    return (
        <div className="w-80 flex flex-col bg-bg-secondary rounded-[2.5rem] border border-border shadow-premium overflow-hidden">
            <div className="p-6 border-b border-border/50">
                <h2 className="text-xl font-brand font-black text-text-primary mb-4">{t('menu.categories')}</h2>

                {isNaming ? (
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={draftName}
                            onChange={(e) => setDraftName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); void commit(); }
                                if (e.key === 'Escape') { e.preventDefault(); cancel(); }
                            }}
                            placeholder="Nom de la catégorie"
                            aria-label="Nom de la nouvelle catégorie"
                            autoFocus
                            className="flex-1 min-w-0 px-4 py-3 rounded-2xl bg-bg-tertiary border border-border text-text-primary placeholder:text-text-muted focus:border-focus focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => void commit()}
                            disabled={!draftName.trim()}
                            aria-label="Créer la catégorie"
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-2xl bg-brand-primary text-text-primary disabled:opacity-40 transition-all"
                        >
                            <Check className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={cancel}
                            aria-label="Annuler"
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-2xl bg-bg-tertiary border border-border text-text-muted hover:text-text-primary transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setIsNaming(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-primary text-text-primary rounded-2xl font-bold hover:bg-brand-primary/90 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Nouvelle Catégorie
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {categories.length === 0 && (
                    <p className="text-sm text-text-muted p-4 text-center">{t('menu.noCategory')}</p>
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
