"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { OutboxService } from '@/lib/offline/OutboxService';
import { NF525_IMMUTABLE_COLLECTIONS } from '@/infrastructure/services/backup/SnapshotService';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';
import { IDService } from '@/lib/id/IDService';

export interface SovereignCollectionOptions {
    tenantId?: string;
    autoSync?: boolean;
    filter?: (item: any) => boolean;
}

export interface SovereignCollectionResult<T> {
    data: T[];
    isLoading: boolean;
    isSyncing: boolean;
    error: string | null;
    set: (item: T) => Promise<void>;
    update: (id: string, patch: Partial<T>) => Promise<void>;
    delete: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
}

/**
 * 🏛️ useSovereignCollection — Hook de données unifié (Jotai / Mémoire + Dexie + Outbox + Cloud)
 *
 * Règles :
 * 1. Les collections fiscales immuables (journalEntries, fiscalSeals, etc.) sont INTERDITES.
 * 2. Écritures optimistes en local immédiat + enfilement dans OutboxService.
 * 3. Réconciliation en tâche de fond dès que le réseau est disponible.
 */
export function useSovereignCollection<T extends { id: string }>(
    collectionName: string,
    options: SovereignCollectionOptions = {}
): SovereignCollectionResult<T> {
    const [data, setData] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSyncing, setIsSyncing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const isMounted = useRef<boolean>(true);

    // 🛡️ Garde-fou NF525 : Rejeter immédiatement les collections fiscales immuables
    if (NF525_IMMUTABLE_COLLECTIONS.has(collectionName)) {
        throw new Error(
            `[useSovereignCollection] VIOLATION NF525 : La collection fiscale "${collectionName}" est strictement immuable (WORM) et ne peut pas être manipulée par useSovereignCollection.`
        );
    }

    const tenantId = options.tenantId ?? 'default';
    const basePath = `tenants/${tenantId}/${collectionName}`;

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const items = await Nexus.adapter.query<T>(basePath);
            if (isMounted.current) {
                const filtered = options.filter ? items.filter(options.filter) : items;
                setData(filtered);
            }
        } catch (err) {
            const e = toError(err);
            logger.warn(`[useSovereignCollection] Lecture locale/cloud pour ${collectionName}`, e.message);
            if (isMounted.current) {
                setError(e.message);
            }
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
            }
        }
    }, [basePath, collectionName, options.filter]);

    useEffect(() => {
        isMounted.current = true;
        loadData();
        return () => {
            isMounted.current = false;
        };
    }, [loadData]);

    const setItem = useCallback(async (item: T) => {
        const itemId = item.id || IDService.generate(collectionName.slice(0, 4));
        const itemWithId = { ...item, id: itemId };

        // 1. Mise à jour optimiste locale immédiate (0 ms)
        setData(prev => {
            const idx = prev.findIndex(i => i.id === itemId);
            if (idx >= 0) {
                const copy = [...prev];
                copy[idx] = itemWithId;
                return copy;
            }
            return [...prev, itemWithId];
        });

        // 2. Enfilement dans l'Outbox locale Dexie
        const eventId = IDService.generateEventId(`${collectionName}.set`, itemId);
        await OutboxService.enqueue({
            action: 'SET',
            collection: basePath,
            targetId: itemId,
            payload: itemWithId as unknown as Record<string, unknown>,
            eventId,
        });

        // 3. Déclenchement de la synchro si autoSync ou online
        if (options.autoSync !== false) {
            setIsSyncing(true);
            OutboxService.drain()
                .catch(err => logger.warn(`[useSovereignCollection] Sync différée pour ${itemId}`, err))
                .finally(() => {
                    if (isMounted.current) setIsSyncing(false);
                });
        }
    }, [basePath, collectionName, options.autoSync]);

    const updateItem = useCallback(async (id: string, patch: Partial<T>) => {
        setData(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item));

        const eventId = IDService.generateEventId(`${collectionName}.update`, id);
        await OutboxService.enqueue({
            action: 'UPDATE',
            collection: basePath,
            targetId: id,
            payload: patch as unknown as Record<string, unknown>,
            eventId,
        });

        if (options.autoSync !== false) {
            setIsSyncing(true);
            OutboxService.drain()
                .catch(err => logger.warn(`[useSovereignCollection] Sync update différée pour ${id}`, err))
                .finally(() => {
                    if (isMounted.current) setIsSyncing(false);
                });
        }
    }, [basePath, collectionName, options.autoSync]);

    const deleteItem = useCallback(async (id: string) => {
        setData(prev => prev.filter(item => item.id !== id));

        const eventId = IDService.generateEventId(`${collectionName}.delete`, id);
        await OutboxService.enqueue({
            action: 'DELETE',
            collection: basePath,
            targetId: id,
            payload: { id },
            eventId,
        });

        if (options.autoSync !== false) {
            setIsSyncing(true);
            OutboxService.drain()
                .catch(err => logger.warn(`[useSovereignCollection] Sync delete différée pour ${id}`, err))
                .finally(() => {
                    if (isMounted.current) setIsSyncing(false);
                });
        }
    }, [basePath, collectionName, options.autoSync]);

    return {
        data,
        isLoading,
        isSyncing,
        error,
        set: setItem,
        update: updateItem,
        delete: deleteItem,
        refresh: loadData,
    };
}
