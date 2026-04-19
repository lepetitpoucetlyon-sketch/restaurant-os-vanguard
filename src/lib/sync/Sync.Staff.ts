import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { 
    staffMembersNodeAtom, 
    shiftsNodeAtom, 
    activeShiftsNodeAtom, 
    leaveRequestsNodeAtom, 
    leaveBalancesNodeAtom,
    updateNexusNode 
} from '@/store/operationalAtoms';

export const SyncStaff = {
  private_listeners: {} as Record<string, () => void>,

  async init(tenantId: string, store: any) {
    const path = (coll: string) => Nexus.getTenantPath(coll, tenantId);
    logger.debug(`[Sync.Staff] Initializing for ${tenantId}...`);

    // 1. Staff Members (Users)
    this.private_listeners.staff = Nexus.adapter.onSnapshot(
      path('users'),
      (data: any[]) => {
        store.set(staffMembersNodeAtom, (prev: any) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        onError: (error: any) => {
          logger.error('[Sync.Staff] Staff Sync Failed', error);
          store.set(staffMembersNodeAtom, (prev: any) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    // 2. Planning / Shifts
    this.private_listeners.shifts = Nexus.adapter.onSnapshot(
      path('shifts'),
      (data: any[]) => {
        store.set(shiftsNodeAtom, (prev: any) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        onError: (error: any) => {
          logger.error('[Sync.Staff] Shifts Sync Failed', error);
          store.set(shiftsNodeAtom, (prev: any) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    // 3. Active Real-time Shifts (Clock-ins)
    this.private_listeners.activeShifts = Nexus.adapter.onSnapshot(
      path('activeShifts'),
      (data: any[]) => {
        store.set(activeShiftsNodeAtom, (prev: any) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        onError: (error: any) => {
          logger.error('[Sync.Staff] ActiveShifts Sync Failed', error);
          store.set(activeShiftsNodeAtom, (prev: any) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    // 4. Leave Requests
    this.private_listeners.leaveRequests = Nexus.adapter.onSnapshot(
      path('leaveRequests'),
      (data: any[]) => {
        store.set(leaveRequestsNodeAtom, (prev: any) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        onError: (error: any) => {
          logger.error('[Sync.Staff] LeaveRequests Sync Failed', error);
          store.set(leaveRequestsNodeAtom, (prev: any) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );

    // 5. Leave Balances
    this.private_listeners.leaveBalances = Nexus.adapter.onSnapshot(
      path('leaveBalances'),
      (data: any[]) => {
        store.set(leaveBalancesNodeAtom, (prev: any) => updateNexusNode(prev, { data, loading: false }));
      },
      {
        onError: (error: any) => {
          logger.error('[Sync.Staff] LeaveBalances Sync Failed', error);
          store.set(leaveBalancesNodeAtom, (prev: any) => updateNexusNode(prev, { loading: false, error: error.message }));
        }
      }
    );
  },

  stop() {
    Object.values(this.private_listeners).forEach(unsub => unsub());
    this.private_listeners = {};
    logger.debug('[Sync.Staff] Stopped.');
  }
};
