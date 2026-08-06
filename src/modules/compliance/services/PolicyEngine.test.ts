import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PolicyEngine } from './PolicyEngine';
import type { Policy } from '@/modules/compliance/domain/schemas/policy';

vi.mock('@/config/features', () => ({
    operationalFlags: { policyEnforce: 'enforce' },
}));

const NOW = Date.now();

function makePolicy(overrides: Partial<Policy>): Policy {
    return {
        id: 'policy-1',
        tenantId: 'resto-1',
        type: 'sod',
        name: 'Test Policy',
        enabled: true,
        createdAt: NOW,
        updatedAt: NOW,
        ...overrides,
    };
}

describe('PolicyEngine', () => {
    let engine: PolicyEngine;

    beforeEach(() => {
        engine = new PolicyEngine();
    });

    describe('SoD checks', () => {
        it('blocks same actor from performing incompatible actions (default matrix)', () => {
            const result = engine.checkSod('user-1', 'serveur', 'procurement.payment', [
                { actorId: 'user-1', action: 'procurement.reception' },
            ]);
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('SoD violation');
        });

        it('allows different actors on incompatible actions', () => {
            const result = engine.checkSod('user-2', 'manager', 'procurement.payment', [
                { actorId: 'user-1', action: 'procurement.reception' },
            ]);
            expect(result.allowed).toBe(true);
        });

        it('allows non-conflicting actions by same actor', () => {
            const result = engine.checkSod('user-1', 'manager', 'procurement.reception', [
                { actorId: 'user-1', action: 'pos.sale' },
            ]);
            expect(result.allowed).toBe(true);
        });

        it('uses custom SoD policies', () => {
            engine.loadPolicies([
                makePolicy({
                    type: 'sod',
                    sodRule: {
                        incompatibleActions: ['cash.count', 'cash.validate'],
                        description: 'Compteur ≠ valideur',
                    },
                }),
            ]);

            const result = engine.checkSod('user-1', 'serveur', 'cash.validate', [
                { actorId: 'user-1', action: 'cash.count' },
            ]);
            expect(result.allowed).toBe(false);
        });
    });

    describe('Threshold checks', () => {
        it('blocks action above threshold for low role', () => {
            engine.loadPolicies([
                makePolicy({
                    type: 'threshold',
                    thresholdRule: {
                        action: 'pos.discount',
                        field: 'discountPct',
                        maxValue: 15,
                        requiredRoleLevel: 70,
                    },
                }),
            ]);

            const result = engine.checkThreshold('serveur', 'pos.discount', 'discountPct', 25);
            expect(result.allowed).toBe(false);
            expect(result.requiresElevation).toBe(true);
            expect(result.requiredRoleLevel).toBe(70);
        });

        it('allows action above threshold for high role', () => {
            engine.loadPolicies([
                makePolicy({
                    type: 'threshold',
                    thresholdRule: {
                        action: 'pos.discount',
                        field: 'discountPct',
                        maxValue: 15,
                        requiredRoleLevel: 70,
                    },
                }),
            ]);

            const result = engine.checkThreshold('manager', 'pos.discount', 'discountPct', 25);
            expect(result.allowed).toBe(true);
        });

        it('allows action below threshold for any role', () => {
            engine.loadPolicies([
                makePolicy({
                    type: 'threshold',
                    thresholdRule: {
                        action: 'pos.discount',
                        field: 'discountPct',
                        maxValue: 15,
                        requiredRoleLevel: 70,
                    },
                }),
            ]);

            const result = engine.checkThreshold('serveur', 'pos.discount', 'discountPct', 10);
            expect(result.allowed).toBe(true);
        });
    });

    describe('disabled policies', () => {
        it('ignores disabled policies', () => {
            engine.loadPolicies([
                makePolicy({
                    enabled: false,
                    type: 'sod',
                    sodRule: {
                        incompatibleActions: ['a', 'b'],
                    },
                }),
            ]);

            const result = engine.checkSod('user-1', 'serveur', 'b', [
                { actorId: 'user-1', action: 'a' },
            ]);
            // Only default matrix applies, and a/b aren't in it
            expect(result.allowed).toBe(true);
        });
    });
});
