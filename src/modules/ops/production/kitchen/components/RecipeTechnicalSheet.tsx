"use client";

import React from 'react';
import { Clock, ChefHat, Download, X } from 'lucide-react';
import { useLanguage } from '@/shared/hooks';
;

interface Ingredient {
    name: string;
    quantity: string;
}

interface PreparationStep {
    order: string;
    instruction: string;
    time: string;
}

interface RecipeProps {
    name: string;
    description: string;
    image: string;
    prepTime: string;
    difficulty: string;
    ingredients: Ingredient[];
    steps: PreparationStep[];
    allergens: string[];
    onClose: () => void;
}

export function RecipeTechnicalSheet({
    name,
    description,
    image,
    prepTime,
    difficulty,
    ingredients,
    steps,
    allergens,
    onClose
}: RecipeProps) {
  const { t } = useLanguage();
    const handleDownloadPdf = () => {
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) {
            window.print();
            return;
        }
        const ingredientRows = (ingredients || []).map(ing => `
            <tr>
              <td style="font-weight:bold; width:30%; padding:6px 10px; border-bottom:1px solid #eee;">${ing.quantity}</td>
              <td style="padding:6px 10px; border-bottom:1px solid #eee;">${ing.name}</td>
            </tr>
        `).join('');
        const stepRows = (steps || []).map(s => `
            <li style="margin-bottom: 12px;"><strong>Étape ${s.order} (${s.time}):</strong> ${s.instruction}</li>
        `).join('');
        const allergenBadges = allergens && allergens.length > 0 
            ? allergens.map(a => `<span style="display:inline-block; padding:3px 8px; background:#fee2e2; color:#b91c1c; border-radius:12px; margin-right:6px; font-size:11px;">${a}</span>`).join('') 
            : '<span style="color:#059669; font-weight:bold;">Aucun</span>';

        printWindow.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Fiche Technique — ${name}</title>
  <style>
    body { font-family: Georgia, serif; color: #1a1a1a; padding: 32px; font-size: 13px; line-height: 1.6; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; margin: 20px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; color:#555; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #f5f5f5; text-align: left; padding: 6px 10px; font-size: 11px; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid #1a1a1a; padding-bottom: 12px;">
    <div>
      <h1>${name}</h1>
      <p style="color:#666; font-size:12px;">${description || ''} • Temps: ${prepTime} • Difficulté: ${difficulty}</p>
    </div>
    <button class="no-print" onclick="window.print()" style="padding:8px 16px; background:#1a1a1a; color:#fff; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">Imprimer / PDF</button>
  </div>
  <h2>{t('recipe_sheet.ingredients')}</h2>
  <div style="overflow-x: auto;">
    <table>
      <thead><tr><th>{t('recipe_sheet.quantity')}</th><th>{t('recipe_sheet.ingredient')}</th></tr></thead>
      <tbody>${ingredientRows}</tbody>
    </table>
  </div>
  <h2>{t('recipe_sheet.allergens')}</h2>
  <div style="margin-bottom: 16px;">${allergenBadges}</div>
  <h2>{t('recipe_sheet.prep_steps')}</h2>
  <ol style="padding-left: 20px;">${stepRows}</ol>
</body>
</html>`);
        printWindow.document.close();
    };

    return (
        <div className="flex h-full w-full overflow-hidden">
            {/* Left Side: Recipe Summary & Ingredients */}
            <div className="w-[380px] bg-bg-primary dark:bg-bg-secondary border-r border-subtle dark:border-border flex flex-col h-full overflow-y-auto elegant-scrollbar">
                {/* Image Section */}
                <div className="relative h-[300px] w-full mb-10 overflow-hidden">
                    <img
                        src={image}
                        alt={name}
                        className="w-full h-full object-cover rounded-br-[4rem] shadow-xl shadow-black/5"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#fdfdfa] dark:from-bg-secondary to-transparent" />
                </div>

                {/* Header Info */}
                <div className="px-10 space-y-8">
                    <div>
                        <span className="text-nano font-black text-accent-gold uppercase tracking-[0.4em] mb-4 block">Recette Signature</span>
                        <h2 className="text-4xl font-serif font-light text-primary dark:text-text-primary leading-tight italic">{name}</h2>
                        <p className="text-sm text-secondary dark:text-text-muted font-serif italic mt-4 leading-relaxed tracking-tight">
                            "{description}"
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-surface-card dark:bg-bg-tertiary p-6 rounded-3xl border border-subtle dark:border-border shadow-sm">
                            <p className="text-nano font-black text-muted dark:text-text-muted uppercase tracking-widest mb-1.5">{t('recipe_sheet.preparation')}</p>
                            <p className="text-sm font-mono font-bold text-primary dark:text-text-primary italic">{prepTime}</p>
                        </div>
                        <div className="bg-surface-card dark:bg-bg-tertiary p-6 rounded-3xl border border-subtle dark:border-border shadow-sm">
                            <p className="text-nano font-black text-muted dark:text-text-muted uppercase tracking-widest mb-1.5">{t('recipe_sheet.difficulty')}</p>
                            <p className="text-sm font-mono font-bold text-primary dark:text-text-primary italic uppercase">{difficulty}</p>
                        </div>
                    </div>

                    {/* Ingredients */}
                    <div className="pt-6 border-t border-subtle dark:border-border">
                        <h3 className="text-nano font-black text-primary dark:text-text-primary uppercase tracking-widest mb-8">{t('recipe_sheet.ingredients')}</h3>
                        <div className="space-y-6">
                            {ingredients.map((ing, i) => (
                                <div key={i} className="flex justify-between items-end border-b border-subtle dark:border-border pb-3 group">
                                    <span className="text-sm font-serif italic text-secondary dark:text-text-muted group-hover:text-primary dark:group-hover:text-text-primary transition-colors">{ing.name}</span>
                                    <span className="text-[12px] font-mono font-bold text-primary dark:text-text-primary">{ing.quantity}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Allergens */}
                    <div className="pt-6">
                        <h3 className="text-nano font-black text-primary dark:text-text-primary uppercase tracking-widest mb-4">{t('recipe_sheet.allergens')}</h3>
                        <div className="flex flex-wrap gap-2 pb-10">
                            {allergens.length > 0 ? allergens.map((allergen, i) => (
                                <span key={i} className="px-5 py-2 rounded-full bg-error/10 text-error text-chip-label-sm">
                                    {allergen}
                                </span>
                            )) : (
                                <span className="px-5 py-2 rounded-full bg-success/10 text-success text-chip-label-sm">
                                    AUCUN
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="sticky bottom-0 p-8 bg-gradient-to-t from-[#fdfdfa] dark:from-bg-secondary via-[#fdfdfa] dark:via-bg-secondary to-transparent pt-12">
                    <button 
                        onClick={handleDownloadPdf}
                        className="w-full h-14 bg-action-primary hover:bg-action-primary-hover text-text-on-primary rounded-full text-nano font-black uppercase tracking-[0.2em] transition-all shadow-lg flex items-center justify-center gap-4 group"
                    >
                        <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                        Télécharger Fiche PDF
                    </button>
                </div>
            </div>

            {/* Right Side: Execution Steps */}
            <div className="flex-1 bg-surface-card dark:bg-bg-tertiary p-14 overflow-y-auto elegant-scrollbar relative">
                <button aria-label="Fermer"
                    onClick={onClose}
                    className="absolute top-10 right-10 w-12 h-12 rounded-full bg-surface-glass hover:bg-surface-glass-hover flex items-center justify-center transition-all z-20 group border border-border"
                >
                    <X className="w-6 h-6 text-muted dark:text-text-muted group-hover:text-primary dark:group-hover:text-text-primary transition-colors" />
                </button>

                <div className="max-w-2xl mx-auto py-10 space-y-24">
                    {steps.map((step, i) => (
                        <div key={i} className="relative group">
                            <div className="flex items-center gap-10">
                                <span className="text-6xl font-serif text-muted dark:text-primary group-hover:text-accent-gold transition-colors italic">
                                    {step.order}
                                </span>
                                <div className="h-px flex-1 bg-surface-bg dark:bg-border relative top-2">
                                    <div className="absolute right-0 bottom-3 flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5 text-muted dark:text-text-muted" />
                                        <span className="text-nano font-mono font-bold text-secondary dark:text-text-muted uppercase tracking-widest">{step.time}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-10 pl-[85px]">
                                <p className="text-2xl font-serif font-light text-primary dark:text-text-primary leading-relaxed italic">
                                    {step.instruction}
                                </p>
                            </div>
                        </div>
                    ))}

                    <div className="pt-20 text-center">
                        <div className="inline-flex items-center gap-4 px-10 py-4 rounded-full border border-subtle dark:border-border bg-surface-bg/50 dark:bg-bg-secondary/40">
                            <ChefHat className="w-5 h-5 text-accent-gold" />
                            <span className="text-nano font-black text-muted dark:text-text-muted uppercase tracking-[0.4em]">Dressage Final</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
