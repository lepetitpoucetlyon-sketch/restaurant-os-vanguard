export interface ScannedItem {
    id: string;
    name: string;
    qty: number;
    unit: string;
    price: number;
    dlc: string;
    forceScan: boolean;
    ingredient?: import('@nexus/contracts').Ingredient;
}

export interface BarcodeSearchResult {
    id: string;
    name: string;
    unit?: string;
    sku?: string;
    supplier?: string;
    supplierId?: string;
}

export type ProductDoc = BarcodeSearchResult & { barcode?: string; sku?: string; supplier?: string; supplierId?: string };
export type IngredientDoc = ProductDoc & { supplierRef?: string };
