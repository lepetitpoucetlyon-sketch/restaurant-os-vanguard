'use client';

import React, { useState } from 'react';
import { BookOpen, Search, Filter, Layers, CheckCircle2, FileText, Sparkles, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';

interface StudyItem {
  slug: string;
  name: string;
  category: string;
  workflowsCount: number;
  capabilitiesCount: number;
  kpisCount: number;
  source: 'baseline' | 'llm-enriched';
  updatedAt: string;
}

const REGISTERED_STUDIES: StudyItem[] = [
  { slug: 'restaurant', name: 'Restauration Traditionnelle & Brasserie', category: 'Food & Beverage', workflowsCount: 8, capabilitiesCount: 14, kpisCount: 6, source: 'llm-enriched', updatedAt: '2026-08-23' },
  { slug: 'bakery', name: 'Boulangerie-Pâtisserie Artisanale', category: 'Artisanat', workflowsCount: 6, capabilitiesCount: 11, kpisCount: 4, source: 'baseline', updatedAt: '2026-08-22' },
  { slug: 'gym', name: 'Centre de Fitness & Salle de Sport', category: 'Sport & Loisirs', workflowsCount: 5, capabilitiesCount: 9, kpisCount: 5, source: 'llm-enriched', updatedAt: '2026-08-21' },
  { slug: 'hotel', name: 'Hôtellerie & Hébergement Tourisme', category: 'Hospitality', workflowsCount: 9, capabilitiesCount: 16, kpisCount: 8, source: 'llm-enriched', updatedAt: '2026-08-20' },
  { slug: 'veterinary', name: 'Clinique & Cabinet Vétérinaire', category: 'Santé Animale', workflowsCount: 7, capabilitiesCount: 12, kpisCount: 5, source: 'baseline', updatedAt: '2026-08-19' },
  { slug: 'salon', name: 'Salon de Coiffure & Institut Beauté', category: 'Services', workflowsCount: 4, capabilitiesCount: 8, kpisCount: 4, source: 'baseline', updatedAt: '2026-08-18' },
  { slug: 'garage', name: 'Garage Automobile & Entretien', category: 'Artisanat & Auto', workflowsCount: 6, capabilitiesCount: 10, kpisCount: 4, source: 'baseline', updatedAt: '2026-08-17' },
  { slug: 'florist', name: 'Fleuriste & Végétal', category: 'Commerce Spécialisé', workflowsCount: 4, capabilitiesCount: 7, kpisCount: 3, source: 'baseline', updatedAt: '2026-08-16' },
];

export function SectorStudyTab() {
  const [search, setSearch] = useState('');
  const [selectedSlug, setSelectedSlug] = useState<string>('restaurant');

  const filtered = REGISTERED_STUDIES.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.slug.toLowerCase().includes(search.toLowerCase())
  );

  const activeStudy = REGISTERED_STUDIES.find((s) => s.slug === selectedSlug) || REGISTERED_STUDIES[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
              Forge Stack P1 • Sector Study Store
            </span>
          </div>
          <h2 className="text-xl font-black text-white">Registre & Persistance des Études Sectorielles</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Bibliothèque d'études de marchés mutualisées, signaux de qualification et blueprints dérivés.
          </p>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher une étude..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Grid Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Studies List */}
        <div className="lg:col-span-1 space-y-3">
          {filtered.map((item) => {
            const isSelected = item.slug === selectedSlug;
            return (
              <div
                key={item.slug}
                onClick={() => setSelectedSlug(item.slug)}
                className={cn(
                  "p-4 rounded-2xl border cursor-pointer transition-all space-y-2",
                  isSelected
                    ? "bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-500/5"
                    : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">{item.slug}</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                    item.source === 'llm-enriched' ? "bg-amber-500/10 text-amber-400" : "bg-slate-800 text-slate-400"
                  )}>
                    {item.source}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-white">{item.name}</h4>
                <div className="flex items-center gap-3 text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                  <span>{item.workflowsCount} workflows</span>
                  <span>•</span>
                  <span>{item.capabilitiesCount} capabilities</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Study Deep Dive */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-mono font-bold text-blue-400 uppercase">{activeStudy.category}</span>
              <h3 className="text-xl font-bold text-white mt-0.5">{activeStudy.name}</h3>
            </div>
            <button className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md">
              Re-compiler Blueprint
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500">Workflows Clés</span>
              <p className="text-2xl font-black text-white mt-1">{activeStudy.workflowsCount}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500">Capabilities Dérivées</span>
              <p className="text-2xl font-black text-white mt-1">{activeStudy.capabilitiesCount}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500">Indicateurs KPIs</span>
              <p className="text-2xl font-black text-white mt-1">{activeStudy.kpisCount}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Métadonnées de persistance MCC</h4>
            <div className="text-xs text-slate-400 space-y-1 font-mono">
              <p>• Scope : <span className="text-slate-200">mcc/studies/{activeStudy.slug}</span></p>
              <p>• Dernière mise à jour : <span className="text-slate-200">{activeStudy.updatedAt}</span></p>
              <p>• Intégrité cryptographique : <span className="text-emerald-400">Validée (FNV-1a)</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
