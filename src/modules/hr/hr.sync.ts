import { Nexus } from '@/lib/nexus/NexusAdapter';
import { User, Shift, LeaveRequest, LeaveBalance, ShiftLog } from '@/types';
import { 
    shiftLogsNodeAtom, 
    activeShiftsNodeAtom, 
    shiftsNodeAtom, 
    leaveRequestsNodeAtom, 
    leaveBalancesNodeAtom,
    staffMembersNodeAtom,
    updateNexusNode 
} from '../store/hrAtoms';
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
      (data: User[]) => {
        store.set(staffMembersNodeAtom, (prev) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        onError: (error: Error) => {
          logger.error('[HRSync] Staff Sync Failed', error);
          store.set(staffMembersNodeAtom, (prev) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    // 1. SHIFT ENTRIES (CLOCK-IN/OUT)
    this.private_listeners.hr = Nexus.adapter.onSnapshot(
      path('shiftEntries'),
      (data: ShiftLog[]) => {
        const entries = Array.isArray(data) ? data : [];
        store.set(shiftLogsNodeAtom, (prev) => updateNexusNode(prev, { data: entries, loading: false }));
        
        // Compute active shifts locally from the stream
        const activeMap = new Map<string, ShiftLog>();
        [...entries].reverse().forEach((entry) => {
          if (entry.type === 'clock_in') activeMap.set(entry.userId, entry);
          else if (entry.type === 'clock_out') activeMap.delete(entry.userId);
        });
        store.set(activeShiftsNodeAtom, (prev) => updateNexusNode(prev, { data: Array.from(activeMap.values()), loading: false }));
      },
      {
        orderBy: { field: 'timestamp', direction: 'desc' },
        limit: 100,
        onError: (error: Error) => {
          logger.error('[HRSync] HR Entries Sync Failed', error);
          store.set(shiftLogsNodeAtom, (prev) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    // 2. PLANNED SHIFTS
    this.private_listeners.planned_shifts = Nexus.adapter.onSnapshot(
      path('shifts'),
      (data: Shift[]) => {
        store.set(shiftsNodeAtom, (prev) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        onError: (error: Error) => {
          logger.error('[HRSync] Planned Shifts Sync Failed', error);
          store.set(shiftsNodeAtom, (prev) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    // 3. LEAVES SYNC
    this.private_listeners.leaves = Nexus.adapter.onSnapshot(
      path('leaveRequests'),
      (data: LeaveRequest[]) => {
        store.set(leaveRequestsNodeAtom, (prev) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        onError: (error: Error) => {
          logger.error('[HRSync] Leaves Sync Failed', error);
          store.set(leaveRequestsNodeAtom, (prev) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    this.private_listeners.balances = Nexus.adapter.onSnapshot(
      path('leaveBalances'),
      (data: LeaveBalance[]) => {
        store.set(leaveBalancesNodeAtom, (prev) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        onError: (error: Error) => {
          logger.error('[HRSync] Balances Sync Failed', error);
          store.set(leaveBalancesNodeAtom, (prev) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );
  },

  stop() {
    Object.values(this.private_listeners).forEach((unsub) => unsub());
    this.private_listeners = {};
  }
};
