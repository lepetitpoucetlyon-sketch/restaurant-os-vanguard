"use client";

import React from "react";
import { Leaf, AlertTriangle } from "lucide-react";
import { PremiumSelect } from "@ui/PremiumSelect";

interface ProductBasicDetailsProps {
  name: string;
  setName: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  categories: string[];
  selectedAllergens: string[];
  setSelectedAllergens: React.Dispatch<React.SetStateAction<string[]>>;
  allergensList: Array<{ id: string; name: string; icon?: string }>;
  isVegetarian: boolean;
  setIsVegetarian: (val: boolean) => void;
  isVegan: boolean;
  setIsVegan: (val: boolean) => void;
  isGlutenFree: boolean;
  setIsGlutenFree: (val: boolean) => void;
  productType: "dish" | "cocktail";
}

export function ProductBasicDetails({
  name,
  setName,
  description,
  setDescription,
  category,
  setCategory,
  categories,
  selectedAllergens,
  setSelectedAllergens,
  allergensList,
  isVegetarian,
  setIsVegetarian,
  isVegan,
  setIsVegan,
  isGlutenFree,
  setIsGlutenFree,
  productType,
}: ProductBasicDetailsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            Nom {productType === "dish" ? "du plat" : "du cocktail"} *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-10 px-3 bg-surface-card border border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-amber-500 transition-colors"
            placeholder={productType === "dish" ? "ex: Burger Gourmet" : "ex: Mojito Passion"}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            Catégorie *
          </label>
          <PremiumSelect
            value={category}
            onChange={setCategory}
            options={categories.map((cat) => ({
              value: cat,
              label: cat,
            }))}
            placeholder="Sélectionner une catégorie"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full h-20 p-3 bg-surface-card border border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-amber-500 transition-colors resize-none"
          placeholder="Description détaillée du produit..."
        />
      </div>

      {/* Preferences & Allergens */}
      <div className="space-y-3 pt-2 border-t border-subtle">
        <label className="block text-xs font-semibold text-text-secondary">
          Régimes &amp; Allergènes
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsVegetarian(!isVegetarian)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 border transition-all ${
              isVegetarian
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-surface-card border-subtle text-text-tertiary hover:border-text-secondary"
            }`}
          >
            <Leaf className="w-3.5 h-3.5" />
            Végétarien
          </button>

          <button
            type="button"
            onClick={() => setIsVegan(!isVegan)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 border transition-all ${
              isVegan
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-surface-card border-subtle text-text-tertiary hover:border-text-secondary"
            }`}
          >
            <Leaf className="w-3.5 h-3.5" />
            Végan
          </button>

          <button
            type="button"
            onClick={() => setIsGlutenFree(!isGlutenFree)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 border transition-all ${
              isGlutenFree
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-surface-card border-subtle text-text-tertiary hover:border-text-secondary"
            }`}
          >
            Sans gluten
          </button>
        </div>

        {/* Allergen checklist */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {allergensList.map((alg) => {
            const isSelected = selectedAllergens.includes(alg.id);
            return (
              <button
                key={alg.id}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    setSelectedAllergens((prev) => prev.filter((a) => a !== alg.id));
                  } else {
                    setSelectedAllergens((prev) => [...prev, alg.id]);
                  }
                }}
                className={`px-2.5 py-1 rounded-md text-micro font-medium border transition-all ${
                  isSelected
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    : "bg-surface-card border-subtle text-text-tertiary hover:border-text-secondary"
                }`}
              >
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                {alg.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
