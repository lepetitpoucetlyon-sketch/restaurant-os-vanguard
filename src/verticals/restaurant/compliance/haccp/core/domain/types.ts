// Core Agnostic Interfaces for compliance/qualite

export interface IChecklist {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStandardOperatingProcedure {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuditLog {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
