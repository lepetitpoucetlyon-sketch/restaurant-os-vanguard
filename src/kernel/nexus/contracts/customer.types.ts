/**
 * 👤 UNIVERSAL CUSTOMER CONTRACT - Grade X
 * Unified representation of a person within the Restaurant OS.
 */

import { SovereignNode } from '@nexus/contracts/nexus-contract';

export interface Customer extends SovereignNode {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  birthDate?: string;
  preferences: string[];
  tags: string[];
  visitCount: number;
  totalSpentInMicrounits?: number;
  averageSpendInMicrounits?: number;
  /** @deprecated use totalSpentInMicrounits */
  totalSpentInCents?: number;
  /** @deprecated use averageSpendInMicrounits */
  averageSpendInCents?: number;
  lastVisitDate?: string;
  segment?: 'vip' | 'regular' | 'new' | string;
  notes?: string;
}

/**
 * CRM_Record: Raw database representation (Legacy/Storage)
 * This interface is kept for database compatibility but maps to Customer.
 */
export interface CRM_Record extends Customer {
  // Database-specific flags or internal IDs can be added here
  _internal_crm_id?: string;
}
