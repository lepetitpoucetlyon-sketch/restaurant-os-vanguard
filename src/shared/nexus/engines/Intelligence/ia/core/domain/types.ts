// Core Agnostic Interfaces for intelligence/ia

export interface IPromptTemplate {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAgentContext {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
