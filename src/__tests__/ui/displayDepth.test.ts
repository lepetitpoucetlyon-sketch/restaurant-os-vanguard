import { describe, it, expect } from 'vitest';
import { DisplayDepthSchema, type DisplayDepthLevel } from '@/shared/nexus/state/displayDepth';

describe('DisplayDepth System & Progressive Disclosure', () => {
    it('validates correct display depth levels', () => {
        expect(DisplayDepthSchema.parse('essential')).toBe('essential');
        expect(DisplayDepthSchema.parse('manager')).toBe('manager');
        expect(DisplayDepthSchema.parse('enterprise')).toBe('enterprise');
    });

    it('defaults to manager when undefined', () => {
        expect(DisplayDepthSchema.parse(undefined)).toBe('manager');
    });

    it('rejects invalid depth levels', () => {
        expect(() => DisplayDepthSchema.parse('super_expert')).toThrow();
    });

    it('supports switching progression essential -> manager -> enterprise -> essential', () => {
        const cycle: DisplayDepthLevel[] = ['essential', 'manager', 'enterprise'];
        const getNext = (curr: DisplayDepthLevel): DisplayDepthLevel => {
            if (curr === 'essential') return 'manager';
            if (curr === 'manager') return 'enterprise';
            return 'essential';
        };

        expect(getNext('essential')).toBe('manager');
        expect(getNext('manager')).toBe('enterprise');
        expect(getNext('enterprise')).toBe('essential');
    });
});
