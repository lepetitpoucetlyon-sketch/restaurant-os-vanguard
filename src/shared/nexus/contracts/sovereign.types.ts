/**
 * 🏛️ SOVEREIGN TYPES — Universal SaaS Core Types
 * Extracted from nexus-contract.ts for Grade X modular alignment.
 */

export type SovereignField =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date
  | unknown[]
  | { [key: string]: unknown }
  | { type: 'string'; value: string }
  | { type: 'number'; value: number }
  | { type: 'boolean'; value: boolean }
  | { type: 'null'; value: null }
  | { type: 'date'; value: Date | string }
  | { type: 'object'; value: Record<string, unknown> }
  | { type: 'array'; value: unknown[] };

export type SovereignValue = SovereignField;

export interface SovereignMap {
  [key: string]: SovereignField;
}

export type SovereignData<T = SovereignMap> = T;

export interface SovereignSchemaField {
  id: string;
  type?: string;
  unit?: string;
  subFields?: SovereignSchemaField[];
  [key: string]: SovereignField;
}

/**
 * 🏛️ SovereignNode - Universal Entity Contract
 * Any business object MUST implement this to be handled by the Core.
 */
export interface SovereignNode {
  id: string;
  updatedAt: string | Date | number;
  createdAt?: string | Date | number;
  [key: string]: SovereignField;
}
