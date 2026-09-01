"use client";

import React from "react";
import { GlassWater, Plus, Trash2 } from "lucide-react";
import type { ServingMethod } from "@nexus/contracts";

interface ProductBarFieldsProps {
  baseSpirit: string;
  setBaseSpirit: (val: string) => void;
  mixersInput: string[];
  setMixersInput: React.Dispatch<React.SetStateAction<string[]>>;
  newMixerInput: string;
  setNewMixerInput: (val: string) => void;
  garnish: string;
  setGarnish: (val: string) => void;
  servingMethod: ServingMethod;
  setServingMethod: (val: ServingMethod) => void;
  glassType: string;
  setGlassType: (val: string) => void;
}

export function ProductBarFields({
  baseSpirit,
  setBaseSpirit,
  mixersInput,
  setMixersInput,
  newMixerInput,
  setNewMixerInput,
  garnish,
  setGarnish,
  servingMethod,
  setServingMethod,
  glassType,
  setGlassType,
}: ProductBarFieldsProps) {
  return (
    <div className="space-y-4 pt-4 border-t border-subtle">
      <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider">
        <GlassWater className="w-4 h-4" /> Spécificités Bar &amp; Cocktails
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            Alcool de base (Spiritueux)
          </label>
          <input
            type="text"
            value={baseSpirit}
            onChange={(e) => setBaseSpirit(e.target.value)}
            className="w-full h-10 px-3 bg-surface-card border border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-amber-500 transition-colors"
            placeholder="ex: Gin, Vodka, Rhum blanc..."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            Méthode de service
          </label>
          <select
            value={servingMethod}
            onChange={(e) => setServingMethod(e.target.value as ServingMethod)}
            className="w-full h-10 px-3 bg-surface-card border border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-amber-500 transition-colors"
          >
            <option value="built">Direct au verre (Built)</option>
            <option value="shaken">Shaké (Shaken)</option>
            <option value="stirred">Mélangé au verre à mélange (Stirred)</option>
            <option value="blended">Mixé / Blended</option>
            <option value="layered">Etagé (Layered)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            Type de verre
          </label>
          <input
            type="text"
            value={glassType}
            onChange={(e) => setGlassType(e.target.value)}
            className="w-full h-10 px-3 bg-surface-card border border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-amber-500 transition-colors"
            placeholder="ex: Verre Highball, Coupe à cocktail, Tumbler..."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            Garniture (Garnish)
          </label>
          <input
            type="text"
            value={garnish}
            onChange={(e) => setGarnish(e.target.value)}
            className="w-full h-10 px-3 bg-surface-card border border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-amber-500 transition-colors"
            placeholder="ex: Zeste de citron, Brin de menthe, Olive..."
          />
        </div>
      </div>

      {/* Mixers list */}
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">
          Dilluants &amp; Mixers
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newMixerInput}
            onChange={(e) => setNewMixerInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (newMixerInput.trim()) {
                  setMixersInput((prev) => [...prev, newMixerInput.trim()]);
                  setNewMixerInput("");
                }
              }
            }}
            className="flex-1 h-9 px-3 bg-surface-card border border-subtle rounded-lg text-xs text-text-primary focus:outline-none focus:border-amber-500 transition-colors"
            placeholder="Ajouter un mixer (ex: Tonic, Ginger Beer) et appuyer Entrée"
          />
          <button
            type="button"
            onClick={() => {
              if (newMixerInput.trim()) {
                setMixersInput((prev) => [...prev, newMixerInput.trim()]);
                setNewMixerInput("");
              }
            }}
            className="px-3 h-9 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Ajouter
          </button>
        </div>

        {mixersInput.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {mixersInput.map((mx, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-surface-card border border-subtle rounded-md text-xs text-text-primary flex items-center gap-1.5"
              >
                {mx}
                <button
                  type="button"
                  onClick={() => setMixersInput((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-text-tertiary hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
