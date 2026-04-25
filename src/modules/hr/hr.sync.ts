import { Nexus } from '@/lib/nexus/NexusAdapter';
import { updateNexusNode } from "@/store/nexusNodeFactory";
import { 
  shiftLogsNodeAtom, 
  activeShiftsNodeAtom, 
  shiftsNodeAtom, 
  leaveRequestsNodeAtom, 
  leaveBalancesNodeAtom, 
  staffMembersNodeAtom 
} from '@/store/operationalAtoms';

import { logger } from '@/lib/logger';
import { getDefaultStore } from 'jotai';

type JotaiStore = ReturnType<typeof getDefaultStore>;

/**
 * 👥 HR Sovereign Sync Service
 * Handles real-time synchronization for Personnel, Shifts, and Leaves.
 */
export const HRSyncService = {
  private_listeners: {} as Record<string, () => void>,

  init(tenantId: string, store: JotaiStore) {
    const path = (coll: string) => Nexus.getTenantPath(coll, tenantId);
    
    // 0. STAFF MEMBERS (USERS)
    this.private_listeners.staff = Nexus.adapter.onSnapshot(
      path('users'),
      (data: any) => {
        store.set(staffMembersNodeAtom as any, (prev: any) => updateNexusNode(prev, { data: Array.isArray(data) ? data : [], loading: false }) as any);
      },
      {
        onError: (error: Error) => {
          logger.error('[HRSync] Staff Sync Failed', error);
        }
      }
    );

    // 1. SHIFT ENTRIES (CLOCK-IN/OUT)
    this.private_listeners.hr = Nexus.adapter.onSnapshot(
      path('shiftEntries'),
      (data: any) => {
        store.set(shiftLogsNodeAtom as any, (prev: any) => updateNexusNode(prev, { data: Array.isArray(data) ? data : [], loading: false }) as any);
      },
      {
        orderBy: { field: 'timestamp', direction: 'desc' },
        limit: 100,
        onError: (error: Error) => {
          logger.error('[HRSync] HR Entries Sync Failed', error);
        }
      }
    );

    // 2. PLANNED SHIFTS
    this.private_listeners.planned_shifts = Nexus.adapter.onSnapshot(
      path('shifts'),
      (data: any) => {
        store.set(shiftsNodeAtom as any, (prev: any) => updateNexusNode(prev, { data: Array.isArray(data) ? data : [], loading: false }) as any);
      },
      {
        onError: (error: Error) => {
          logger.error('[HRSync] Planned Shifts Sync Failed', error);
        }
      }
    );

    // 3. LEAVES SYNC
    this.private_listeners.leaves = Nexus.adapter.onSnapshot(
      path('leaveRequests'),
      (data: any) => {
        store.set(leaveRequestsNodeAtom as any, (prev: any) => updateNexusNode(prev, { data: Array.isArray(data) ? data : [], loading: false }) as any);
      },
      {
        onError: (error: Error) => {
          logger.error('[HRSync] Leaves Sync Failed', error);
        }
      }
    );

    this.private_listeners.balances = Nexus.adapter.onSnapshot(
      path('leaveBalances'),
      (data: any) => {
        store.set(leaveBalancesNodeAtom as any, (prev: any) => updateNexusNode(prev, { data: Array.isArray(data) ? data : [], loading: false }) as any);
      },
      {
        onError: (error: Error) => {
          logger.error('[HRSync] Balances Sync Failed', error);
        }
      }
    );
  },

  stop() {
    Object.values(this.private_listeners).forEach((unsub: any) => {
        if (typeof unsub === 'function') unsub();
    });
    this.private_listeners = {};
  }
};
