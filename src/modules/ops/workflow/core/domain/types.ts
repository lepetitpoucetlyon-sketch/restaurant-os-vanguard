// Core Agnostic Interfaces for ops/workflow

export interface IStateNode {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStateTransition {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITenantWorkflow {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
