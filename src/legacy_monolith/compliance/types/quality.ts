/**
 * 📦 Quality Module Domain Types
 * Grade VI - HACCP & NF525 Compliant
 * Architecture: Atomic Domain-Driven Design
 */

export type QualityControlType = 'reception' | 'storage' | 'preparation' | 'pre_service';

export type VehicleType = 'refrigerated' | 'isothermal' | 'ambient' | 'unknown';

export type CleanlinessStatus = 'clean' | 'acceptable' | 'dirty' | 'not_checked';

export type PackagingIntegrity = 'intact' | 'damaged' | 'mixed';

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

export type ControlStatus = 'pass' | 'warning' | 'fail' | 'not_applicable' | 'not_measured' | 'quarantine';

export type ExpiryType = 'dlc' | 'ddm';

export type DecisionType = 'accepted' | 'accepted_reservation' | 'partially_accepted' | 'rejected';

export type CorrectiveActionType =
  | 'none'
  | 'priority_use'
  | 'return_supplier'
  | 'credit_note'
  | 'dispose'
  | 'quarantine'
  | 'notify_supplier'
  | 'relabeling'
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
  id: string;
  product_id: string;
  product_name: string;
  product_category: ProductCategory;
  batch_number?: string;
  lot_number?: string;
  origin?: string;
  production_date?: string;
  expiry_date?: string;
  expiry_type: ExpiryType;
  days_until_expiry: number;
  is_short_dlc: boolean;
  quantity_ordered: number;
  quantity_delivered: number;
  quantity_accepted: number;
  quantity_rejected: number;
  unit: string;
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
      probe_id?: string;
      status: ControlStatus;
      warning_threshold: number;
    };
    weight: {
      required: boolean;
      performed: boolean;
      expected?: number;
      measured?: number;
      unit: string;
      status: ControlStatus;
      tolerance_percent: number;
    };
    freshness: {
      required: boolean;
      performed: boolean;
      score: 1 | 2 | 3 | 4 | 5;
      notes?: string;
    };
  };
  is_rejected: boolean;
  decision: DecisionType;
  decision_reason?: string;
  corrective_action: CorrectiveActionType;
}

export interface ActiveQualityControlItem extends Omit<QualityControlItem, 'batch_number' | 'lot_number' | 'origin' | 'production_date' | 'expiry_date' | 'decision_reason'> {
  batch_number: string;
  lot_number: string;
  origin: string;
  production_date: string;
  expiry_date: string;
  decision_reason: string;
}

export interface ActiveQualityControl extends Omit<QualityControl, 'delivery' | 'duration_minutes' | 'signature' | 'color_aspect' | 'texture_aspect' | 'odor_aspect'> {
  delivery: {
    id: string;
    reference: string;
  };
  duration_minutes: number;
  color_aspect: boolean;
  texture_aspect: boolean;
  odor_aspect: boolean;
  items: ActiveQualityControlItem[];
  signature: {
    captured: boolean;
    data: string;
    signer_name: string;
  };
}

export interface QualityControl {
  id: string;
  control_number: string;
  type: QualityControlType;
  delivery?: {
    id: string;
    reference: string;
  };
  supplier_id: string;
  supplier_name: string;
  controlled_at: string;
  controlled_by: string;
  controller_name: string;
  duration_minutes?: number;
  delivery_conditions: {
    vehicle_type: VehicleType;
    vehicle_id?: string;
    vehicle_temperature: {
      measured?: number;
      compliant: boolean;
    };
    vehicle_cleanliness: CleanlinessStatus;
    packaging_integrity: PackagingIntegrity;
    delivery_time_compliant: boolean;
    notes?: string;
  };
  color_aspect?: boolean;
  texture_aspect?: boolean;
  odor_aspect?: boolean;
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
  signature?: {
    captured: boolean;
    data?: string;
    signer_name?: string;
  };
  metadata: {
    created_at: string;
    updated_at: string;
    synced: boolean;
    fingerprint: string;
  };
}
