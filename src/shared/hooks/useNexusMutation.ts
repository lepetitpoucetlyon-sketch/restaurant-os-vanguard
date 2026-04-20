"use client";

import { useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { updateNexusNode, emitPulseAtom } from '@/store/operationalAtoms';
import { validateMutation } from '../validation/SchemaRegistry';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * 🔨 useNexusMutation - The Sovereign Forge v3 (Génétique)
 * Orchestre les mutations atomiques avec validation génomique (Zod)
 * et diffusion de Pulses réactifs.
 */
export function useNexusMutation<T>(
    nodeAtom: any, 
    key: string, 
    moduleId: string = 'CORE'
) {
    const setNode = useSetAtom(nodeAtom);
    const emitPulse = useSetAtom(emitPulseAtom);

    const mutate = useCallback(async (
        action: 'SET' | 'UPDATE' | 'DELETE',
        id: string,
        payload?: Partial<T>,
        options: { pulseType?: string; silent?: boolean; skipValidation?: boolean } = {}
    ) => {
        const mutationId = uuidv4();
        const timestamp = new Date().toISOString();

        // 🧬 1. VALIDATION GÉNOMIQUE
        if (!options.skipValidation && (action === 'SET' || action === 'UPDATE')) {
            const validation = validateMutation(moduleId, key, payload);
            if (!validation.success) {
                const errorMsg = `[FORGE v3] VALIDATION ERROR in ${moduleId}:${key}: ${validation.errors?.join(', ')}`;
                logger.error(errorMsg);
                throw new Error(errorMsg);
            }
        }

        logger.info(`[FORGE v3] Mutation ${mutationId} - ${moduleId}:${key} (Validated)`);

        try {
            // 2. ATOMIC LOCAL UPDATE
            setNode((prev: any) => {
                let newData = [...prev.data];

                if (action === 'SET') {
                    const existingIndex = newData.findIndex((item: any) => item.id === id);
                    const newItem = { 
                        ...(payload as any), 
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
                    newData = newData.map((item: any) => 
                        item.id === id ? { ...item, ...(payload as any) } : item
                    );
                } else if (action === 'DELETE') {
                    newData = newData.filter((item: any) => item.id !== id);
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
