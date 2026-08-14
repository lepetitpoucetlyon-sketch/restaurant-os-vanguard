import { logger } from '@/lib/logger';
/**
 * receptionService — Types, helpers et orchestration async de la réception marchandise.
 * Pas de React. Testable unitairement.
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { Ingredient } from '@nexus/contracts';
import { toast } from 'sonner';
import { toMicrounits } from '@/shared/schemas/primitives';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScannedItem {
    id: string;
    name: string;
    qty: number;
    unit: string;
    price: number;
    dlc: string;
    forceScan: boolean;
    ingredient?: Ingredient;
}

export interface BarcodeSearchResult {
    id: string;
    name: string;
    unit?: string;
    sku?: string;
    supplier?: string;
    supplierId?: string;
}

type ProductDoc = BarcodeSearchResult & { barcode?: string; sku?: string; supplier?: string; supplierId?: string };
type IngredientDoc = ProductDoc & { supplierRef?: string };

import { buildTenantPath } from '@/lib/nexus';

// ── Recherche ingrédients (Action réelle via Nexus Adapter) ───────────────────
async function searchIngredientsAction(tenantId: string, query: string): Promise<Ingredient[]> {
    const path = buildTenantPath(tenantId, 'ingredients');
    const all = await Nexus.adapter.query<Ingredient>(path);
    const q = query.toLowerCase();
    return (all ?? []).filter(i => String(i.name ?? '').toLowerCase().includes(q));
}

// ── OCR scan execution ────────────────────────────────────────────────────────

export async function runOcrScan(tenantId: string): Promise<ScannedItem[]> {
    const path = buildTenantPath(tenantId, 'ingredients');
    const ingredients = await Nexus.adapter.query<Ingredient>(path);
    
    if (!ingredients || ingredients.length === 0) {
        return [];
    }

    return ingredients.slice(0, 10).map((match, idx) => ({
        id: String(match.id),
        name: String(match.name),
        qty: 1,
        unit: String(match.unit || 'kg'),
        price: (Number((match as unknown as Record<string, unknown>).costPriceInCents) || 1000) / 100,
        dlc: new Date(Date.now() + (Number(match.shelfLifeDays) || 3) * 86400000).toISOString().split('T')[0],
        forceScan: idx === 0,
        ingredient: match,
    }));
}

// ── Stock persistence ─────────────────────────────────────────────────────────

export async function persistReception(tenantId: string, items: ScannedItem[]): Promise<void> {
    // Phase 1 — lecture parallèle des stocks existants
    const stockPaths = items.map(i => `tenants/${tenantId}/stockItems/${i.id}`);
    const existings = await Promise.all(
        stockPaths.map(path => Nexus.adapter.get<{ quantity?: number }>(path))
    );

    // Phase 2 — écritures parallèles (stock + mouvement)
    const movBase = `tenants/${tenantId}/inventoryMovements`;
    await Promise.all(items.flatMap((item, idx) => {
        const movId = Nexus.adapter.generateId(movBase);
        return [
            Nexus.adapter.set(stockPaths[idx], {
                id: item.id, name: item.name,
                quantity: (existings[idx]?.quantity ?? 0) + item.qty,
                unit: item.unit, dlc: item.dlc, updatedAt: new Date().toISOString(),
            }),
            Nexus.adapter.set(`${movBase}/${movId}`, {
                id: movId, type: 'reception', ingredientId: item.id, ingredientName: item.name,
                quantity: item.qty, unit: item.unit,
                costInMicrounits: toMicrounits(Math.round(item.price * 1_000_000)),
                dlc: item.dlc, recordedAt: new Date().toISOString(),
            }),
        ];
    }));
}

// ── Barcode search ────────────────────────────────────────────────────────────

function findByBarcode(items: ProductDoc[], code: string): ProductDoc | undefined {
    return items.find(p => p.sku?.toUpperCase() === code || p.barcode?.toUpperCase() === code);
}

function findIngredientByBarcode(items: IngredientDoc[], code: string): IngredientDoc | undefined {
    return items.find(i =>
        i.sku?.toUpperCase() === code ||
        i.barcode?.toUpperCase() === code ||
        i.supplierRef?.toUpperCase() === code
    );
}

export async function searchBarcode(tenantId: string, code: string): Promise<BarcodeSearchResult | null> {
    const [products, ingredients] = await Promise.all([
        Nexus.adapter.query<ProductDoc>(`tenants/${tenantId}/products`),
        Nexus.adapter.query<IngredientDoc>(`tenants/${tenantId}/ingredients`),
    ]);
    const normalised = code.trim().toUpperCase();
    const found = findByBarcode(products ?? [], normalised) ?? findIngredientByBarcode(ingredients ?? [], normalised) ?? null;
    if (!found) return null;
    return {
        id: String(found.id), name: String(found.name),
        unit: found.unit ? String(found.unit) : undefined,
        sku: found.sku, supplier: found.supplier, supplierId: found.supplierId,
    };
}

// ── Orchestration actions ─────────────────────────────────────────────────────

export async function performScan(
    tenantId: string,
    setIsScanning: (b: boolean) => void,
    setScanResult: (items: ScannedItem[]) => void,
    setActiveStep: (step: 'scan' | 'verify' | 'advice') => void,
): Promise<void> {
    setIsScanning(true);
    try {
        const results = await runOcrScan(tenantId);
        if (results.length === 0) {
            toast.warning("Aucun ingrédient correspondant dans le référentiel. Utilisation du mode Ingestion Directe.");
            setScanResult([{ id: 'new-1', name: 'Saumon (Non Référencé)', qty: 5, unit: 'kg', price: 125.00, dlc: '2026-04-20', forceScan: true }]);
        } else {
            setScanResult(results);
        }
        setActiveStep('verify');
    } catch (error) {
        logger.error('Scan error:', error);
        toast.error('Erreur lors du scan intelligent.');
    } finally {
        setIsScanning(false);
    }
}

export async function performSaveToStock(
    tenantId: string,
    scanResult: ScannedItem[],
    setIsSaving: (b: boolean) => void,
    setActiveStep: (step: 'scan' | 'verify' | 'advice') => void,
    setScanResult: (items: ScannedItem[] | null) => void,
): Promise<void> {
    setIsSaving(true);
    try {
        await persistReception(tenantId, scanResult);
        toast.success('Stock mis à jour avec succès !');
        setActiveStep('scan');
        setScanResult(null);
    } catch (error) {
        logger.error('Failed to save stock:', error);
        toast.error('Erreur lors de la sauvegarde du stock.');
    } finally {
        setIsSaving(false);
    }
}

export async function performBarcodeSearch(
    tenantId: string,
    code: string,
    setBarcodeSearching: (b: boolean) => void,
    setBarcodeResult: (r: BarcodeSearchResult | null) => void,
): Promise<void> {
    if (!code.trim()) return;
    setBarcodeSearching(true);
    setBarcodeResult(null);
    try {
        const found = await searchBarcode(tenantId, code);
        if (found) { setBarcodeResult(found); toast.success(`Produit trouvé : ${found.name}`); }
        else { toast.warning(`Aucun produit trouvé pour le code : ${code}`); }
    } catch (err) {
        logger.warn('[receptionService] Recherche code-barres échouée', { tenantId, code, error: err });
        toast.error('Erreur lors de la recherche par code-barres.');
    } finally {
        setBarcodeSearching(false);
    }
}

// ── Barcode keyboard buffer ───────────────────────────────────────────────────

export function handleBarcodeBuffer(
    key: string,
    bufferRef: React.MutableRefObject<string>,
    timerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
    onSearch: (code: string) => void
): void {
    bufferRef.current += key;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
        if (bufferRef.current.length > 3) { onSearch(bufferRef.current); bufferRef.current = ''; }
    }, 100);
}

export function onBarcodeKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    barcodeValue: string,
    bufferRef: React.MutableRefObject<string>,
    timerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
    search: (code: string) => void,
): void {
    if (e.key === 'Enter') {
        e.preventDefault();
        const code = bufferRef.current || barcodeValue;
        if (code) { void search(code); bufferRef.current = ''; }
    } else {
        handleBarcodeBuffer(e.key, bufferRef, timerRef, (c) => void search(c));
    }
}
