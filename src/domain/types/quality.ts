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

// --- 🎯 Product Specific Quality Configuration ---
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
  visualCriteria: string[]; // e.g. ["Color", "Texture", "Odor"]
  tolerancePercent: number; // For weight discrepancies
  minShelfLifeDays: number; // Critical threshold for DLC
}

// --- 📊 Supplier Scoring & Performance ---
export interface SupplierQualityScore {
  supplierId: string;
  supplierName: string;
  month: string; // YYYY-MM
  reliabilityScore: number; // 0-100
  complianceRate: number; // % of conforming products
  rejectionRate: number; // % of items rejected
  averageTempDrift: number; // average deviation in °C
  incidentsCount: number;
}

// --- 🔍 Visual & Sensory Checks ---
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
  
  // Traceability
  batch_number?: string;
  lot_number?: string;
  origin?: string;
  
  // Dates
  production_date?: string;
  expiry_date?: string;
  expiry_type: ExpiryType;
  days_until_expiry: number;
  is_short_dlc: boolean;
  
  // Quantities
  quantity_ordered: number;
  quantity_delivered: number;
  quantity_accepted: number;
  quantity_rejected: number;
  unit: string;
  
  // Controls
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
      score: 1 | 2 | 3 | 4 | 5; // 1: Rejected, 5: Excellent
      notes?: string;
    };
  };
  
  is_rejected: boolean;
  decision: DecisionType;
  decision_reason?: string;
  corrective_action: CorrectiveActionType;
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
  
  items: QualityControlItem[];
  
  summary: {
    total_items: number;
    items_accepted: number;
    items_rejected: number;
    temperature_issues: number;
    visual_issues: number;
    overall_status: ControlStatus;
    supplier_score_impact: number; // Impact of this specific delivery on the supplier score
  };
  
  signature?: {
    captured: boolean;
    data?: string; // base64
    signer_name?: string;
  };
  
  metadata: {
    created_at: string;
    updated_at: string;
    synced: boolean;
    fingerprint: string; // SHA-256 for Grade VI integrity
  };
}

