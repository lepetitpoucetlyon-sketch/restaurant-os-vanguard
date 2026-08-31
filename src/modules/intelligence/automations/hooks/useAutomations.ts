"use client";

import { useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { tenantIdAtom } from '@/store/pillars/sovereign';
import { useSovereignCollection } from '@/kernel/hooks/useSovereignCollection';
import { AutomationRuleSchema, type AutomationRule } from '../domain/AutomationRule';
import { IDService } from '@/lib/IDService';

/**
 * useAutomations — CRUD des règles d'automatisation du tenant.
 * Persistance : `tenants/{tenantId}/automations/{id}`.
 */
export function useAutomations() {
    const tenantId = useAtomValue(tenantIdAtom) as string | null;
    const { data, isLoading, set, update, delete: removeItem } = useSovereignCollection<AutomationRule>(
        'automations',
        { tenantId: tenantId ?? '', autoSync: true }
    );

    const create = useCallback(async (input: Omit<AutomationRule, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'executionCount'> & { createdBy: string }) => {
        if (!tenantId) throw new Error('tenantId requis');
        const now = new Date().toISOString();
        const rule: AutomationRule = AutomationRuleSchema.parse({
            ...input,
            id: IDService.generateId('auto'),
            tenantId,
            createdAt: now,
            updatedAt: now,
            executionCount: 0,
        });
        await set(rule);
        return rule;
    }, [tenantId, set]);

    const toggle = useCallback(async (id: string, enabled: boolean) => {
        await update(id, { enabled, updatedAt: new Date().toISOString() });
    }, [update]);

    return {
        automations: data ?? [],
        isLoading,
        create,
        toggle,
        update,
        remove: removeItem,
    };
}
