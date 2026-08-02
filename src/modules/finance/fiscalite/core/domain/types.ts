// Core Agnostic Interfaces for finance/fiscalite

export interface ITaxConfiguration {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuditTrailRecord {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
