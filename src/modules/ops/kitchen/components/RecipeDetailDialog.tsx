"use client";

import { useState, useCallback } from "react";
import {
    X, Clock, AlertTriangle, ChefHat, CheckCircle2, Flame,
    Heart, Share2, Printer, Minus, Plus, RotateCcw
} from "lucide-react";
import { Button } from "@ui/button";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { Modal } from "@ui/Modal";
import { Recipe, RecipeIngredient } from "@nexus/contracts";
import { RecipeCostBadge } from "@/components/recipes";
import {
    scaleIngredient,
    computeRecipeFoodCostInMu,
    recipeSalePriceInMu,
    foodCostPct,
    marginPct,
    formatMicrounits,
} from "@/components/recipes/recipeUtils";

// ─── Print helper (cui-4) ─────────────────────────────────────────────────────

function printRecipeTechnicalSheet(recipe: Recipe, currentPortions: number) {
    const basePortions = Math.max(1, recipe.portions ?? 1);
    const scale = currentPortions / basePortions;

    const ingredientRows = (recipe.ingredients ?? [])
        .map((ing: RecipeIngredient) => {
            const { value, unit } = scaleIngredient(ing, basePortions, currentPortions);
            const unitCostMu = ing.costInMicrounits ?? (ing.costInCents ?? 0) * 10_000;
            const lineCostMu = Number(ing.quantity ?? 0) * scale * unitCostMu;
            return `
        <tr>
          <td>${value}</td>
          <td>${unit}</td>
          <td>${ing.name}</td>
          <td>${lineCostMu > 0 ? formatMicrounits(lineCostMu) : '—'}</td>
        </tr>`;
        })
        .join('');

    const steps = ((recipe.recipeSteps ?? recipe.steps ?? []) as Array<{
        instruction?: string; [k: string]: unknown;
    }>)
        .map((step, i) => `<li><strong>Étape ${i + 1}:</strong> ${step.instruction ?? ''}</li>`)
        .join('');

    const foodCostMu = computeRecipeFoodCostInMu(recipe);
    const saleMu = recipeSalePriceInMu(recipe);
    const fcPct = foodCostPct(foodCostMu, saleMu);
    const mrgPct = marginPct(foodCostMu, saleMu);

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Fiche Technique — ${recipe.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, serif; color: #1a1a1a; background: #fff; padding: 32px; font-size: 13px; line-height: 1.6; }
    @media print {
      @page { margin: 20mm; }
      body { padding: 0; }
      .no-print { display: none !important; }
    }
    h1 { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
    h2 { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; margin: 24px 0 8px; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    .meta { display: flex; gap: 32px; margin: 16px 0 24px; }
    .meta span { font-size: 12px; color: #555; }
    .meta strong { color: #1a1a1a; font-size: 14px; display: block; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #f5f5f5; text-align: left; padding: 8px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #777; }
    td { padding: 7px 10px; border-bottom: 1px solid #eee; font-size: 13px; }
    ol li, ul li { margin-bottom: 8px; }
    .kpi { display: flex; gap: 24px; margin: 16px 0; flex-wrap: wrap; }
    .kpi-item { background: #f9f9f9; border: 1px solid #eee; border-radius: 8px; padding: 12px 16px; min-width: 140px; }
    .kpi-item .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: #888; margin-bottom: 4px; }
    .kpi-item .value { font-size: 18px; font-weight: 700; color: #1a1a1a; }
    .allergen-tag { display: inline-block; padding: 2px 8px; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-right: 4px; }
    .print-btn { margin-bottom: 24px; padding: 10px 20px; background: #1a1a1a; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-family: inherit; }
    .restaurant-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; }
    .restaurant-name { font-size: 12px; text-transform: uppercase; letter-spacing: 0.2em; color: #777; }
    .doc-type { font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: #aaa; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Imprimer</button>

  <div class="restaurant-header">
    <div>
      <div class="restaurant-name">Fiche Technique</div>
      <h1>${recipe.name}</h1>
    </div>
    <div style="text-align:right">
      <div class="doc-type">Document interne</div>
      <div style="font-size:12px; color:#aaa; margin-top:4px">${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
    </div>
  </div>

  <div class="meta">
    <div>
      <span>Portions</span>
      <strong>${currentPortions} portion${currentPortions > 1 ? 's' : ''}</strong>
    </div>
    <div>
      <span>Préparation</span>
      <strong>${recipe.preparationTimeMinutes ?? recipe.prepTime ?? '—'} min</strong>
    </div>
    <div>
      <span>Difficulté</span>
      <strong>${recipe.difficulty ?? '—'}</strong>
    </div>
    <div>
      <span>Catégorie</span>
      <strong>${recipe.category ?? '—'}</strong>
    </div>
  </div>

  <h2>Ingrédients</h2>
  <table>
    <thead>
      <tr><th>Qté</th><th>Unité</th><th>Ingrédient</th><th>Coût</th></tr>
    </thead>
    <tbody>${ingredientRows}</tbody>
  </table>

  ${steps ? `<h2>Étapes de réalisation</h2><ol>${steps}</ol>` : ''}

  <h2>Financier</h2>
  <div class="kpi">
    <div class="kpi-item">
      <div class="label">Coût matière</div>
      <div class="value">${foodCostMu > 0 ? formatMicrounits(foodCostMu) : '—'}</div>
    </div>
    ${fcPct != null ? `<div class="kpi-item"><div class="label">% Coût mat.</div><div class="value">${fcPct.toFixed(1)}%</div></div>` : ''}
    ${mrgPct != null ? `<div class="kpi-item"><div class="label">Marge brute</div><div class="value">${mrgPct.toFixed(1)}%</div></div>` : ''}
    ${saleMu > 0 ? `<div class="kpi-item"><div class="label">Prix de vente</div><div class="value">${formatMicrounits(saleMu)}</div></div>` : ''}
  </div>

  <h2>Allergènes</h2>
  <p>
    ${(recipe.allergens ?? []).length > 0
        ? (recipe.allergens ?? []).map((a: string) => `<span class="allergen-tag">${a}</span>`).join('')
        : 'Aucun allergène déclaré.'}
  </p>
</body>
</html>`);
    printWindow.document.close();
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface RecipeDetailDialogProps {
    isOpen: boolean;
    onClose: () => void;
    recipe: Recipe;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RecipeDetailDialog({ isOpen, onClose, recipe }: RecipeDetailDialogProps) {
    const basePortions = Math.max(1, recipe.portions ?? 1);
    const [currentPortions, setCurrentPortions] = useState(basePortions);

    const handlePortionChange = useCallback((delta: number) => {
        setCurrentPortions(p => Math.max(1, p + delta));
    }, []);

    const handleReset = useCallback(() => {
        setCurrentPortions(basePortions);
    }, [basePortions]);

    if (!recipe) return null;

    const isScaled = currentPortions !== basePortions;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="xl"
            forceDesktop
            className="p-0 border-none bg-transparent max-w-7xl"
            showClose={false}
            noPadding
        >
            <div className="w-full h-[85vh] rounded-[3rem] shadow-[0_32px_128px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row relative border transition-colors duration-500 bg-surface-card border-black/5">

                {/* ── Static Sidebar ─────────────────────────────────────────────────── */}
                <div className="md:w-[450px] border-r flex flex-col h-full shrink-0 relative transition-colors duration-500 bg-surface-bg border-black/5">

                    {/* Hero image */}
                    <div className="relative h-64 overflow-hidden transition-colors bg-surface-bg">
                        <motion.img
                            initial={{ scale: 1.2 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 1.5 }}
                            src={String(recipe.image ?? recipe.imageUrl ?? "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop")}
                            className="w-full h-full object-cover opacity-80"
                            alt={String(recipe.name)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t via-transparent to-transparent transition-colors from-surface-bg" />

                        <button
                            onClick={onClose}
                            className="absolute top-8 left-8 w-12 h-12 backdrop-blur-xl rounded-2xl flex items-center justify-center transition-all duration-300 shadow-2xl z-20 group border bg-surface-card/40 hover:bg-surface-card/60 text-primary border-black/10"
                        >
                            <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                        </button>

                        <div className="absolute bottom-6 left-8 right-8 flex justify-between items-center z-10">
                            <div className="flex gap-2">
                                <button className="w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center text-error hover:scale-110 transition-all shadow-lg border bg-surface-card/60 border-black/10">
                                    <Heart className="w-5 h-5 fill-error" />
                                </button>
                                <button className="w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center hover:scale-110 transition-all shadow-lg border bg-surface-card/60 text-primary border-black/10">
                                    <Share2 className="w-5 h-5" />
                                </button>
                            </div>
                            <motion.div
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="bg-accent px-4 py-2 rounded-xl text-primary font-serif font-black text-xs tracking-widest shadow-lg shadow-[#C5A059]/20"
                            >
                                SIGNATURE
                            </motion.div>
                        </div>
                    </div>

                    <div className="p-10 flex-1 overflow-auto elegant-scrollbar">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent mb-4 block">SIGNATURE</span>
                            <h1 className="text-4xl font-serif font-black leading-[1.1] mb-6 tracking-tight transition-colors text-primary">{String(recipe.name)}</h1>
                            <p className="text-[15px] leading-relaxed font-serif italic mb-10 opacity-80 border-l-2 border-accent/30 pl-4 py-1 transition-colors text-secondary">
                                &ldquo;{String(recipe.description ?? "Une création culinaire d'exception pour sublimer votre carte, alliant technique ancestrale et modernité.")}&rdquo;
                            </p>
                        </motion.div>

                        {/* Prep time + difficulty */}
                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div className="p-6 rounded-[2rem] border group hover:border-accent/30 transition-all duration-500 bg-surface-sidebar/5 border-black/5">
                                <span className="text-[11px] font-black uppercase text-secondary tracking-[0.3em] block mb-2">Prép.</span>
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-accent" />
                                    <span className="text-xl font-serif font-black transition-colors text-primary">
                                        {recipe.preparationTimeMinutes ?? recipe.prepTime ?? 20} MIN
                                    </span>
                                </div>
                            </div>
                            <div className="p-6 rounded-[2rem] border group hover:border-accent/30 transition-all duration-500 bg-surface-sidebar/5 border-black/5">
                                <span className="text-[11px] font-black uppercase text-secondary tracking-[0.3em] block mb-2">Service</span>
                                <div className="flex items-center gap-3">
                                    <Flame className="w-5 h-5 text-error" />
                                    <span className="text-xl font-serif font-black uppercase text-[15px] transition-colors text-primary">
                                        {String(recipe.difficulty ?? 'MOYEN')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ── cui-2: Portions scaling spinner ─────────────────────────────── */}
                        <div className="p-5 rounded-2xl border border-black/5 bg-surface-sidebar/5 mb-8">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[11px] font-black uppercase text-secondary tracking-[0.3em]">
                                    Portions
                                </span>
                                {isScaled && (
                                    <button
                                        onClick={handleReset}
                                        className="flex items-center gap-1.5 text-[10px] font-black text-accent uppercase tracking-wider hover:opacity-70 transition-opacity"
                                    >
                                        <RotateCcw className="w-3 h-3" strokeWidth={2} />
                                        Réinitialiser
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => handlePortionChange(-1)}
                                    disabled={currentPortions <= 1}
                                    className="w-9 h-9 rounded-xl border border-black/10 bg-surface-card flex items-center justify-center hover:bg-accent hover:text-white hover:border-accent transition-all disabled:opacity-30 disabled:cursor-not-allowed text-primary"
                                >
                                    <Minus className="w-4 h-4" strokeWidth={2.5} />
                                </button>
                                <span className="text-2xl font-serif font-black text-primary min-w-[2rem] text-center">
                                    {currentPortions}
                                </span>
                                <button
                                    onClick={() => handlePortionChange(1)}
                                    className="w-9 h-9 rounded-xl border border-black/10 bg-surface-card flex items-center justify-center hover:bg-accent hover:text-white hover:border-accent transition-all text-primary"
                                >
                                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                                </button>
                                {isScaled && (
                                    <span className="text-[10px] font-black text-accent uppercase tracking-widest ml-2">
                                        ×{(currentPortions / basePortions).toFixed(2).replace(/\.?0+$/, '')}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Ingredients list (scaled) */}
                        <div className="space-y-10">
                            <div>
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] transition-colors text-primary">Ingrédients</h3>
                                    <div className="h-px w-20 transition-colors bg-surface-sidebar/10" />
                                </div>
                                <motion.ul
                                    variants={staggerContainer}
                                    initial="hidden"
                                    animate="visible"
                                    className="grid grid-cols-1 gap-2"
                                >
                                    {(recipe.ingredients ?? []).map((ing: RecipeIngredient, i: number) => {
                                        const { value, unit } = scaleIngredient(ing, basePortions, currentPortions);
                                        return (
                                            <motion.li
                                                variants={staggerItem}
                                                key={i}
                                                className="flex items-center justify-between py-3 border-b group px-2 rounded-xl transition-all border-black/5 hover:bg-surface-sidebar/5"
                                            >
                                                <span className="text-[14px] font-medium transition-colors group-hover:text-accent text-primary">
                                                    {ing.name}
                                                </span>
                                                <span className="text-[12px] font-mono font-bold px-3 py-1 rounded-lg border transition-colors text-secondary bg-surface-card/40 border-black/5">
                                                    {value} {unit}
                                                </span>
                                            </motion.li>
                                        );
                                    })}
                                </motion.ul>
                            </div>

                            {/* Allergens */}
                            {recipe.allergens && recipe.allergens.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                    className="p-6 bg-error/5 rounded-3xl border border-error/10"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <AlertTriangle className="w-5 h-5 text-error" />
                                        <span className="text-[10px] font-black uppercase text-error tracking-[0.3em]">Alertes Allergènes</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {recipe.allergens.map((a: string) => (
                                            <span key={a} className="px-3 py-1.5 rounded-xl border text-[11px] font-black text-error uppercase tracking-wider shadow-sm transition-colors bg-surface-card/40 border-error/20">
                                                {a}
                                            </span>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* cui-1: cost + margin */}
                            <RecipeCostBadge recipe={recipe} />
                        </div>
                    </div>

                    {/* Sidebar footer — cui-4: print button */}
                    <div className="p-10 border-t transition-colors duration-500 border-black/5 bg-surface-bg/50">
                        <Button
                            onClick={() => printRecipeTechnicalSheet(recipe, currentPortions)}
                            className="w-full h-16 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-lg transition-all transform hover:scale-[1.02] bg-surface-sidebar hover:bg-surface-sidebar text-white"
                        >
                            <Printer className="w-5 h-5 mr-3" />
                            Imprimer Fiche Technique
                        </Button>
                    </div>
                </div>

                {/* ── Main content — recipe steps ─────────────────────────────────── */}
                <div className="flex-1 overflow-auto elegant-scrollbar relative transition-colors duration-500 bg-[#F8F7F2]">
                    <div className="max-w-4xl mx-auto px-12 py-24 md:px-24">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <div className="flex items-center gap-6 mb-16">
                                <div className="w-16 h-16 rounded-[2rem] bg-accent/10 flex items-center justify-center border border-accent/20">
                                    <ChefHat className="w-8 h-8 text-accent" />
                                </div>
                                <div>
                                    <h2 className="text-[14px] font-black uppercase tracking-[0.5em] text-secondary">Le Protocole</h2>
                                    <p className="font-serif italic opacity-60 transition-colors text-primary">Étapes de réalisation précises</p>
                                </div>
                            </div>

                            <motion.div
                                variants={staggerContainer}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-100px" }}
                                className="space-y-16"
                            >
                                {((recipe.recipeSteps ?? recipe.steps ?? []) as Array<{
                                    id?: string;
                                    instruction?: string;
                                    duration?: number;
                                    tip?: string;
                                    tools?: string[];
                                    [k: string]: unknown;
                                }>).map((step, idx) => (
                                    <motion.div
                                        key={idx}
                                        variants={staggerItem}
                                        className="group relative pl-20"
                                    >
                                        <div className="absolute left-0 top-0 text-[64px] font-serif font-black leading-none transition-colors group-hover:text-accent/20 text-primary/5">
                                            {(idx + 1).toString().padStart(2, '0')}
                                        </div>
                                        <div className="space-y-4">
                                            <h3 className="text-2xl font-serif font-black tracking-tight group-hover:text-accent transition-all duration-500 text-primary">
                                                {`Étape ${idx + 1}`}
                                            </h3>
                                            <p className="text-lg leading-relaxed font-serif opacity-80 group-hover:opacity-100 transition-all text-secondary">
                                                {step.instruction as string}
                                            </p>
                                            {step.tip && (
                                                <div className="flex items-center gap-4 p-4 bg-accent/5 rounded-2xl border border-accent/10 mt-6">
                                                    <ChefHat className="w-5 h-5 text-accent" />
                                                    <p className="text-[13px] font-bold text-accent italic">{step.tip as string}</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}

                                {/* Final presentation */}
                                <div className="pt-24 border-t transition-colors border-black/10">
                                    <div className="text-center space-y-10">
                                        <span className="text-[13px] font-black uppercase tracking-[0.8em] text-secondary opacity-40">L'Œuvre Finale</span>
                                        <h2 className="text-6xl font-serif font-black tracking-tighter transition-colors text-primary">Une signature inoubliable.</h2>

                                        <motion.div
                                            whileHover={{ scale: 1.02 }}
                                            transition={{ duration: 0.8 }}
                                            className="relative h-[600px] rounded-[4rem] overflow-hidden shadow-[0_64px_128px_-32px_rgba(0,0,0,0.5)] border transition-colors border-black/5"
                                        >
                                            <img
                                                src={String(recipe.imageUrl ?? "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop")}
                                                className="w-full h-full object-cover"
                                                alt="Final dish"
                                            />
                                            <div className="absolute inset-0 flex flex-col justify-end p-16 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                                                <div className="max-w-2xl mx-auto">
                                                    <Button className="w-full bg-accent text-primary hover:bg-accent/90 h-20 px-12 rounded-[2rem] font-black text-[14px] uppercase tracking-[0.3em] transition-all transform hover:translate-y-[-4px] shadow-2xl shadow-[#C5A059]/20">
                                                        <CheckCircle2 className="w-6 h-6 mr-4 text-primary" />
                                                        Valider comme Appris
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>

                {/* Detail texture overlay */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-[0.4] mix-blend-overlay"
                    style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/carbon-fibre.png")` }}
                />
            </div>
        </Modal>
    );
}
