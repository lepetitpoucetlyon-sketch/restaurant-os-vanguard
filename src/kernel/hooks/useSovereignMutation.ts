'use client';

import { useState, useCallback } from 'react';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { OutboxService } from '@/lib/offline/OutboxService';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { NF525_IMMUTABLE_COLLECTIONS } from '@/infrastructure/services/backup/SnapshotService';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

export interface SovereignMutationOptions<T> {
  tenantId: string;
  collectionName: string;
  onSuccess?: (item: T) => void;
  onError?: (error: Error) => void;
}

export interface SovereignMutationResult<T> {
  mutate: (action: 'SET' | 'UPDATE' | 'DELETE', id: string, payload?: Partial<T>) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * ⚡ useSovereignMutation — Pipeline de mutation optimiste universel
 * 
 * Exécute :
 * 1. Vérification d'inaltérabilité NF525
 * 2. Écriture optimiste locale
 * 3. Enfilement dans l'Outbox Dexie pour résilience hors-ligne
 * 4. Synchronisation Cloud idempotente
 */
export function useSovereignMutation<T extends { id?: string }>(
  options: SovereignMutationOptions<T>
): SovereignMutationResult<T> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { tenantId, collectionName, onSuccess, onError } = options;

  if (NF525_IMMUTABLE_COLLECTIONS.has(collectionName)) {
    throw new Error(
      `[useSovereignMutation] VIOLATION NF525 : La collection fiscale "${collectionName}" est strictement immuable (WORM).`
    );
  }

  const mutate = useCallback(
    async (action: 'SET' | 'UPDATE' | 'DELETE', id: string, payload?: Partial<T>) => {
      setIsLoading(true);
      setError(null);

      const path = `tenants/${tenantId}/${collectionName}/${id}`;

      try {
        if (action === 'SET' && payload) {
          await Nexus.adapter.set(path, payload);
          await OutboxService.enqueue({
            action: 'SET',
            collection: `tenants/${tenantId}/${collectionName}`,
            targetId: id,
            payload: payload as Record<string, unknown>,
          });
          if (onSuccess) onSuccess(payload as T);
        } else if (action === 'UPDATE' && payload) {
          await Nexus.adapter.update(path, payload);
          await OutboxService.enqueue({
            action: 'UPDATE',
            collection: `tenants/${tenantId}/${collectionName}`,
            targetId: id,
            payload: payload as Record<string, unknown>,
          });
          if (onSuccess) onSuccess(payload as T);
        } else if (action === 'DELETE') {
          await Nexus.adapter.delete(path);
          await OutboxService.enqueue({
            action: 'DELETE',
            collection: `tenants/${tenantId}/${collectionName}`,
            targetId: id,
            payload: {},
          });
        }
      } catch (err) {
        const errorObj = toError(err);
        logger.error(`[useSovereignMutation] Mutation error on ${path}`, errorObj.message);
        setError(errorObj);
        if (onError) onError(errorObj);
        throw errorObj;
      } finally {
        setIsLoading(false);
      }
    },
    [tenantId, collectionName, onSuccess, onError]
  );

  return { mutate, isLoading, error };
}
