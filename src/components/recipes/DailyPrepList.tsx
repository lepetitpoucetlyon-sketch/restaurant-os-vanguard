'use client';

/**
 * DailyPrepList — cui-5
 * Computes today's ingredient prep quantities from reservations and displays a
 * synced checklist. Checked state persists to Nexus 'prepTasks/{todayDate}'.
 */

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckSquare, Square, RefreshCw, Users, ChefHat, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/ui.foundations';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { Reservation, Recipe } from '@nexus/contracts';
import { fadeInUp, cinematicContainer, cinematicItem } from '@/lib/motion';
import { smartQuantity } from './recipeUtils';
import { useNotifications } from '@/context/NotificationsContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PrepItem {
  key: string; // "{recipeId}-{ingredientId}-{index}"
  ingredientName: string;
  ingredientId: string;
  scaledQty: number;
  scaledUnit: string;
  displayQty: string;
  displayUnit: string;
  recipeId: string;
  recipeName: string;
}

interface PrepTaskDoc {
  date: string;
  checkedKeys: string[];
  totalCovers: number;
  updatedAt: string;
}

// ─── Build prep items ────────────────────────────────────────────────────────

function buildPrepItems(recipes: Recipe[], covers: number): PrepItem[] {
  const items: PrepItem[] = [];
  for (const recipe of recipes) {
    const basePortions = Math.max(1, recipe.portions || 1);
    const scale = covers / basePortions;
    const recipeId = String((recipe as { id?: string }).id ?? '');

    (recipe.ingredients ?? []).forEach((ing, idx) => {
      const scaledQty = Number(ing.quantity || 0) * scale;
      const { value, unit } = smartQuantity(scaledQty, ing.unit);
      items.push({
        key: `${recipeId}-${ing.ingredientId}-${idx}`,
        ingredientName: ing.name,
        ingredientId: ing.ingredientId,
        scaledQty,
        scaledUnit: unit,
        displayQty: value,
        displayUnit: unit,
        recipeId,
        recipeName: String(recipe.name),
      });
    });
  }
  return items;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DailyPrepListProps {
  /** Active recipes used to compute ingredient quantities. */
  recipes: Recipe[];
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DailyPrepList({ recipes, className }: DailyPrepListProps) {
  const todayISO = format(new Date(), 'yyyy-MM-dd');
  const todayLabel = format(new Date(), 'EEEE d MMMM yyyy', { locale: fr });

  const [totalCovers, setTotalCovers] = useState(0);
  const [prepItems, setPrepItems] = useState<PrepItem[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { addNotification } = useNotifications();

  // Rebuild prep list when covers or recipes change
  const rebuild = useCallback(
    (covers: number) => {
      if (covers <= 0) {
        setPrepItems([]);
        return;
      }
      setPrepItems(buildPrepItems(recipes, covers));
    },
    [recipes],
  );

  // Initial load: fetch reservations + saved state
  useEffect(() => {
    let alive = true;

    async function load() {
      setIsLoading(true);
      try {
        const [reservations, savedDoc] = await Promise.all([
          Nexus.adapter.query<Reservation>('reservations', {
            where: [{ field: 'date', operator: '==', value: todayISO }],
          }),
          Nexus.adapter.get<PrepTaskDoc>(`prepTasks/${todayISO}`),
        ]);

        const covers = reservations
          .filter(r => r.status !== 'cancelled' && r.status !== 'no_show')
          .reduce((sum, r) => sum + (r.covers ?? r.partySize ?? 0), 0);

        const savedChecked = new Set<string>(savedDoc?.checkedKeys ?? []);

        if (alive) {
          setTotalCovers(covers);
          rebuild(covers);
          setCheckedKeys(savedChecked);
        }
      } catch (err) {
        console.error('[DailyPrepList] load error:', err);
      } finally {
        if (alive) setIsLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [todayISO, rebuild]);

  // Toggle a prep item and persist
  async function toggleItem(itemKey: string) {
    const next = new Set(checkedKeys);
    if (next.has(itemKey)) {
      next.delete(itemKey);
    } else {
      next.add(itemKey);
    }
    setCheckedKeys(next);

    setIsSaving(true);
    try {
      await Nexus.adapter.set<PrepTaskDoc>(
        `prepTasks/${todayISO}`,
        {
          date: todayISO,
          checkedKeys: Array.from(next),
          totalCovers,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch (err) {
      console.error('[DailyPrepList] save error:', err);
      addNotification({ type: 'critical', title: 'Erreur', message: 'Impossible d\'enregistrer la liste de préparation.' });
    } finally {
      setIsSaving(false);
    }
  }

  const checkedCount = prepItems.filter(it => checkedKeys.has(it.key)).length;
  const progress = prepItems.length > 0 ? (checkedCount / prepItems.length) * 100 : 0;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <motion.div
      variants={cinematicContainer}
      initial="hidden"
      animate="visible"
      className={cn('w-full', className)}
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-serif font-semibold text-text-primary tracking-tight">
            Mise en Prep du Jour
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Calendar className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />
            <p className="text-text-muted text-[12px] font-medium capitalize">{todayLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isSaving && (
            <RefreshCw className="w-4 h-4 text-text-muted animate-spin" strokeWidth={1.5} />
          )}
          <div className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border rounded-xl">
            <Users className="w-4 h-4 text-accent" strokeWidth={1.5} />
            <span className="text-[13px] font-black text-text-primary">
              {totalCovers} couvert{totalCovers !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Progress bar */}
      {prepItems.length > 0 && (
        <motion.div variants={fadeInUp} className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
              Progression
            </span>
            <span className="text-[11px] font-mono font-black text-text-primary">
              {checkedCount} / {prepItems.length}
            </span>
          </div>
          <div className="h-2 bg-bg-tertiary/40 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={cn(
                'h-full rounded-full transition-colors',
                progress === 100 ? 'bg-success' : 'bg-accent',
              )}
            />
          </div>
        </motion.div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="w-7 h-7 text-text-muted animate-spin" strokeWidth={1.5} />
        </div>
      )}

      {/* Empty states */}
      {!isLoading && totalCovers === 0 && (
        <motion.div
          variants={fadeInUp}
          className="flex flex-col items-center justify-center py-20 bg-bg-secondary rounded-2xl border border-border text-center"
        >
          <Users className="w-12 h-12 text-text-muted mb-4" strokeWidth={1} />
          <p className="font-serif text-xl text-text-primary mb-2">Aucune réservation aujourd'hui</p>
          <p className="text-text-muted text-[13px]">
            Les réservations confirmées apparaîtront ici.
          </p>
        </motion.div>
      )}

      {!isLoading && totalCovers > 0 && prepItems.length === 0 && (
        <motion.div
          variants={fadeInUp}
          className="flex flex-col items-center justify-center py-20 bg-bg-secondary rounded-2xl border border-border text-center"
        >
          <ChefHat className="w-12 h-12 text-text-muted mb-4" strokeWidth={1} />
          <p className="font-serif text-xl text-text-primary mb-2">Aucun ingrédient à préparer</p>
          <p className="text-text-muted text-[13px]">
            Ajoutez des recettes avec des ingrédients pour voir la liste.
          </p>
        </motion.div>
      )}

      {/* Prep checklist */}
      {!isLoading && prepItems.length > 0 && (
        <div className="space-y-2.5">
          <AnimatePresence initial={false}>
            {prepItems.map(item => {
              const isChecked = checkedKeys.has(item.key);

              return (
                <motion.div
                  key={item.key}
                  variants={cinematicItem}
                  layout
                  onClick={() => toggleItem(item.key)}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-xl border cursor-pointer',
                    'transition-all duration-300 group select-none',
                    isChecked
                      ? 'bg-success/5 border-success/20 opacity-60'
                      : 'bg-bg-secondary border-border hover:border-accent/30 hover:bg-bg-tertiary/20',
                  )}
                >
                  {/* Checkbox icon */}
                  <div
                    className={cn(
                      'w-5 h-5 shrink-0 transition-colors',
                      isChecked ? 'text-success' : 'text-text-muted group-hover:text-accent',
                    )}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-5 h-5" strokeWidth={2} />
                    ) : (
                      <Square className="w-5 h-5" strokeWidth={1.5} />
                    )}
                  </div>

                  {/* Ingredient info */}
                  <div className="flex-1 min-w-0">
                    <span
                      className={cn(
                        'font-medium text-[14px] text-text-primary block transition-all',
                        isChecked && 'line-through text-text-muted',
                      )}
                    >
                      {item.ingredientName}
                    </span>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5 truncate">
                      {item.recipeName}
                    </p>
                  </div>

                  {/* Quantity */}
                  <div className="flex items-baseline gap-1 shrink-0">
                    <span className="text-[15px] font-mono font-black text-text-primary">
                      {item.displayQty}
                    </span>
                    <span className="text-[10px] font-bold text-text-muted uppercase">
                      {item.displayUnit}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
