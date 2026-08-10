import { describe, it, expect } from 'vitest';
import { processTimeclockAction, TimeclockPayload } from './timeclock.domain';

describe('timeclock.domain', () => {
    const basePayload: TimeclockPayload = {
        userId: 'u1',
        userName: 'John Doe',
        tenantId: 'tenant-1',
        terminalId: 'kiosk-1',
        timestamp: '2026-01-01T10:00:00.000Z',
    };

    it('returns EVENT for CLOCK_IN', () => {
        const result = processTimeclockAction('CLOCK_IN', basePayload, () => 'id1');
        expect(result.type).toBe('EVENT');
        if (result.type === 'EVENT') {
            expect(result.eventName).toBe('staff.clock_in');
            expect(result.payload.tenantId).toBe('tenant-1');
        }
    });

    it('returns EVENT for CLOCK_OUT', () => {
        const result = processTimeclockAction('CLOCK_OUT', basePayload, () => 'id1');
        expect(result.type).toBe('EVENT');
        if (result.type === 'EVENT') {
            expect(result.eventName).toBe('staff.clock_out');
        }
    });

    it('returns DB_WRITE for BREAK_START', () => {
        const result = processTimeclockAction('BREAK_START', basePayload, () => 'id123');
        expect(result.type).toBe('DB_WRITE');
        if (result.type === 'DB_WRITE') {
            expect(result.path).toBe('tenants/tenant-1/shiftEntries/id123');
            expect(result.payload.type).toBe('BREAK_START');
            expect(result.payload.id).toBe('id123');
        }
    });

    it('returns DB_WRITE for BREAK_END with default tenant fallback', () => {
        const result = processTimeclockAction('BREAK_END', { ...basePayload, tenantId: 'default' }, () => 'id999');
        expect(result.type).toBe('DB_WRITE');
        if (result.type === 'DB_WRITE') {
            expect(result.path).toBe('shiftEntries/id999');
            expect(result.payload.type).toBe('BREAK_END');
        }
    });
});
