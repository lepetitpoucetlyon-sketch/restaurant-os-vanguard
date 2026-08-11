import type { Dispatch } from 'react';
import type { NexusError } from './registre.contracts';

export interface TimeSlot {
  id: string;
  start: Date;
  end: Date;
  vassalId: string;
}

export type ScheduledResourceKind = 'STAFF' | 'EQUIPMENT' | 'ROOM';

export interface StaffMetadata { role: string; }
export interface EquipmentMetadata { type: string; }
export interface RoomMetadata { capacity: number; }

export interface ScheduledResource {
  id: string;
  kind: ScheduledResourceKind;
  slotId: string;
  metadata: StaffMetadata | EquipmentMetadata | RoomMetadata;
}

export interface PlanningConflict {
  id: string;
  resourceId: string;
  overlappingSlots: [string, string];
  severity: 'WARNING' | 'BLOCKER';
  resolvedAt: Date | null;
}

export interface PlanningState {
  slots: TimeSlot[];
  resources: ScheduledResource[];
  conflicts: PlanningConflict[];
  status: 'idle' | 'loading' | 'syncing' | 'error';
  error: NexusError | null;
}

export type PlanningAction =
  | { type: 'SET_SLOTS'; payload: TimeSlot[] }
  | { type: 'SET_STATUS'; payload: PlanningState['status'] }
  | { type: 'SET_ERROR'; payload: NexusError };

export interface PlanningContextValue {
  state: PlanningState;
  dispatch: Dispatch<PlanningAction>;
}
