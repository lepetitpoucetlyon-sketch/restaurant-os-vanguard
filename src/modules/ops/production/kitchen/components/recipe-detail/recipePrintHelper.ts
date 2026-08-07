import { Recipe, RecipeIngredient } from "@nexus/contracts";
import {
    scaleIngredient,
    computeRecipeFoodCostInMu,
    recipeSalePriceInMu,
    foodCostPct,
    marginPct,
    formatMicrounits,
} from "../../../recipes/recipeUtils";

export function printRecipeTechnicalSheet(recipe: Recipe, currentPortions: number) {
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
    .kpi-card { background: #f9f9f9; border: 1px solid #eee; border-radius: 6px; padding: 12px 16px; min-width: 130px; }
    .kpi-card label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; display: block; }
    .kpi-card value { font-size: 16px; font-weight: 700; color: #1a1a1a; font-family: monospace; display: block; margin-top: 2px; }
  </style>
</head>
<body>
  <div style="display:flex; justify-content:space-between; align-items:flex-start;">
    <div>
      <h1>${recipe.name}</h1>
      <p style="color:#666; font-size:12px; margin-top:2px;">Fiche Technique Officielle • Restaurant OS</p>
    </div>
    <button class="no-print" onclick="window.print()" style="padding:8px 16px; background:#1a1a1a; color:#fff; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">Imprimer</button>
  </div>

  <div class="kpi">
    <div class="kpi-card"><label>Portions</label><value>${currentPortions}</value></div>
    <div class="kpi-card"><label>Temps prépa</label><value>${recipe.prepTimeMinutes ?? '—'} min</value></div>
    <div class="kpi-card"><label>Temps cuisson</label><value>${recipe.cookTimeMinutes ?? '—'} min</value></div>
    <div class="kpi-card"><label>Coût Portion</label><value>${foodCostMu > 0 ? formatMicrounits(Math.round(foodCostMu / basePortions)) : '—'}</value></div>
    ${fcPct !== null ? `<div class="kpi-card"><label>Food Cost %</label><value>${fcPct}%</value></div>` : ''}
    ${mrgPct !== null ? `<div class="kpi-card"><label>Marge M/U %</label><value>${mrgPct}%</value></div>` : ''}
  </div>

  <h2>Ingrédients (${currentPortions} portion${currentPortions > 1 ? 's' : ''})</h2>
  <table>
    <thead><tr><th>Quantité</th><th>Unité</th><th>Ingrédient</th><th>Coût Total</th></tr></thead>
    <tbody>${ingredientRows}</tbody>
  </table>

  ${steps ? `<h2>Étapes de Préparation</h2><ol style="padding-left:20px;">${steps}</ol>` : ''}
</body>
</html>`);
    printWindow.document.close();
}
