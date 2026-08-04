import { Nexus } from '@/lib/nexus/NexusAdapter';
import { ScannedItem, BarcodeSearchResult, ProductDoc, IngredientDoc } from './InventoryReceptionTypes';

// import { searchIngredientsAction } from '@/app/(admin)/actions/inventory';
const searchIngredientsAction = async (_tenantId: string, _query: string): Promise<import('@nexus/contracts').Ingredient[]> => ([]);

export async function runOcrScan(tenantId: string): Promise<ScannedItem[]> {
  const keywords = ['Saumon', 'Aneth', 'Sel'];
  const SCAN_DEFAULTS: Record<string, { qty: number; price: number }> = {
    Saumon: { qty: 5, price: 125.00 },
    Aneth:  { qty: 10, price: 15.00 },
    Sel:    { qty: 25, price: 45.00 },
  };
  const results: ScannedItem[] = [];
  for (const word of keywords) {
    const matches = await searchIngredientsAction(tenantId, word);
    if (matches.length === 0) continue;
    const match = matches[0] as import('@nexus/contracts').Ingredient;
    const defaults = SCAN_DEFAULTS[word] ?? { qty: 1, price: 0 };
    results.push({
      id: String(match.id), name: String(match.name),
      qty: defaults.qty, unit: String(match.unit), price: defaults.price,
      dlc: new Date(Date.now() + (Number(match.shelfLifeDays) || 3) * 86400000).toISOString().split('T')[0],
      forceScan: word === 'Saumon', ingredient: match,
    });
  }
  return results;
}

export async function persistReception(tenantId: string, items: ScannedItem[]) {
  for (const item of items) {
    const stockPath = `tenants/${tenantId}/stockItems/${item.id}`;
    const existing = await Nexus.adapter.get<{ quantity?: number }>(stockPath);
    await Nexus.adapter.set(stockPath, {
      id: item.id, name: item.name, quantity: (existing?.quantity ?? 0) + item.qty,
      unit: item.unit, dlc: item.dlc, updatedAt: new Date().toISOString(),
    });
    const movPath = `tenants/${tenantId}/inventoryMovements`;
    const movId = Nexus.adapter.generateId(movPath);
    await Nexus.adapter.set(`${movPath}/${movId}`, {
      id: movId, type: 'reception', ingredientId: item.id, ingredientName: item.name,
      quantity: item.qty, unit: item.unit, costInCents: Math.round(item.price * 100), costInMicrounits: Math.round(item.price * 1_000_000),
      dlc: item.dlc, recordedAt: new Date().toISOString(),
    });
  }
}

export function findByBarcode(items: ProductDoc[], code: string): ProductDoc | undefined {
    return items.find(p => p.sku?.toUpperCase() === code || p.barcode?.toUpperCase() === code);
}

export function findIngredientByBarcode(items: IngredientDoc[], code: string): IngredientDoc | undefined {
    return items.find(i => i.sku?.toUpperCase() === code || i.barcode?.toUpperCase() === code || i.supplierRef?.toUpperCase() === code);
}

export async function searchBarcode(code: string): Promise<BarcodeSearchResult | null> {
    const [products, ingredients] = await Promise.all([
        Nexus.adapter.query<ProductDoc>('products'),
        Nexus.adapter.query<IngredientDoc>('ingredients'),
    ]);
    const normalised = code.trim().toUpperCase();
    const found = findByBarcode(products ?? [], normalised) ?? findIngredientByBarcode(ingredients ?? [], normalised) ?? null;
    if (!found) return null;
    return { id: String(found.id), name: String(found.name), unit: found.unit ? String(found.unit) : undefined, sku: found.sku, supplier: found.supplier, supplierId: found.supplierId };
}
