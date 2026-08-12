import { SovereignField } from '@nexus/contracts/nexus-contract';

/**
 * 🏛️ COMPLIANCE & QUALITY CONTRACTS - Grade X
 */

export type QualityControlType = 'reception' | 'storage' | 'preparation' | 'pre_service';
export type VehicleType = 'refrigerated' | 'isothermal' | 'ambient' | 'unknown';
export type CleanlinessStatus = 'clean' | 'acceptable' | 'dirty' | 'not_checked';
export type PackagingIntegrity = 'intact' | 'damaged' | 'mixed';
export type ControlStatus = 'pass' | 'warning' | 'fail' | 'not_applicable' | 'not_measured' | 'quarantine';
export type DecisionType = 'accepted' | 'accepted_reservation' | 'partially_accepted' | 'rejected';

export type ProductCategory = 
  | 'vegetables'
  | 'fruits'
  | 'meat'
  | 'poultry'
  | 'fish_seafood'
  | 'dairy'
  | 'eggs'
  | 'charcuterie'
  | 'frozen'
  | 'dry_goods'
  | 'beverages'
  | 'other';

export interface ProductQualityConfig {
    productId: string;
    category: ProductCategory;
    tempRange?: { min: number; max: number };
    requiredChecks: {
        temperature: boolean;
        visual: boolean;
        weight: boolean;
        freshness: boolean;
    };
    visualCriteria: string[];
    tolerancePercent: number;
    minShelfLifeDays: number;
}

export interface SupplierQualityScore {
    supplierId: string;
    supplierName: string;
    month: string;
    reliabilityScore: number;
    complianceRate: number;
    rejectionRate: number;
    averageTempDrift: number;
    incidentsCount: number;
}

export interface VisualAspect {
    aspect: string;
    ok: boolean;
    note?: string;
}

export interface QualityControlItem {
    [key: string]: SovereignField | undefined;
    id: string;
    product_id: string;
    product_name: string;
    product_category: ProductCategory;
    quantity_ordered: number;
    quantity_delivered: number;
    quantity_accepted: number;
    quantity_rejected: number;
    unit: string;
    is_rejected: boolean;
    decision: DecisionType;
    corrective_action: string;
    checks: {
        visual: {
            performed: boolean;
            status: ControlStatus;
            aspects: VisualAspect[];
            photos: string[];
            notes?: string;
        };
        temperature: {
            required: boolean;
            performed: boolean;
            target: { min: number; max: number };
            measured?: number;
            status: ControlStatus;
            warning_threshold: number;
        };
        weight: {
            required: boolean;
            performed: boolean;
            unit: string;
            status: ControlStatus;
            tolerance_percent: number;
        };
        freshness: {
            required: boolean;
            performed: boolean;
            score: number;
        };
    };
    batch_number?: string;
    lot_number?: string;
    origin?: string;
    production_date?: string;
    expiry_date?: string;
    decision_reason?: string;
}

export interface ActiveQualityControlItem extends QualityControlItem {
    batch_number: string;
    lot_number: string;
    origin: string;
    production_date: string;
    expiry_date: string;
    decision_reason: string;
    expiry_type: 'dlc' | 'ddm';
    days_until_expiry: number;
    is_short_dlc: boolean;
}

export interface QualityControl {
    [key: string]: SovereignField | undefined;
    id: string;
    control_number: string;
    type: QualityControlType;
    supplier_id: string;
    supplier_name: string;
    controlled_at: string;
    controlled_by: string;
    controller_name: string;
    duration_minutes: number;
    delivery?: {
        id: string;
        reference: string;
    };
    delivery_conditions: {
        vehicle_type: VehicleType;
        vehicle_temperature: {
            measured?: number;
            compliant: boolean;
        };
        vehicle_cleanliness: CleanlinessStatus;
        packaging_integrity: PackagingIntegrity;
        delivery_time_compliant: boolean;
    };
    items: QualityControlItem[];
    summary: {
        total_items: number;
        items_accepted: number;
        items_rejected: number;
        temperature_issues: number;
        visual_issues: number;
        overall_status: ControlStatus;
        supplier_score_impact: number;
    };
    metadata: {
        created_at: string;
        updated_at: string;
        synced: boolean;
        fingerprint: string;
    };
    color_aspect?: boolean;
    texture_aspect?: boolean;
    odor_aspect?: boolean;
    signature?: {
        captured: boolean;
        data: string;
        signer_name: string;
    };
}

export interface ActiveQualityControl extends QualityControl {
    items: ActiveQualityControlItem[];
    color_aspect: boolean;
    texture_aspect: boolean;
    odor_aspect: boolean;
    signature: {
        captured: boolean;
        data: string;
        signer_name: string;
    };
}

export interface ReceptionData {
    deliveryId: string;
    supplierName: string;
    truckTemp: number;
    hygieneStatus: 'clean' | 'acceptable' | 'dirty';
    itemsChecked: {
        id: string;
        name: string;
        status: 'ok' | 'warning' | 'rejected';
        temp?: number;
        quantity: number;
    }[];
    validatedBy: string;
}

export interface CleaningData {
    zoneId: string;
    areaName: string;
    status: 'pending' | 'completed' | 'verified';
    checkedAt: string;
    staffId: string;
    verifierId?: string;
    notes?: string;
}

export interface OilCheckData {
    fryerId: string;
    tpmValue: number;
    decision: 'ok' | 'change_soon' | 'must_change';
    changedAt?: string;
    staffId: string;
}

export interface WasteData {
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    reason: 'expired' | 'damaged' | 'preparation_error' | 'inventory_gap';
    timestamp: string;
    staffId: string;
}
