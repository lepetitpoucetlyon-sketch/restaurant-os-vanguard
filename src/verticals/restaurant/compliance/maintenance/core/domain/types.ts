// Core Agnostic Interfaces for facility/maintenance

export interface IMaintenanceTicket {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEquipment {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
