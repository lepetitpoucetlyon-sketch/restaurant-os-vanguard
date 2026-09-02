/** @wip ops-production — Échéance: 2026-11-01. Core Agnostic Interfaces for ops/production */

export interface IProductionOrder {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductionStep {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductionStatus {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
