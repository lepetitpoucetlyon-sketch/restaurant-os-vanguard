export interface IngredientSettings {
    id: string;
    name: string;
    sku?: string;
    barcode?: string;
    photo?: string;
    category: string;
    subcategory?: string;
    stockUnit: string;
    orderUnit: string;
    standardPackaging?: number;
    purchasePrice: number;
    pricePerUnit?: number;
    primarySupplierId?: string;
    alternateSuppliersIds?: string[];
    deliveryLeadTime?: number;
    minOrderQuantity?: number;
    minStock: number;
    safetyStock?: number;
    maxStock?: number;
    defaultStorageLocation?: string;
    storageTemperature?: number;
    typicalShelfLife?: number;
    allergen?: string;
    isOrganic: boolean;
    labels?: string[];
    origin?: string;
    isSeasonal: boolean;
    seasonalMonths?: number[];
}

export interface SupplierSettings {
    id: string;
    name: string;
    type: 'food' | 'beverage' | 'equipment' | 'services' | 'other';
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
    siret?: string;
    vatNumber?: string;
    iban?: string;
    paymentTerms: '30' | '60' | 'immediate';
    negotiatedDiscount?: number;
    minimumOrder?: number;
    avgDeliveryTime?: number;
    deliveryDays?: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
    deliveryHours?: string;
    products?: string[];
    notes?: string;
}
