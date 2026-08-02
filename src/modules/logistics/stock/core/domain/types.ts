// Core Agnostic Interfaces for logistics/stock

export interface IStockItem {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStockMovement {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInventoryCount {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
