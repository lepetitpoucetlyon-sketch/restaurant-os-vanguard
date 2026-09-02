'use client';

import { useMemo, useState } from 'react';
import { X, Ban, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/ui.foundations';
import { useRecipes } from '../../../providers/hooks/kitchenHooks';
import { useAuth } from '@/infrastructure/auth/hooks/useAuth';
import { EightysixtService } from '../services/EightysixtService';

interface Props {
    open: boolean;
    onClose: () => void;
    tenantId?: string;
}

interface IngredientRef {
    ingredientId: string;
    name: string;
    dishCount: number;
}

/**
 * Panneau « 86 » — le chef marque un ingrédient en rupture ; EightysixtService
 * désactive en cascade toutes les recettes qui l'utilisent (émet
 * `ops.ingredient_eightysixted`, consommé par le KDS pour le grisage temps réel).
 */
export function KDSEightysixPanel({ open, onClose, tenantId }: Props) {
    const { data: recipes } = useRecipes();
    const { currentUser } = useAuth();
    const [filter, setFilter] = useState('');
    const [pendingId, setPendingId] = useState<string | null>(null);

    const ingredients = useMemo<IngredientRef[]>(() => {
        const map = new Map<string, IngredientRef>();
        for (const recipe of recipes ?? []) {
            for (const ing of recipe.ingredients ?? []) {
                const key = ing.ingredientId || ing.name;
                if (!key) continue;
                const existing = map.get(key);
                if (existing) existing.dishCount += 1;
                else map.set(key, { ingredientId: key, name: ing.name || key, dishCount: 1 });
            }
        }
        return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
    }, [recipes]);

    const shown = filter
        ? ingredients.filter(i => i.name.toLowerCase().includes(filter.toLowerCase()))
        : ingredients;

    if (!open) return null;

    const doEightysix = async (ing: IngredientRef) => {
        if (!tenantId) { toast.error('Contexte établissement absent'); return; }
        setPendingId(ing.ingredientId);
        try {
            const res = await EightysixtService.eightysix({
                tenantId,
                ingredientId: ing.ingredientId,
                ingredientName: ing.name,
                blockedBy: currentUser?.id ?? 'kds',
            });
            toast.warning(
                res.affectedDishes.length === 0
                    ? `${ing.name} en 86 — aucun plat impacté`
                    : `${ing.name} en 86 — ${res.affectedDishes.length} plat(s) retiré(s) : ${res.affectedDishes.map(d => d.name).join(', ')}`,
            );
            onClose();
        } catch {
            toast.error(`Impossible de mettre ${ing.name} en 86`);
        } finally {
            setPendingId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label="Mettre un ingrédient en 86">
            <div className="w-full max-w-md rounded-2xl border border-border-default bg-surface-card p-5 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                        <Ban className="h-5 w-5 text-error" /> Mettre en 86
                    </h2>
                    <button type="button" onClick={onClose} aria-label="Fermer" className="text-text-muted hover:text-text-primary">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <input
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    placeholder="Filtrer un ingrédient…"
                    className="w-full mb-3 rounded-lg border border-border-default bg-surface-bg px-3 py-2 text-sm"
                />

                <div className="max-h-80 overflow-auto -mx-1">
                    {shown.length === 0 && (
                        <p className="px-2 py-6 text-center text-sm text-text-muted italic">
                            {ingredients.length === 0 ? 'Aucune recette avec ingrédients' : 'Aucun résultat'}
                        </p>
                    )}
                    {shown.map(ing => (
                        <button
                            key={ing.ingredientId}
                            type="button"
                            disabled={pendingId !== null}
                            onClick={() => doEightysix(ing)}
                            className={cn(
                                'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm',
                                'hover:bg-error/10 disabled:opacity-40',
                            )}
                        >
                            <span className="text-text-primary">{ing.name}</span>
                            <span className="flex items-center gap-2 text-xs text-text-muted">
                                {ing.dishCount} plat(s)
                                {pendingId === ing.ingredientId && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
