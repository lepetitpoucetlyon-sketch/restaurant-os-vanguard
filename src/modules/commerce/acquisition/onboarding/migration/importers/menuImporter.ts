import { Nexus } from '@/lib/nexus/NexusAdapter';
import { toMicrounits } from '@/shared/schemas/primitives';
import { authedFetch } from '@/lib/client/authedFetch';
import type { ParsedFile, ImportResult, SourceSystem } from '../types';

// L'Addition and Zelty always export prices in cents — detect by column name, magnitude, or source
function detectPriceUnit(
  rows: Record<string, string>[],
  priceField: string,
  source?: string,
): 'euros' | 'cents' {
  // 1. Explicit column name: price_cents, prix_ht_cents, etc.
  if (/cents?/i.test(priceField)) return 'cents';

  // 2. Source-level override: Zelty and L'Addition always use cents
  if (source === 'zelty' || source === 'laddition') return 'cents';

  const prices = rows
    .map(r => parseFloat((r[priceField] ?? '0').replace(',', '.')))
    .filter(n => !isNaN(n) && n > 0);

  // 3. Magnitude heuristic on median value
  //    > 10000 → certainly cents (100€+ dish in euros would be unusual)
  //    > 500  → likely cents (5€ dish in cents = 500; in euros would be a €500 item)
  if (prices.length > 0) {
    const sorted = prices.slice().sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    if (median > 10000) return 'cents';
    if (median > 500) return 'cents';
  }

  // 4. Safe default for restaurant POS imports (Zelty/L'Addition bias)
  return 'cents';
}

function parsePriceToMicrounits(raw: string, unit: 'euros' | 'cents'): number {
  const cleaned = raw.replace(/\s/g, '').replace(',', '.').replace(/[^0-9.]/g, '');
  const val = parseFloat(cleaned) || 0;
  if (unit === 'cents') return Math.round(val * 10_000); // cents → microunits
  return Math.round(val * 1_000_000);                    // euros → microunits
}

function findColumn(row: Record<string, string>, candidates: string[]): string {
  for (const c of candidates) {
    const key = Object.keys(row).find(k => k.toLowerCase().includes(c.toLowerCase()));
    if (key && row[key]) return row[key];
  }
  return '';
}

export function buildColumnMapping(_source: SourceSystem): Record<string, string[]> {
  const base: Record<string, string[]> = {
    name: ['name', 'nom', 'article', 'libellé', 'product_name', 'ProductName', 'plat', 'designation'],
    categoryName: ['category', 'categorie', 'catégorie', 'famille', 'category_id', 'section'],
    price: ['price', 'prix', 'tarif', 'price_cents', 'Prix TTC', 'Montant TTC', 'CostPrice', 'price_eur'],
    description: ['description', 'desc', 'detail', 'détail', 'note'],
    taxRate: ['tva', 'tax', 'taxRate', 'Taux TVA', 'tax_rate'],
  };
  return base;
}

export async function importMenuFromAI(rawText: string, onProgress: (n: number) => void): Promise<ImportResult> {
  onProgress(10);
  const prompt = `Tu es un assistant de migration de données Restaurant OS.
Voici le texte brut d'une carte de restaurant:
"${rawText}"

Extrait tous les plats et retourne UNIQUEMENT un objet JSON valide sans markdown:
{
  "categories": [{ "name": "Entrées", "type": "food", "sortOrder": 1 }],
  "products": [{ "name": "Oeuf Mayo", "description": "...", "price": 8.50, "categoryName": "Entrées", "taxRate": 10.0 }]
}`;

  const res = await authedFetch('/api/oracle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
  if (!res.ok) throw new Error('Erreur IA menu');

  const result = await res.json();
  onProgress(40);
  const json = result.content.replace(/```json/g, '').replace(/```/g, '').trim();
  const data = JSON.parse(json) as { categories: { name: string; type: string; sortOrder: number }[]; products: { name: string; description: string; price: number; categoryName: string; taxRate: number }[] };

  return _injectMenuData(data, onProgress);
}

export async function importMenuFromRows(file: ParsedFile, onProgress: (n: number) => void): Promise<ImportResult> {
  onProgress(10);
  const mapping = buildColumnMapping(file.source);
  const priceField = Object.keys(file.rows[0] ?? {}).find(k =>
    ['price', 'prix', 'price_cents', 'Prix TTC', 'tarif'].some(c => k.toLowerCase().includes(c.toLowerCase()))
  ) ?? '';
  const priceUnit = detectPriceUnit(file.rows, priceField, file.source);

  // Group rows into categories + products
  const categorySet = new Set<string>();
  const products: { name: string; description: string; price: number; categoryName: string; taxRate: number }[] = [];

  for (const row of file.rows) {
    const name = findColumn(row, mapping.name);
    const categoryName = findColumn(row, mapping.categoryName) || 'Autre';
    const priceRaw = findColumn(row, mapping.price);
    const description = findColumn(row, mapping.description);
    const taxRaw = findColumn(row, mapping.taxRate);

    if (!name) continue;
    categorySet.add(categoryName);
    products.push({
      name,
      description,
      price: parsePriceToMicrounits(priceRaw, priceUnit) / 1_000_000, // keep as euros for schema compat
      categoryName,
      taxRate: parseFloat(taxRaw) || 10.0,
    });
  }

  const categories = Array.from(categorySet).map((name, i) => ({ name, type: 'food', sortOrder: i + 1 }));
  onProgress(30);
  return _injectMenuData({ categories, products }, onProgress);
}

async function _injectMenuData(data: { categories: { name: string; type: string; sortOrder: number }[]; products: { name: string; description: string; price: number; categoryName: string; taxRate: number }[] }, onProgress: (n: number) => void): Promise<ImportResult> {
  const batch = Nexus.adapter.batch();
  const categoryIdMap: Record<string, string> = {};
  let created = 0;

  for (const cat of data.categories) {
    const id = Nexus.adapter.generateId('menu_categories');
    batch.set(`menu_categories/${id}`, { ...cat, createdAt: Date.now() });
    categoryIdMap[cat.name] = id;
  }
  onProgress(60);

  for (const prod of data.products) {
    const id = Nexus.adapter.generateId('products');
    const { categoryName, price, ...rest } = prod;
    batch.set(`products/${id}`, {
      ...rest,
      priceInMicrounits: toMicrounits(Math.round(price * 1_000_000)),
      categoryId: categoryIdMap[categoryName] ?? 'uncategorized',
      status: 'available',
      createdAt: Date.now(),
    });
    created++;
  }

  await batch.commit();
  onProgress(100);
  return { created, updated: 0, skipped: 0, errors: [] };
}
