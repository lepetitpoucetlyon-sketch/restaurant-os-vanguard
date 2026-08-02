// Core Agnostic Interfaces for finance/tresorerie

export interface ICashDrawer {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICashMovement {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentMethod {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
