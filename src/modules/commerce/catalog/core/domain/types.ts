// Core Agnostic Interfaces for commerce/catalog

export interface ICatalogItem {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPriceRule {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVariant {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
