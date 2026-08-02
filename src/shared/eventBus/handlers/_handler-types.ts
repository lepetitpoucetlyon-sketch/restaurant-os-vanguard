/**
 * Types métier partagés entre les event handlers.
 * Chaque interface modélise un objet Firestore réellement
 * lu ou écrit par les handlers, pas un type générique.
 */

// ──────────────────── KDS (Kitchen Display System) ────────────────────

export type KdsItemStatus = 'pending' | 'in_progress' | 'fired' | 'done';

export interface KdsItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  course: number;          // 1=Entrée, 2=Plat, 3=Dessert
  status: KdsItemStatus;
  startedAt?: number;
  doneAt?: number;
  firedAt?: number;
}

export interface KdsTicket {
  id: string;
  orderId: string;
  status: 'received' | 'in_progress' | 'done';
  items: KdsItem[];
  receivedAt: number;
  updatedAt?: number;
  doneAt?: number;
}

// ──────────────────── Stock & Inventory ────────────────────

export interface StockMovementItem {
  productId: string;
  name?: string;
  quantity: number;
  unitCost?: number;        // en microunits
  lotNumber?: string;
  expiryDate?: string;
}

export interface SupplierDeliveryLine {
  productId: string;
  name: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitPrice: number;        // en microunits
  lotNumber?: string;
}

// ──────────────────── CRM & Loyalty ────────────────────

export interface CustomerRecord {
  id: string;
  tenantId: string;
  email?: string;
  name?: string;
  phone?: string;
  totalOrders: number;
  totalSpent: number;       // en microunits
  lastOrderDate?: string;
  rfmSegment?: string;
  vipStatus?: boolean;
  loyaltyPoints?: number;
  tags?: string[];
  createdAt: string;
}

// ──────────────────── Order Items ────────────────────

export interface OrderLineItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;        // en microunits
  course?: number;
  modifiers?: string[];
}

// ──────────────────── Floor Plan ────────────────────

export interface FloorTable {
  id: string;
  label: string;
  seats: number;
  zone?: string;
  status: 'free' | 'occupied' | 'reserved';
  x: number;
  y: number;
}

export interface FloorPlanLayout {
  id: string;
  tables: FloorTable[];
  totalCapacity: number;
}

// ──────────────────── HR / Payroll ────────────────────

export interface EmployeeShift {
  employeeId: string;
  employeeName: string;
  scheduledStart: string;   // ISO
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  hoursWorked?: number;
  overtimeMinutes?: number;
  role?: string;
}

export interface PayrollEntry {
  employeeId: string;
  month: string;            // "2026-01"
  grossSalary: number;      // en microunits
  socialCharges: number;
  netSalary: number;
  overtimeHours: number;
  bonuses: number;
}

// ──────────────────── Waste & Food Cost ────────────────────

export interface WasteRecord {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  reason: string;
  costInMicrounits: number;
  date: string;
}

export interface RecipeIngredient {
  productId: string;
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;         // en microunits
}

// ──────────────────── Anti-Corruption Layer ────────────────────

export interface ACLValidationResult {
  valid: boolean;
  errors: string[];
  sanitizedPayload?: Record<string, unknown>;
}

// ──────────────────── Nexus Event Bus internal ────────────────────

export interface DurableEvent {
  id: string;
  eventName: string;
  payload: Record<string, unknown>;
  createdAt: number;
  attempts: number;
  status: 'pending' | 'processing' | 'done' | 'dead';
  lastError?: string;
}
