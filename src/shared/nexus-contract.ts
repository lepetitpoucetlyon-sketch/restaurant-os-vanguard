/**
 * 🛰️ NEXUS SHARED GENOME - Universal SaaS Edition
 * Version Grade X - Sovereign Alignment
 */

export interface BusinessLaws {
  table_count: number;
  tax_rate: number;
  currency: string;
  pmsEnabled: boolean;
  [key: string]: string | number | boolean | undefined;
}

export type SovereignPrimitive = string | number | boolean | null | undefined | Date;
export type SovereignValue = SovereignPrimitive;
export interface SovereignData extends Record<string, SovereignField> {}
export type SovereignField = SovereignValue | SovereignData | SovereignField[];

export interface SovereignSchemaField {
  id: string;
  type?: string;
  unit?: string;
  subFields?: SovereignSchemaField[];
  [key: string]: SovereignField;
}

export interface SovereignWriteSignature {
  scope: 'NF525_WRITE';
  version: 'NF525_WRITE_V1';
  tenantId: string;
  path: string;
  signedAt: string;
  payloadHash: string;
  signature: string;
}

