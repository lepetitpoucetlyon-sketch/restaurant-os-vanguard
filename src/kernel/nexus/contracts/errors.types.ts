/**
 * 🏛️ SOVEREIGN ERROR CONTRACTS - Grade X
 * Unified Error Protocol for Restaurant OS
 */

export type ErrorSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SovereignError {
  code: string;
  pillar: PillarId;
  message: string;
  severity: ErrorSeverity;
  timestamp: string;
  metadata?: Record<string, import("@nexus/contracts/nexus-contract").SovereignValue>;
}

export type PillarId = 
  | 'OPS' 
  | 'FINANCE' 
  | 'LOGISTICS' 
  | 'COMPLIANCE' 
  | 'HUMAN' 
  | 'COMMERCE' 
  | 'INTELLIGENCE' 
  | 'GATEWAY'
  | 'CORE';

// --- PILLAR SPECIFIC CODES ---

export enum OpsErrorCode {
  ORDER_NOT_FOUND = 'OPS_001',
  TABLE_LOCKED = 'OPS_002',
  KITCHEN_OVERLOAD = 'OPS_003',
  POS_SYNC_FAILED = 'OPS_004',
  INVALID_ORDER_STATE = 'OPS_005'
}

export enum FinanceErrorCode {
  TRANSACTION_FAILED = 'FIN_001',
  FISCAL_SEAL_BREAK = 'FIN_002',
  LEDGER_MISMATCH = 'FIN_003',
  PAYMENT_UNAUTHORIZED = 'FIN_004',
  TAX_CALCULATION_ERROR = 'FIN_005'
}

export enum ComplianceErrorCode {
  HACCP_THRESHOLD_BREACH = 'CMP_001',
  SANITARY_LOG_MISSING = 'CMP_002',
  COLD_CHAIN_BROKEN = 'CMP_003',
  TRACEABILITY_GAP = 'CMP_004'
}

export enum LogisticsErrorCode {
  STOCK_OUT = 'LOG_001',
  INVENTORY_DRIFT = 'LOG_002',
  SUPPLIER_REJECTION = 'LOG_003'
}

export enum HumanErrorCode {
  STAFF_NOT_AUTHORIZED = 'HR_001',
  PLANNING_CONFLICT = 'HR_002',
  CLOCK_IN_FAILED = 'HR_003'
}

export enum GatewayErrorCode {
  AUTH_FAILURE = 'GTW_001',
  SESSION_EXPIRED = 'GTW_002',
  ACCESS_DENIED = 'GTW_003',
  INSTANCE_UNAUTHORIZED = 'GTW_004'
}

export enum CoreErrorCode {
  GENOME_VALIDATION_FAILED = 'CORE_001',
  NEXUS_SYNC_ERROR = 'CORE_002',
  MAPPING_FAILURE = 'CORE_003',
  INTERNAL_CRASH = 'CORE_500'
}
