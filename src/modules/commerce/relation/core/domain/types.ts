// Core Agnostic Interfaces for commerce/relation

export interface ICustomerProfile {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInteractionHistory {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPreference {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
