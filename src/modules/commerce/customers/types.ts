/**
 * CRM & CUSTOMER TYPES
 */

import { Customer, CRM_Record } from '@nexus/contracts';

export interface CRMGroup {
    id: string;
    name: string;
    description?: string;
    customerIds: string[]; // Unified to Customer IDs
}

// CRM is now an alias for the master Customer contract
export type CRM = Customer;
