"use client";

/**
 * useSovereignLoyalty — Adapter souverain pour `loyaltyAccounts` (fidélité).
 * ADR-012 Phase 4.
 */

import { useCallback, useMemo } from 'react';
import { useSovereignCollection } from '@/kernel/hooks/useSovereignCollection';
import type { LoyaltyAccount } from '../domain/schemas/loyalty';

export type SovereignLoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface UseSovereignLoyaltyOptions {
    tenantId: string;
    tier?: SovereignLoyaltyTier;
    autoSync?: boolean;
}

export interface CreateLoyaltyAccountInput {
    subjectId: string;
    initialPoints?: number;
    tier?: SovereignLoyaltyTier;
}

export interface UseSovereignLoyaltyResult {
    data: LoyaltyAccount[];
    isLoading: boolean;
    isSyncing: boolean;
    error: string | null;

    create: (input: CreateLoyaltyAccountInput) => Promise<string>;
    earn: (id: string, points: number) => Promise<void>;
    redeem: (id: string, points: number) => Promise<void>;
    setTier: (id: string, tier: SovereignLoyaltyTier) => Promise<void>;
    remove: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
}

const nowIso = () => new Date().toISOString();

export function useSovereignLoyalty(options: UseSovereignLoyaltyOptions): UseSovereignLoyaltyResult {
    const { tenantId, tier, autoSync } = options;

    const filter = useMemo(() => {
        if (!tier) return undefined;
        return (a: LoyaltyAccount) => a.tier === tier;
    }, [tier]);

    const {
        data, isLoading, isSyncing, error,
        set, update, delete: del, refresh,
    } = useSovereignCollection<LoyaltyAccount>('loyaltyAccounts', { tenantId, autoSync, filter });

    const create = useCallback(async (input: CreateLoyaltyAccountInput): Promise<string> => {
        const id = `loy_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const initial = input.initialPoints ?? 0;
        const account: LoyaltyAccount = {
            id,
            tenantId,
            subjectId: input.subjectId,
            points: initial,
            lifetimePoints: initial,
            tier: input.tier ?? 'bronze',
        } as unknown as LoyaltyAccount;
        await set(account);
        return id;
    }, [set, tenantId]);

    const earn = useCallback(async (id: string, points: number) => {
        if (points <= 0) throw new Error('[useSovereignLoyalty] earn points doit être > 0');
        const a = data.find(x => x.id === id);
        if (!a) throw new Error(`[useSovereignLoyalty] Account "${id}" introuvable`);
        await update(id, {
            points: a.points + points,
            lifetimePoints: a.lifetimePoints + points,
            lastEarnedAt: nowIso(),
        } as Partial<LoyaltyAccount>);
    }, [data, update]);

    const redeem = useCallback(async (id: string, points: number) => {
        if (points <= 0) throw new Error('[useSovereignLoyalty] redeem points doit être > 0');
        const a = data.find(x => x.id === id);
        if (!a) throw new Error(`[useSovereignLoyalty] Account "${id}" introuvable`);
        if (a.points < points) throw new Error(`[useSovereignLoyalty] Solde insuffisant (${a.points} < ${points})`);
        await update(id, {
            points: a.points - points,
            lastRedeemedAt: nowIso(),
        } as Partial<LoyaltyAccount>);
    }, [data, update]);

    const setTier = useCallback(async (id: string, tier: SovereignLoyaltyTier) => {
        await update(id, { tier } as Partial<LoyaltyAccount>);
    }, [update]);

    return {
        data, isLoading, isSyncing, error,
        create, earn, redeem, setTier,
        remove: del, refresh,
    };
}
