// Core Agnostic Interfaces for human/effectifs

export interface IStaffMember {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IScheduleShift {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAvailability {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
