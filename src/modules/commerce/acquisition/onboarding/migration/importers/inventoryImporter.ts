import { Nexus } from '@/lib/nexus/NexusAdapter';
import { toMicrounits } from '@/shared/schemas/primitives';
import type { ParsedFile, ImportResult } from '../types';
import type { StockItem } from '@/modules/logistics';

type ValidUnit = StockItem['unit'];

// Cross-impact: StockItemSchema unit enum is strict
const UNIT_ALIASES: Record<string, ValidUnit> = {
  // kg
  kg: 'kg', kilogramme: 'kg', kilogrammes: 'kg', kilo: 'kg', kilos: 'kg',
  // g
  g: 'g', gramme: 'g', grammes: 'g', gr: 'g',
  // l
  l: 'l', litre: 'l', litres: 'l', lt: 'l',
  // cl
  cl: 'cl', centilitre: 'cl', centilitres: 'cl',
  // ml
  ml: 'ml', millilitre: 'ml', millilitres: 'ml',
  // unit
  unit: 'unit', unité: 'unit', unite: 'unit', u: 'unit', pc: 'unit',
  // piece
  piece: 'piece', pièce: 'piece', pcs: 'piece',
  // portion
  portion: 'portion', portions: 'portion',
  // bunch
  bunch: 'bunch', botte: 'bunch', bottes: 'bunch',
  // crate
  crate: 'crate', caisse: 'crate', caisses: 'crate', carton: 'crate',
  // box
  box: 'box', boite: 'box', boîte: 'box', barquette: 'box',
  // bottle
  bottle: 'bottle', bouteille: 'bottle', bouteilles: 'bottle',
  // can
  can: 'can', boite_conserve: 'can', conserve: 'can',
};

function normalizeUnit(raw: string): ValidUnit {
  return UNIT_ALIASES[raw.toLowerCase().trim()] ?? 'unit';
}

function parseDLC(raw: string): number | undefined {
  if (!raw) return undefined;
  // dd/MM/yyyy
  const dmy = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (dmy) return new Date(`${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`).getTime();
  // yyyy-MM-dd
  const ts = Date.parse(raw);
  return isNaN(ts) ? undefined : ts;
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

export async function importInventory(file: ParsedFile, onProgress: (n: number) => void): Promise<ImportResult> {
  onProgress(5);

  // Dedup: ingredient by name (case-insensitive)
  const existingIngredients = await Nexus.adapter.query<{ id: string; name: string }>('ingredients');
  const ingredientIndex = new Map<string, string>(
    existingIngredients.map(i => [i.name.toLowerCase().trim(), i.id])
  );
  onProgress(20);

  const batch = Nexus.adapter.batch();
  let created = 0, updated = 0, skipped = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < file.rows.length; i++) {
    const row = file.rows[i];
    onProgress(20 + Math.round((i / file.rows.length) * 65));

    const name = findCol(row, ['nom', 'name', 'ingredient', 'ingrédient', 'produit', 'article', 'libelle', 'libellé']).trim();
    if (!name) { skipped++; continue; }

    const quantityRaw = findCol(row, ['quantite', 'quantité', 'quantity', 'qty', 'stock', 'qté']);
    const unitRaw = findCol(row, ['unite', 'unité', 'unit', 'uom', 'mesure']);
    const dlcRaw = findCol(row, ['dlc', 'date limite', 'expiry', 'peremption', 'péremption', 'bbf', 'best before']);
    const zoneRaw = findCol(row, ['zone', 'emplacement', 'location', 'stockage', 'storage']);
    const costRaw = findCol(row, ['cout', 'coût', 'cost', 'prix unitaire', 'unit cost', 'prix achat']);
    const supplierRaw = findCol(row, ['fournisseur', 'supplier', 'source']);
    const thresholdRaw = findCol(row, ['seuil', 'threshold', 'min', 'minimum', 'alerte']);

    const quantity = parseFloat(quantityRaw.replace(',', '.')) || 0;
    const unit = normalizeUnit(unitRaw || 'unit');
    const priceInMicrounits = costRaw
      ? toMicrounits(Math.round(parseFloat(costRaw.replace(',', '.').replace(/[^0-9.]/g, '')) * 1_000_000))
      : undefined;
    const expiryTimestamp = parseDLC(dlcRaw) ?? null;
    const threshold = parseFloat(thresholdRaw) || undefined;
    const nameKey = name.toLowerCase();

    // Upsert ingredient
    let ingredientId: string;
    const storageLocation = zoneRaw || undefined;
    if (ingredientIndex.has(nameKey)) {
      ingredientId = ingredientIndex.get(nameKey)!;
      batch.update(`ingredients/${ingredientId}`, {
        defaultStorageLocation: storageLocation,
        cost: priceInMicrounits ? (parseFloat(costRaw.replace(',', '.')) || 0) : undefined,
        updatedAt: Date.now(),
      });
      updated++;
    } else {
      ingredientId = Nexus.adapter.generateId('ingredients');
      batch.set(`ingredients/${ingredientId}`, {
        id: ingredientId,
        name,
        unit,
        minQuantity: threshold ?? 1,
        cost: parseFloat(costRaw.replace(',', '.')) || 0,
        supplier: supplierRaw || undefined,
        defaultStorageLocation: storageLocation,
        createdAt: Date.now(),
      });
      ingredientIndex.set(nameKey, ingredientId);
      created++;
    }

    // Always create a stockItem record (the physical lot)
    const stockId = Nexus.adapter.generateId('stockItems');
    batch.set(`stockItems/${stockId}`, {
      id: stockId,
      type: 'stockItem',
      name,
      quantityInStock: quantity,
      unit,
      priceInMicrounits,
      threshold,
      supplierId: supplierRaw || undefined,
      expiryTimestamp,
      locationXYZ: null,
      schemaVersion: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  await batch.commit();
  onProgress(100);
  return { created, updated, skipped, errors };
}
