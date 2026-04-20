import { getDefaultStore } from 'jotai';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { 
    User,
    Shift,
    LeaveRequest,
    LeaveBalance
} from '@/types';
import { 
    staffMembersNodeAtom, 
    shiftsNodeAtom, 
    activeShiftsNodeAtom, 
    leaveRequestsNodeAtom, 
    leaveBalancesNodeAtom,
    updateNexusNode 
} from '@/store/operationalAtoms';

type JotaiStore = ReturnType<typeof getDefaultStore>;

export const SyncStaff = {
  private_listeners: {} as Record<string, () => void>,

  async init(tenantId: string, store: JotaiStore) {
    const path = (coll: string) => Nexus.getTenantPath(coll, tenantId);
    logger.debug(`[Sync.Staff] Initializing for ${tenantId}...`);

    // 1. Staff Members (Users)
    this.private_listeners.staff = Nexus.adapter.onSnapshot(
      path('users'),
      (data: User[]) => {
        store.set(staffMembersNodeAtom, (prev) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        onError: (error: Error) => {
          logger.error('[Sync.Staff] Staff Sync Failed', error);
          store.set(staffMembersNodeAtom, (prev) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    // 2. Planning / Shifts
    this.private_listeners.shifts = Nexus.adapter.onSnapshot(
      path('shifts'),
      (data: Shift[]) => {
        store.set(shiftsNodeAtom, (prev) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        onError: (error: Error) => {
          logger.error('[Sync.Staff] Shifts Sync Failed', error);
          store.set(shiftsNodeAtom, (prev) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    // 3. Active Real-time Shifts (Clock-ins)
    this.private_listeners.activeShifts = Nexus.adapter.onSnapshot(
      path('activeShifts'),
      (data: Shift[]) => {
        store.set(activeShiftsNodeAtom, (prev) => updateNexusNode(prev, { data: data as any, loading: false }));
      },
      {
        onError: (error: Error) => {
          logger.error('[Sync.Staff] ActiveShifts Sync Failed', error);
          store.set(activeShiftsNodeAtom, (prev) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    // 4. Leave Requests
    this.private_listeners.leaveRequests = Nexus.adapter.onSnapshot(
      path('leaveRequests'),
      (data: LeaveRequest[]) => {
        store.set(leaveRequestsNodeAtom, (prev) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        onError: (error: Error) => {
          logger.error('[Sync.Staff] LeaveRequests Sync Failed', error);
          store.set(leaveRequestsNodeAtom, (prev) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    // 5. Leave Balances
    this.private_listeners.leaveBalances = Nexus.adapter.onSnapshot(
      path('leaveBalances'),
      (data: LeaveBalance[]) => {
        store.set(leaveBalancesNodeAtom, (prev) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        onError: (error: Error) => {
          logger.error('[Sync.Staff] LeaveBalances Sync Failed', error);
          store.set(leaveBalancesNodeAtom, (prev) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );
  },

  stop() {
    Object.values(this.private_listeners).forEach((unsub) => {
      if (typeof unsub === 'function') unsub();
    });
    this.private_listeners = {};
    logger.debug('[Sync.Staff] Stopped.');
  }

};
