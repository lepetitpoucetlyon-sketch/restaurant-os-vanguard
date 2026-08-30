'use client';

import React, { useState } from 'react';
import { Sparkles, Layers } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { compileStudyToBlueprintProposal } from '@/verticals/_shared/forge/StudyToBlueprintCompiler';
import type { SectorStudy } from '@/verticals/_shared/blueprint/SectorStudy';

const SAMPLE_STUDIES: Record<string, SectorStudy> = {
  restaurant: {
    vertical: "restaurant",
    summary: "Restauration Traditionnelle & Brasserie",
    workflows: [
      { id: "wf_pos", label: "Prise de commande & envoi cuisine", description: "Flux direct de prise de commande", capabilities: ["mod_pos", "mod_kds"], emits: ["order.placed", "order.sent_to_kitchen"] },
      { id: "wf_haccp", label: "Contrôle sanitaire & DLC", description: "Relevés de températures et hygiène", capabilities: ["mod_haccp"], emits: ["haccp.temp_logged"] },
      { id: "wf_stock", label: "Déstockage recette", description: "Décompte automatique des ingrédients", capabilities: ["mod_inventory"], emits: ["stock.deducted"] },
    ],
    regulations: [
      { id: "reg_nf525", label: "Scellage fiscal NF525", description: "Archivage légal et scellage en chaîne" },
    ],
    hardware: [
      { kind: "kitchen_printer", label: "Imprimante cuisine", rationale: "Bons de fabrication" },
    ],
    kpis: [{ id: "kpi_revpash", label: "RevPASH", unit: "€/siège/h", description: "Revenu par siège disponible" }],
    businessRules: ["Pas de stock négatif", "Clôture journalière obligatoire"],
    integrations: ["Pennylane", "Stripe"],
  },
  bakery: {
    vertical: "bakery",
    summary: "Boulangerie-Pâtisserie Artisanale",
    workflows: [
      { id: "wf_counter", label: "Vente comptoir rapide", description: "Encaissement haute cadence", capabilities: ["mod_pos", "mod_inventory"], emits: ["sale.completed"] },
      { id: "wf_bake", label: "Fournées & planning pétrin", description: "Gestion des pesées", capabilities: ["mod_kitchen_management"], emits: ["batch.baked"] },
    ],
    regulations: [
      { id: "reg_allergens", label: "Affichage allergènes INCO", description: "Traçabilité farine et fruits à coque" },
    ],
    hardware: [
      { kind: "card_terminal", label: "Terminal TPE", rationale: "Vente rapide" },
    ],
    kpis: [{ id: "kpi_waste", label: "Taux d'invendus", unit: "%", description: "Pertes journalières" }],
    businessRules: ["Traçabilité lots farine"],
    integrations: ["Stripe"],
  },
  hotel: {
    vertical: "hotel",
    summary: "Hôtellerie & Hébergement Tourisme",
    workflows: [
      { id: "wf_folio", label: "Facturation chambre & extras", description: "Liaison PMS / Resto", capabilities: ["mod_pms", "mod_pos"], emits: ["folio.charged"] },
    ],
    regulations: [
      { id: "reg_police", label: "Fiches de police", description: "Enregistrement légal des voyageurs" },
    ],
    hardware: [
      { kind: "card_terminal", label: "Terminal réception", rationale: "Check-in / Check-out" },
    ],

    kpis: [{ id: "kpi_revpar", label: "RevPAR", unit: "€/chambre", description: "Revenu par chambre disponible" }],
    businessRules: ["Garantie bancaire pré-autorisation"],
    integrations: ["Mews", "Opera"],
  },
};

export function ForgeStudioTab() {
  const [selectedSector, setSelectedSector] = useState<string>('restaurant');
  const study = SAMPLE_STUDIES[selectedSector] ?? SAMPLE_STUDIES.restaurant;

  const proposal = compileStudyToBlueprintProposal({
    study,
    slug: selectedSector,
    className: `${selectedSector.charAt(0).toUpperCase() + selectedSector.slice(1)}Vertical`,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-surface-card border border-border-default backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
              Forge Stack P3 • Studio & Compilateur
            </span>
          </div>
          <h2 className="text-xl font-black text-text-primary">Studio de Morphogenèse & Compilateur Blueprint</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Compilation déterministe d'une étude sectorielle vers un Blueprint universel (Axe A & Axe B).
          </p>
        </div>

        <div className="flex gap-2">
          {Object.keys(SAMPLE_STUDIES).map((k) => (
            <button
              key={k}
              onClick={() => setSelectedSector(k)}
              className={cn(
                "px-4 py-2 rounded-2xl text-xs font-bold uppercase transition-all",
                selectedSector === k
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                  : "bg-surface-glass text-text-muted hover:text-text-primary"
              )}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Compilateur & Blueprint Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Study View */}
        <div className="p-6 rounded-3xl bg-surface-card border border-border-default space-y-4">
          <div className="flex items-center gap-3 border-b border-border-default pb-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-primary">{study.summary}</h3>
              <p className="text-xs text-text-muted font-mono">Verticale : {study.vertical}</p>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-micro font-bold text-text-muted uppercase tracking-wider">Workflows Sectoriels Identifiés</span>
            <div className="space-y-2">
              {study.workflows.map((wf) => (
                <div key={wf.id} className="p-3 rounded-2xl bg-surface-glass border border-border-default text-xs">
                  <div className="flex items-center justify-between font-bold text-text-primary mb-1">
                    <span>{wf.label}</span>
                    <span className="text-nano font-mono text-text-muted">{wf.id}</span>
                  </div>
                  <p className="text-text-secondary text-micro mb-2">{wf.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {wf.capabilities.map((c) => (
                      <span key={c} className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-nano font-mono">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Compiled Proposal */}
        <div className="p-6 rounded-3xl bg-surface-card border border-border-default space-y-4">
          <div className="flex items-center gap-3 border-b border-border-default pb-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-primary">Blueprint Compilé & Suggestions</h3>
              <p className="text-xs text-text-muted">Sortie StudyToBlueprintCompiler (Axe A)</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-micro font-bold text-text-muted uppercase tracking-wider block mb-2">
                Capabilities Activées ({Object.keys(proposal.capabilities).length})
              </span>
              <div className="flex flex-wrap gap-2">
                {Object.keys(proposal.capabilities).map((cap) => (
                  <span key={cap} className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
                    ✓ {cap}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-micro font-bold text-text-muted uppercase tracking-wider block mb-2">
                Événements Métier Générés ({proposal.events.length})
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {proposal.events.map((ev, idx) => (
                  <div key={idx} className="p-2 rounded-xl bg-surface-glass border border-border-default flex items-center justify-between text-xs">
                    <span className="font-mono text-amber-400">{ev.name}</span>
                    <span className="text-nano text-text-muted">{ev.description}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-surface-glass border border-border-default text-micro text-text-secondary space-y-1">
              <span className="font-bold text-text-primary block">Justifications de Morphogenèse :</span>
              {proposal.rationale.slice(0, 3).map((r, i) => (
                <p key={i}>• {r}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
