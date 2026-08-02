// Core Agnostic Interfaces for human/remuneration

export interface IPayrollVariable {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITimeEntry {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
