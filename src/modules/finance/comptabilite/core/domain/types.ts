// Core Agnostic Interfaces for finance/comptabilite

export interface ILedgerEntry {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInvoice {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITaxLine {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
