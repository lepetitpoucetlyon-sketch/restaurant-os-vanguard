"use client";

/**
 * useSovereignStocks — Adapter souverain pour la collection `stocks` (logistics).
 * ADR-011 Phase 3.
 *
 * Cas d'usage : chef qui ajuste le stock en cave sans wifi (casse, perte),
 * livreur qui valide une réception, réassort automatique après vente.
 */

import { useCallback, useMemo } from 'react';
import { useSovereignCollection } from '@/kernel/hooks/useSovereignCollection';
import type { StockItem } from '../domain/schemas/inventory';

export interface UseSovereignStocksOptions {
    tenantId: string;
    supplierId?: string;
    onlyBelowThreshold?: boolean;
    autoSync?: boolean;
}

export interface CreateStockInput {
    name: string;
    unit: StockItem['unit'];
    quantityInStock?: number;
    sku?: string;
    priceInMicrounits?: number;
    supplierId?: string;
    threshold?: number;
    criticalThreshold?: number;
    lotNumber?: string;
    expiryTimestamp?: number;
}

export interface UseSovereignStocksResult {
    data: StockItem[];
    isLoading: boolean;
    isSyncing: boolean;
    error: string | null;

    create: (input: CreateStockInput) => Promise<string>;
    adjustQuantity: (id: string, delta: number, reason?: string) => Promise<void>;
    setQuantity: (id: string, quantity: number) => Promise<void>;
    setThresholds: (id: string, threshold?: number, criticalThreshold?: number) => Promise<void>;
    updatePrice: (id: string, priceInMicrounits: number) => Promise<void>;
    stampAudit: (id: string) => Promise<void>;
    remove: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
}

const now = (): number => Date.now();

export function useSovereignStocks(options: UseSovereignStocksOptions): UseSovereignStocksResult {
    const { tenantId, supplierId, onlyBelowThreshold, autoSync } = options;

    const filter = useMemo(() => {
        if (!supplierId && !onlyBelowThreshold) return undefined;
        return (item: StockItem) => {
            if (supplierId && item.supplierId !== supplierId) return false;
            if (onlyBelowThreshold) {
                const t = item.threshold ?? 0;
                if (item.quantityInStock > t) return false;
            }
            return true;
        };
    }, [supplierId, onlyBelowThreshold]);

    const {
        data, isLoading, isSyncing, error,
        set, update, delete: del, refresh,
    } = useSovereignCollection<StockItem>('stocks', { tenantId, autoSync, filter });

    const create = useCallback(async (input: CreateStockInput): Promise<string> => {
        const id = `stk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const item: StockItem = {
            id,
            type: 'stockItem',
            name: input.name,
            unit: input.unit,
            quantityInStock: input.quantityInStock ?? 0,
            sku: input.sku,
            priceInMicrounits: input.priceInMicrounits as StockItem['priceInMicrounits'],
            supplierId: input.supplierId,
            threshold: input.threshold,
            criticalThreshold: input.criticalThreshold,
            lotNumber: input.lotNumber,
            expiryTimestamp: input.expiryTimestamp,
            schemaVersion: 2,
            updatedAt: now(),
        } as unknown as StockItem;
        await set(item);
        return id;
    }, [set]);

    const adjustQuantity = useCallback(async (id: string, delta: number, _reason?: string) => {
        const item = data.find(s => s.id === id);
        if (!item) throw new Error(`[useSovereignStocks] Stock item "${id}" introuvable`);
        const next = Math.max(0, item.quantityInStock + delta);
        await update(id, {
            quantityInStock: next,
            updatedAt: now(),
        } as unknown as Partial<StockItem>);
    }, [data, update]);

    const setQuantity = useCallback(async (id: string, quantity: number) => {
        if (quantity < 0) throw new Error('[useSovereignStocks] quantityInStock ne peut pas être négatif');
        await update(id, {
            quantityInStock: quantity,
            updatedAt: now(),
        } as unknown as Partial<StockItem>);
    }, [update]);

    const setThresholds = useCallback(async (id: string, threshold?: number, criticalThreshold?: number) => {
        await update(id, {
            threshold,
            criticalThreshold,
            updatedAt: now(),
        } as unknown as Partial<StockItem>);
    }, [update]);

    const updatePrice = useCallback(async (id: string, priceInMicrounits: number) => {
        await update(id, {
            priceInMicrounits: priceInMicrounits as StockItem['priceInMicrounits'],
            updatedAt: now(),
        } as unknown as Partial<StockItem>);
    }, [update]);

    const stampAudit = useCallback(async (id: string) => {
        await update(id, {
            lastAuditDate: now(),
            updatedAt: now(),
        } as unknown as Partial<StockItem>);
    }, [update]);

    return {
        data, isLoading, isSyncing, error,
        create, adjustQuantity, setQuantity, setThresholds, updatePrice, stampAudit,
        remove: del, refresh,
    };
}
