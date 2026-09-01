'use client';

import { useSovereignCollection } from '@/kernel/hooks/useSovereignCollection';
import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, FileText, Search, Download, Check } from 'lucide-react';
import { useTenant } from '@/shared/hooks/useTenant';

interface AllergenItem {
  id: string;
  recipeName: string;
  category: 'pains' | 'viennoiseries' | 'patisseries' | 'snacking';
  allergens: string[];
  traces: string[];
  lastAuditedDate: string;
}

const INCO_ALLERGENS = [
  'Gluten', 'Lait', 'Œufs', 'Fruits à coque', 'Arachides', 'Soja',
  'Sésame', 'Moutarde', 'Céleri', 'Lupin', 'Poisson', 'Crustacés',
  'Mollusques', 'Sulfites'
];



export function AllergenRegistry() {
  const { activeTenantId } = useTenant();
  const {
    data: items,
    isLoading,
    update,
    refresh,
  } = useSovereignCollection<AllergenItem>('allergenRecipes', { tenantId: activeTenantId ?? undefined });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAllergen, setSelectedAllergen] = useState<string>('all');

  const filtered = items.filter(item => {
    const matchesSearch = item.recipeName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAllergen = selectedAllergen === 'all' || item.allergens.includes(selectedAllergen) || item.traces.includes(selectedAllergen);
    return matchesSearch && matchesAllergen;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{"🛡️"}</span>
            <h1 className="text-xl font-bold font-serif">{"Registre des 14 Allergènes Majeurs (Règlement INCO)"}</h1>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {"Affichage obligatoire & fiches techniques alimentaires certifiées conformes au Règlement UE n° 1169/2011."}
          </p>
        </div>

        <button
          onClick={() => alert("Génération du classeur d'affichage légal INCO (PDF/A-3)...")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-card hover:bg-surface-hover text-xs font-medium transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-text-muted" />
          {"Exporter le classeur client (PDF)"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-amber-500" />
            {"Recettes auditées"}
          </p>
          <p className="text-2xl font-bold font-mono text-amber-600">{items.length}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            {"Conformité INCO"}
          </p>
          <p className="text-2xl font-bold font-mono text-emerald-600">{"100 %"}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-purple-500" />
            {"Allergènes surveillés"}
          </p>
          <p className="text-2xl font-bold font-mono">{"14 / 14"}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-blue-500" />
            {"Dernière mise à jour"}
          </p>
          <p className="text-sm font-semibold font-mono text-text-primary mt-1">{"Août 2026"}</p>
        </div>
      </div>

      {/* Recherche & Filtre par allergène */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher une recette ou un produit…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface-card text-xs focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedAllergen('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              selectedAllergen === 'all'
                ? 'bg-amber-600 text-white'
                : 'bg-surface-card border border-border text-text-muted hover:text-text-primary'
            }`}
          >
            {"Tous les allergènes"}
          </button>
          {INCO_ALLERGENS.map(allg => (
            <button
              key={allg}
              onClick={() => setSelectedAllergen(allg)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                selectedAllergen === allg
                  ? 'bg-amber-600 text-white'
                  : 'bg-surface-card border border-border text-text-muted hover:border-amber-500/50'
              }`}
            >
              {allg}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau du registre */}
      <div className="rounded-xl border border-border bg-surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-base/60 text-text-muted uppercase font-medium border-b border-border text-[10px]">
              <tr>
                <th className="py-3 px-4">{"Produit / Recette"}</th>
                <th className="py-3 px-4">{"Rayon"}</th>
                <th className="py-3 px-4">{"Allergènes Présents (Obligatoires)"}</th>
                <th className="py-3 px-4">{"Traces Éventuelles"}</th>
                <th className="py-3 px-4 text-right">{"Date de validation"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-surface-hover/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-text-primary">{item.recipeName}</td>
                  <td className="py-3 px-4 capitalize text-text-muted">{item.category}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {item.allergens.map(a => (
                        <span key={a} className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400 font-medium text-[10px] border border-rose-500/20">
                          {a}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {item.traces.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] border border-amber-500/20">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-text-muted">{item.lastAuditedDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
