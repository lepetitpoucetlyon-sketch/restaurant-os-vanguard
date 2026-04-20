import { WritableAtom, useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { SyncManager } from '@/lib/offline/sync-manager';
import { logger } from '@/lib/logger';
import { updateNexusNode, NexusNode } from './nexusNodeFactory';

export type NexusNodeAtom<T> = WritableAtom<NexusNode<T>, [updates: (prev: NexusNode<T>) => NexusNode<T>], void>;

interface MutationOptions<T> {
    optimistic?: boolean;
    audit?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
}

/**
 * 🔨 useNexusMutation - La Forge de Souveraineté
 * Orchestre les mutations d'état avec une garantie transactionnelle locale.
 * Sécurise le "Ticket Fantôme" via la SyncQueue.
 */
export function useNexusMutation<T>(
    nodeAtom: NexusNodeAtom<T>,
    collection: string,
    moduleId: string
) {
    const setNode = useSetAtom(nodeAtom);

    const mutate = useCallback(async (
        action: 'SET' | 'UPDATE' | 'DELETE',
        targetId: string,
        payload: any,
        options: MutationOptions<T> = { optimistic: true, audit: true }
    ) => {
        const mutationId = `mut_${crypto.randomUUID()}`;
        const timestamp = new Date().toISOString();

        if (options.audit) {
            logger.info(`[FORGE] Mutation Initiated`, { mutationId, moduleId, action, targetId });
        }

        try {
            // 1. MISE À JOUR OPTIMISTE (UI)
            if (options.optimistic) {
                setNode(prev => {
                    const newData = [...(prev.data as any[])];
                    if (action === 'SET') {
                        newData.unshift({ ...payload, id: targetId, _pending: true, _at: timestamp });
                    } else if (action === 'UPDATE') {
                        const idx = newData.findIndex((item: any) => item.id === targetId);
                        if (idx !== -1) {
                            newData[idx] = { ...newData[idx], ...payload, _pending: true, _updatedAt: timestamp };
                        }
                    } else if (action === 'DELETE') {
                        const idx = newData.findIndex((item: any) => item.id === targetId);
                        if (idx !== -1) newData.splice(idx, 1);
                    }
                    return updateNexusNode(prev, { data: newData });
                });
            }

            // 2. ENQUEUE TRANSACTIONNELLE (Dexie)
            await SyncManager.enqueue({
                type: `DOMAIN_MUTATION_${moduleId.toUpperCase()}`,
                action,
                collection,
                targetId,
                payload: {
                    ...payload,
                    _mutationMetadata: {
                        mutationId,
                        timestamp,
                        moduleId,
                        origin: 'NexusForge_v1'
                    }
                }
            });

            if (options.onSuccess) options.onSuccess(payload);
            
            if (options.audit) {
                logger.info(`[FORGE] Mutation Locally Secured`, { mutationId, targetId });
            }

        } catch (error: any) {
            logger.error(`[FORGE] Mutation Failure`, { mutationId, error: error.message });
            
            // ROLLBACK / MARK ERROR
            if (options.optimistic) {
                setNode(prev => updateNexusNode(prev, { error: `Forge Error: ${error.message}` }));
            }

            if (options.onError) options.onError(error);
            throw error;
        }
    }, [setNode, collection, moduleId]);

    return { mutate };
}
