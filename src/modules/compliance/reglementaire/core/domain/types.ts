// Core Agnostic Interfaces for compliance/reglementaire

export interface IConsentLog {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPrivacyPolicy {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
