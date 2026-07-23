import { Nexus } from '@/lib/nexus/NexusAdapter';
import { authedFetch } from '@/lib/client/authedFetch';
import type { ParsedFile, ImportResult } from '../types';

// Cross-impact: must be imported AFTER inventory (requiresOrder: ['inventory'])
// Ingredients are linked by name — fuzzy match against existing ingredients/ collection

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

function fuzzyMatch(name: string, index: Map<string, string>): string | null {
  const lower = name.toLowerCase().trim();
  if (index.has(lower)) return index.get(lower)!;
  // Tolerance: up to 2 char difference
  for (const [key, id] of index) {
    if (levenshtein(lower, key) <= 2) return id;
  }
  return null;
}

function findCol(row: Record<string, string>, candidates: string[]): string {
  for (const c of candidates) {
    const key = Object.keys(row).find(k =>
      k.toLowerCase().replace(/[_\s]/g, '').includes(c.toLowerCase().replace(/[_\s]/g, ''))
    );
    if (key) return row[key] ?? '';
  }
  return '';
}

export async function importRecipesFromRows(file: ParsedFile, onProgress: (n: number) => void): Promise<ImportResult> {
  onProgress(5);

  const ingredients = await Nexus.adapter.query<{ id: string; name: string }>('ingredients');
  const ingredientIndex = new Map<string, string>(
    ingredients.map(i => [i.name.toLowerCase().trim(), i.id])
  );
  onProgress(20);

  // Group rows by recipe name (each row = one ingredient line)
  const recipeMap = new Map<string, { ingredientLines: { ingredientId: string; name: string; quantity: number; unit: string }[] }>();
  const errors: { row: number; message: string }[] = [];
  let skipped = 0;

  for (let i = 0; i < file.rows.length; i++) {
    const row = file.rows[i];

    const recipeName = findCol(row, ['recette', 'recipe', 'plat', 'dish', 'nom recette']).trim();
    const ingredientName = findCol(row, ['ingredient', 'ingrédient', 'produit', 'matiere', 'matière']).trim();
    const quantityRaw = findCol(row, ['quantite', 'quantité', 'qty', 'quantity', 'qte']);
    const unitRaw = findCol(row, ['unite', 'unité', 'unit', 'uom']);

    if (!recipeName || !ingredientName) { skipped++; continue; }

    const ingredientId = fuzzyMatch(ingredientName, ingredientIndex);
    if (!ingredientId) {
      errors.push({ row: i + 2, message: `Ingrédient introuvable : "${ingredientName}" — importer d'abord les stocks` });
      skipped++;
      continue;
    }

    if (!recipeMap.has(recipeName)) recipeMap.set(recipeName, { ingredientLines: [] });
    recipeMap.get(recipeName)!.ingredientLines.push({
      ingredientId,
      name: ingredientName,
      quantity: parseFloat(quantityRaw.replace(',', '.')) || 0,
      unit: unitRaw || 'unit',
    });
  }

  onProgress(60);
  const batch = Nexus.adapter.batch();
  let created = 0;

  for (const [name, { ingredientLines }] of recipeMap) {
    const id = Nexus.adapter.generateId('recipes');
    batch.set(`recipes/${id}`, {
      id,
      name,
      ingredients: ingredientLines,
      steps: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    created++;
  }

  await batch.commit();
  onProgress(100);
  return { created, updated: 0, skipped, errors };
}

export async function importRecipesFromAI(rawText: string, onProgress: (n: number) => void): Promise<ImportResult> {
  onProgress(10);

  const ingredients = await Nexus.adapter.query<{ id: string; name: string }>('ingredients');
  const ingredientIndex = new Map<string, string>(
    ingredients.map(i => [i.name.toLowerCase().trim(), i.id])
  );

  const prompt = `Tu es un expert en cuisine. Extrait les recettes de ce texte et retourne UNIQUEMENT du JSON valide:
"${rawText}"
Format:
{ "recipes": [{ "name": "Nom recette", "steps": ["étape 1"], "ingredients": [{ "name": "Farine", "quantity": 200, "unit": "g" }] }] }`;

  const res = await authedFetch('/api/oracle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
  if (!res.ok) throw new Error('Erreur IA recettes');

  const result = await res.json();
  onProgress(50);
  const data = JSON.parse(result.content.replace(/```json/g, '').replace(/```/g, '').trim()) as {
    recipes: { name: string; steps: string[]; ingredients: { name: string; quantity: number; unit: string }[] }[];
  };

  const batch = Nexus.adapter.batch();
  let created = 0;
  const errors: { row: number; message: string }[] = [];

  for (const recipe of data.recipes) {
    const resolvedIngredients = recipe.ingredients.map((ing, idx) => {
      const id = fuzzyMatch(ing.name, ingredientIndex);
      if (!id) errors.push({ row: idx, message: `Ingrédient IA introuvable: "${ing.name}"` });
      return { ...ing, ingredientId: id ?? '' };
    });

    const id = Nexus.adapter.generateId('recipes');
    batch.set(`recipes/${id}`, {
      id,
      name: recipe.name,
      steps: recipe.steps ?? [],
      ingredients: resolvedIngredients,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    created++;
  }

  await batch.commit();
  onProgress(100);
  return { created, updated: 0, skipped: 0, errors };
}
