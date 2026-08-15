import { useState, useEffect, useCallback, useRef } from 'react';
import { TableLockService, type TableLockData } from '../services/TableLockService';

export interface UseTableLockOptions {
  tenantId: string;
  tableId: string | null;
  operatorId: string;
  operatorName?: string;
  autoAcquire?: boolean;
  ttlMs?: number;
}

export function useTableLock({
  tenantId,
  tableId,
  operatorId,
  operatorName,
  autoAcquire = true,
  ttlMs = 2 * 60 * 1000,
}: UseTableLockOptions) {
  const [isLockedByMe, setIsLockedByMe] = useState(false);
  const [isLockedByOther, setIsLockedByOther] = useState(false);
  const [lockHolder, setLockHolder] = useState<TableLockData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);

  const acquire = useCallback(async () => {
    if (!tenantId || !tableId || !operatorId) return false;

    setIsLoading(true);
    const result = await TableLockService.acquireLock(
      tenantId,
      tableId,
      operatorId,
      operatorName,
      'order_in_progress',
      ttlMs
    );
    setIsLoading(false);

    if (result.success) {
      setIsLockedByMe(true);
      setIsLockedByOther(false);
      setLockHolder(result.lock || null);
      return true;
    } else {
      setIsLockedByMe(false);
      setIsLockedByOther(true);
      setLockHolder(result.holder || null);
      return false;
    }
  }, [tenantId, tableId, operatorId, operatorName, ttlMs]);

  const release = useCallback(
    async (force: boolean = false) => {
      if (!tenantId || !tableId || !operatorId) return;
      if (heartbeatTimer.current) {
        clearInterval(heartbeatTimer.current);
        heartbeatTimer.current = null;
      }
      await TableLockService.releaseLock(tenantId, tableId, operatorId, force);
      setIsLockedByMe(false);
      setIsLockedByOther(false);
      setLockHolder(null);
    },
    [tenantId, tableId, operatorId]
  );

  // Auto-acquire & Heartbeat
  useEffect(() => {
    if (!autoAcquire || !tableId || !tenantId || !operatorId) {
      setIsLockedByMe(false);
      setIsLockedByOther(false);
      setLockHolder(null);
      return;
    }

    void acquire();

    // Heartbeat every 30 seconds to maintain lock
    heartbeatTimer.current = setInterval(() => {
      void TableLockService.heartbeat(tenantId, tableId, operatorId, ttlMs);
    }, 30000);

    return () => {
      if (heartbeatTimer.current) {
        clearInterval(heartbeatTimer.current);
        heartbeatTimer.current = null;
      }
      void TableLockService.releaseLock(tenantId, tableId, operatorId, false);
    };
  }, [autoAcquire, tableId, tenantId, operatorId, acquire, ttlMs]);

  return {
    isLockedByMe,
    isLockedByOther,
    lockHolder,
    isLoading,
    acquire,
    release,
  };
}
