import { Nexus } from '@/lib/nexus/NexusAdapter';
import { updateNexusNode } from "@/store/nexusNodeFactory";
import { User, Shift, LeaveRequest, LeaveBalance, ShiftLog } from '@/types';
import { 
    shiftLogsNodeAtom, 
    activeShiftsNodeAtom, 
    shiftsNodeAtom, 
    leaveRequestsNodeAtom, 
    leaveBalancesNodeAtom,
    staffMembersNodeAtom 
} from './store/hrAtoms';
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
      (data: ShiftLog[]) => {
        const entries = Array.isArray(data) ? data : [];
        
        // Compute active shifts locally from the stream
        const activeMap = new Map<string, ShiftLog>();
        [...entries].reverse().forEach((entry) => {
          if (entry.type === 'clock_in') activeMap.set(entry.userId, entry);
          else if (entry.type === 'clock_out') activeMap.delete(entry.userId);
        });
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
      (data: Shift[]) => {
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
      (data: LeaveRequest[]) => {
      },
      {
        onError: (error: Error) => {
          logger.error('[HRSync] Leaves Sync Failed', error);
        }
      }
    );

    this.private_listeners.balances = Nexus.adapter.onSnapshot(
      path('leaveBalances'),
      (data: LeaveBalance[]) => {
      },
      {
        onError: (error: Error) => {
          logger.error('[HRSync] Balances Sync Failed', error);
        }
      }
    );
  },

  stop() {
    Object.values(this.private_listeners).forEach((unsub) => unsub());
    this.private_listeners = {};
  }
};
