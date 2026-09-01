'use client';

import React, { useState } from 'react';
import { Package, Search, Plus, Tag, Barcode, Layers, ArrowUpDown, SlidersHorizontal } from 'lucide-react';
import { useTenant } from '@/shared/hooks/useTenant';

interface CatalogItem {
  id: string;
  sku: string;
  ean: string;
  name: string;
  category: string;
  variantsCount: number;
  costPriceInMicrounits: number;
  sellingPriceInMicrounits: number;
  totalStock: number;
  marginPercent: number;
}

const INITIAL_CATALOG: CatalogItem[] = [
  { id: 'cat-1', sku: 'TEX-TSH-01', ean: '3700123456789', name: 'T-Shirt Coton Bio Premium', category: 'Textile', variantsCount: 6, costPriceInMicrounits: 9_000_000, sellingPriceInMicrounits: 29_000_000, totalStock: 54, marginPercent: 68.9 },
  { id: 'cat-2', sku: 'TEX-JEA-02', ean: '3700123456802', name: 'Jean Brut Selvedge 14oz', category: 'Textile', variantsCount: 8, costPriceInMicrounits: 42_000_000, sellingPriceInMicrounits: 120_000_000, totalStock: 32, marginPercent: 65.0 },
  { id: 'cat-3', sku: 'SH-SNK-03', ean: '3700123456819', name: 'Sneakers Cuir Minimalistes', category: 'Chaussures', variantsCount: 7, costPriceInMicrounits: 55_000_000, sellingPriceInMicrounits: 145_000_000, totalStock: 21, marginPercent: 62.0 },
  { id: 'cat-4', sku: 'ACC-CAS-04', ean: '3700123456826', name: 'Casquette Visière Broderie', category: 'Accessoires', variantsCount: 3, costPriceInMicrounits: 11_000_000, sellingPriceInMicrounits: 35_000_000, totalStock: 40, marginPercent: 68.5 },
  { id: 'cat-5', sku: 'MAR-SAC-05', ean: '3700123456833', name: 'Sac Week-end Toile & Cuir', category: 'Maroquinerie', variantsCount: 2, costPriceInMicrounits: 65_000_000, sellingPriceInMicrounits: 190_000_000, totalStock: 14, marginPercent: 65.7 },
];

export function CatalogPage() {
  const { activeTenantId } = useTenant();
  const [items, setItems] = useState<CatalogItem[]>(INITIAL_CATALOG);
  const [search, setSearch] = useState('');

  const filtered = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.sku.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{"📦"}</span>
            <h1 className="text-xl font-bold font-serif">{"Catalogue Produits & Matrice de Variantes"}</h1>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {"Gestion des fiches articles, matrices taille/couleur, codes EAN13 et marges commerciales."}
          </p>
        </div>

        <button
          onClick={() => alert("Ouverture du formulaire de création d'article...")}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          {"Nouvel article"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-pink-500" />
            {"Références actives"}
          </p>
          <p className="text-2xl font-bold font-mono text-pink-600">{items.length}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            {"SKUs variantes"}
          </p>
          <p className="text-2xl font-bold font-mono">
            {items.reduce((s, it) => s + it.variantsCount, 0)}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-500" />
            {"Marge moyenne"}
          </p>
          <p className="text-2xl font-bold font-mono text-emerald-600">{"66.0 %"}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Barcode className="w-3.5 h-3.5 text-purple-500" />
            {"Unités en stock"}
          </p>
          <p className="text-2xl font-bold font-mono">
            {items.reduce((s, it) => s + it.totalStock, 0)}
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par référence, SKU, EAN ou catégorie..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface-card text-xs focus:border-pink-500 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-base/60 text-text-muted uppercase font-medium border-b border-border text-[10px]">
              <tr>
                <th className="py-3 px-4">{"Article / Modèle"}</th>
                <th className="py-3 px-4">{"SKU Maître"}</th>
                <th className="py-3 px-4">{"Rayon"}</th>
                <th className="py-3 px-4 text-center">{"Variantes"}</th>
                <th className="py-3 px-4 text-right">{"Prix Achat HT"}</th>
                <th className="py-3 px-4 text-right">{"Prix Vente TTC"}</th>
                <th className="py-3 px-4 text-center">{"Marge"}</th>
                <th className="py-3 px-4 text-center">{"Stock global"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map(it => {
                const costEur = (it.costPriceInMicrounits / 1_000_000).toFixed(2);
                const sellEur = (it.sellingPriceInMicrounits / 1_000_000).toFixed(2);

                return (
                  <tr key={it.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-text-primary">
                      {it.name}
                      <span className="block font-mono text-[10px] text-text-muted font-normal">{it.ean}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-text-muted">{it.sku}</td>
                    <td className="py-3 px-4 text-text-secondary">{it.category}</td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span className="px-2 py-0.5 rounded bg-surface-base border border-border">
                        {it.variantsCount} {"tailles/col."}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">{costEur} {"€"}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-text-primary">{sellEur} {"€"}</td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-emerald-600">
                      {it.marginPercent.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-semibold">
                      {it.totalStock}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
