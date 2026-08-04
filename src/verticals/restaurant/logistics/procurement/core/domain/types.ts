// Core Agnostic Interfaces for logistics/approvisionnement

export interface IPurchaseOrder {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISupplier {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
