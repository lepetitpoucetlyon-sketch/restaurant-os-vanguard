// Core Agnostic Interfaces for facility/spaces

export interface ISpaceResource {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISpaceCapacity {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
