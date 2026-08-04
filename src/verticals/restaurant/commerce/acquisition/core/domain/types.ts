// Core Agnostic Interfaces for commerce/acquisition

export interface ICampaign {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILead {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
