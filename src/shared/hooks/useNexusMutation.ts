"use client";

import { useSetAtom, WritableAtom } from 'jotai';
import { useCallback } from 'react';
import { updateNexusNode, emitPulseAtom } from '@/store/pillars/core';
import { NexusNode } from '@/store/base';
import { validateMutation } from '@shared/nexus/engines/MutationValidator';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

import { canDoAtom } from '@shared/nexus/state/SovereignGenome';
import { DomainRegistry } from '@shared/nexus/engines/DomainRegistry';
import { useAtomValue } from 'jotai';

/**
 * 🔨 useNexusMutation - The Sovereign Forge v3 (Génétique)
 * Orchestre les mutations atomiques avec validation génomique (Zod)
 * et diffusion de Pulses réactifs.
 * GRADE X: Suture RBAC active.
 */
export function useNexusMutation<T extends { id: string } & import("@shared/nexus-contract").SovereignMap>(
    nodeAtom: WritableAtom<NexusNode<T>, [NexusNode<T> | ((prev: NexusNode<T>) => NexusNode<T>)], void>, 
    key: string, 
    moduleId: string = 'CORE'
) {
    const setNode = useSetAtom(nodeAtom);
    const emitPulse = useSetAtom(emitPulseAtom);
    const canDo = useAtomValue(canDoAtom);


    const mutate = useCallback(async (
        action: 'SET' | 'UPDATE' | 'DELETE',
        id: string,
        payload?: Partial<T>,
        options: { pulseType?: string; silent?: boolean; skipValidation?: boolean } = {}
    ) => {
        const mutationId = uuidv4();
        const timestamp = new Date().toISOString();

        // 🛡️ 0. RBAC MANDATE CHECK (Lockdown-X)
        const permission = DomainRegistry.getMetadata(key).requiredPermission;
        if (!canDo(permission)) {
            const breachMsg = `[LOCKDOWN-X] AUTH_BREACH in ${moduleId}:${key}. User lacks [${permission}] mandate. Mutation ABORTED.`;
            logger.error(breachMsg);
            throw new Error(breachMsg);
        }

        // 🧬 1. VALIDATION GÉNOMIQUE
        if (!options.skipValidation && (action === 'SET' || action === 'UPDATE')) {
            const validation = validateMutation(moduleId, key, (payload || {}) as import("@shared/nexus-contract").SovereignData);
            if (!validation.success) {
                const errorMsg = `[FORGE v3] VALIDATION ERROR in ${moduleId}:${key}: ${validation.errors?.join(', ')}`;
                logger.error(errorMsg);
                throw new Error(errorMsg);
            }
        }

        logger.info(`[FORGE v3] Mutation ${mutationId} - ${moduleId}:${key} (Validated)`);

        try {
            // 2. ATOMIC LOCAL UPDATE
            setNode((prev: NexusNode<T>) => {
                let newData = [...prev.data];

                if (action === 'SET') {
                    const existingIndex = newData.findIndex((item: T) => item.id === id);
                    const newItem = { 
                        ...(payload as T), 
                        id, 
                        _mutationMetadata: { mutationId, timestamp, moduleId } 
                    };
                    
                    if (existingIndex !== -1) {
                        logger.warn(`[FORGE v3] IDEMPOTENCE: Resource ${id} already exists in ${moduleId}:${key}. Merging instead of adding.`);
                        newData[existingIndex] = { ...newData[existingIndex], ...newItem };
                    } else {
                        newData = [newItem, ...newData];
                    }
                } else if (action === 'UPDATE') {
                    newData = newData.map((item: T) => 
                        item.id === id ? { ...item, ...(payload as Partial<T>) } : item
                    );
                } else if (action === 'DELETE') {
                    newData = newData.filter((item: T) => item.id !== id);
                }

                return updateNexusNode(prev, { data: newData });
            });

            // 3. BROADCAST PULSE
            if (!options.silent) {
                emitPulse({
                    type: options.pulseType || `${moduleId}_${action}_${key.toUpperCase()}`,
                    sourceModule: moduleId,
                    payload: { id, action, data: payload }
                });
            }

            return { success: true, mutationId };
        } catch (error) {
            logger.error(`[FORGE v3] Mutation ${mutationId} FAILED.`, error);
            throw error;
        }
    }, [setNode, emitPulse, key, moduleId]);

    return { mutate };
}
