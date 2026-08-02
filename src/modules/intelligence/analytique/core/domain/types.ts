// Core Agnostic Interfaces for intelligence/analytique

export interface IMetricDataset {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReportDefinition {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
