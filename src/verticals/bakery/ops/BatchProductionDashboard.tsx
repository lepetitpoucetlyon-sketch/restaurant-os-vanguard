'use client';

import { useSovereignCollection } from '@/kernel/hooks/useSovereignCollection';
import React, { useState } from 'react';
import { Flame, Clock, CheckCircle2, AlertTriangle, Plus, Sparkles, ChefHat } from 'lucide-react';
import { useTenant } from '@/shared/hooks/useTenant';

interface BatchItem {
  id: string;
  recipeName: string;
  category: 'boulangerie' | 'viennoiserie' | 'patisserie';
  quantity: number;
  ovenId: string;
  status: 'kneading' | 'proofing' | 'baking' | 'cooling' | 'ready';
  targetTime: string;
  tempCelsius: number;
}



export function BatchProductionDashboard() {
  const { activeTenantId } = useTenant();
  const {
    data: batches,
    isLoading,
    set,
    update,
    refresh,
  } = useSovereignCollection<BatchItem>('productionBatches', { tenantId: activeTenantId ?? undefined });
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newRecipe, setNewRecipe] = useState('');
  const [newQty, setNewQty] = useState(30);
  const [newCategory, setNewCategory] = useState<'boulangerie' | 'viennoiserie' | 'patisserie'>('boulangerie');

  const filteredBatches = batches.filter(b => filterCategory === 'all' || b.category === filterCategory);

  const activeBakingCount = batches.filter(b => b.status === 'baking').length;
  const proofingCount = batches.filter(b => b.status === 'proofing').length;
  const totalPiecesToday = batches.reduce((acc, b) => acc + b.quantity, 0);

  const handleAdvanceStatus = async (batchId: string) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return;
    const order: BatchItem['status'][] = ['kneading', 'proofing', 'baking', 'cooling', 'ready'];
    const currentIdx = order.indexOf(batch.status);
    if (currentIdx >= order.length - 1) return;   // 'ready' est terminal
    await update(batchId, { status: order[currentIdx + 1] } as Partial<BatchItem>);
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipe) return;
    const newB: BatchItem = {
      id: `b-${Date.now().toString().slice(-4)}`,
      recipeName: newRecipe,
      category: newCategory,
      quantity: newQty,
      ovenId: newCategory === 'patisserie' ? 'Labo Pâtisserie' : 'Four Sole A1',
      status: 'kneading',
      targetTime: '08:30',
      tempCelsius: 24,
    };
    await set(newB);
    setNewRecipe('');
    setIsNewModalOpen(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{"🥐"}</span>
            <h1 className="text-xl font-bold font-serif">{"Fournil & Production par Fournées"}</h1>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {"Planification du pétrissage, pointage, cuisson et ressuage en temps réel."}
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          {"Lancer une fournée"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            {"Au four actuellement"}
          </p>
          <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">{activeBakingCount}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            {"En pousse / apprêt"}
          </p>
          <p className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">{proofingCount}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <ChefHat className="w-3.5 h-3.5 text-emerald-500" />
            {"Pièces produites"}
          </p>
          <p className="text-2xl font-bold font-mono">{totalPiecesToday}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            {"Rendement fournée"}
          </p>
          <p className="text-2xl font-bold font-mono text-emerald-600">{"98.4 %"}</p>
        </div>
      </div>

      {/* Filtres de catégorie */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-3">
        {[
          { id: 'all', label: 'Toutes les fournées' },
          { id: 'boulangerie', label: 'Boulangerie' },
          { id: 'viennoiserie', label: 'Viennoiserie' },
          { id: 'patisserie', label: 'Pâtisserie' },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilterCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterCategory === cat.id
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tableau des fournées */}
      <div className="rounded-xl border border-border bg-surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-base/60 text-text-muted uppercase font-medium border-b border-border text-[10px]">
              <tr>
                <th className="py-3 px-4">{"Recette"}</th>
                <th className="py-3 px-4">{"Catégorie"}</th>
                <th className="py-3 px-4 text-center">{"Quantité"}</th>
                <th className="py-3 px-4">{"Équipement / Four"}</th>
                <th className="py-3 px-4 text-center">{"Cible"}</th>
                <th className="py-3 px-4 text-center">{"Statut"}</th>
                <th className="py-3 px-4 text-right">{"Action"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredBatches.map(batch => {
                const statusStyles: Record<BatchItem['status'], { label: string; bg: string; text: string }> = {
                  kneading: { label: 'Pétrissage', bg: 'bg-zinc-500/10', text: 'text-zinc-600 dark:text-zinc-400' },
                  proofing: { label: 'Pousse (Apprêt)', bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
                  baking: { label: 'Cuisson au four', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
                  cooling: { label: 'Ressuage', bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400' },
                  ready: { label: 'Prêt vitrine', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
                };
                const s = statusStyles[batch.status];

                return (
                  <tr key={batch.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-text-primary flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      {batch.recipeName}
                    </td>
                    <td className="py-3 px-4 capitalize text-text-muted">{batch.category}</td>
                    <td className="py-3 px-4 text-center font-mono font-medium">{batch.quantity} {"pcs"}</td>
                    <td className="py-3 px-4 text-text-muted">{batch.ovenId} ({batch.tempCelsius}°C)</td>
                    <td className="py-3 px-4 text-center font-mono">{batch.targetTime}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium ${s.bg} ${s.text}`}>
                        {s.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {batch.status !== 'ready' ? (
                        <button
                          onClick={() => handleAdvanceStatus(batch.id)}
                          className="px-2.5 py-1 rounded bg-surface-base hover:bg-surface-hover border border-border text-[11px] font-medium transition-colors"
                        >
                          {"Étape suivante →"}
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 flex items-center justify-end gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {"En vitrine"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nouvelle Fournée */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-card border border-border rounded-xl p-5 space-y-4 shadow-xl">
            <h2 className="text-base font-bold font-serif">{"Programmer une nouvelle fournée"}</h2>
            <form onSubmit={handleCreateBatch} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-text-muted mb-1">{"Nom de la recette"}</label>
                <input
                  type="text"
                  value={newRecipe}
                  onChange={e => setNewRecipe(e.target.value)}
                  placeholder="Ex: Baguette Céréales Anciennes"
                  required
                  className="w-full px-3 py-1.5 rounded-md border border-border bg-surface-base text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-text-muted mb-1">{"Catégorie"}</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-md border border-border bg-surface-base text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="boulangerie">{"Boulangerie"}</option>
                    <option value="viennoiserie">{"Viennoiserie"}</option>
                    <option value="patisserie">{"Pâtisserie"}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-text-muted mb-1">{"Nombre de pièces"}</label>
                  <input
                    type="number"
                    value={newQty}
                    onChange={e => setNewQty(Number(e.target.value))}
                    min={1}
                    max={500}
                    className="w-full px-3 py-1.5 rounded-md border border-border bg-surface-base text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-text-muted hover:bg-surface-hover"
                >
                  {"Annuler"}
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium shadow-sm transition-colors"
                >
                  {"Confirmer le lancement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
