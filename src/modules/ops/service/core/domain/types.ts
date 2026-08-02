// Core Agnostic Interfaces for ops/service

export interface ICart {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICartItem {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICheckoutSession {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITicket {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
