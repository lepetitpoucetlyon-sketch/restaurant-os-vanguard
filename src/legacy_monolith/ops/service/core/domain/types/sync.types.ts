export type SyncStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type SyncActionType = 'CREATE_ORDER' | 'UPDATE_ORDER' | 'CANCEL_ORDER' | 'SYNC_CATALOG';

export interface ISyncQueueItem<T = unknown> {
  id: string; // Unique UUID for the sync item
  tenantId: string;
  actionType: SyncActionType;
  payload: T;
  status: SyncStatus;
  retryCount: number;
  lastAttemptAt?: Date;
  createdAt: Date;
  errorReason?: string;
}

export interface INetworkState {
  isOnline: boolean;
  lastSyncAt: Date | null;
  pendingItemsCount: number;
}
