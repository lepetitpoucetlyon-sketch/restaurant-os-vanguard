import { describe, it, expect, beforeEach } from 'vitest';
import { getDefaultStore } from 'jotai';
import { getSetting, SettingsReader } from '@/lib/settings/SettingsReader';
import { pageSettingsAtom } from '@/store/settingsAtoms';

describe('SettingsReader — Non-React Settings Access', () => {
    const store = getDefaultStore();

    beforeEach(() => {
        store.set(pageSettingsAtom, {});
    });

    it('returns fallback value when setting is not defined', () => {
        const threshold = getSetting('kds', 'overheat_threshold_min', 20);
        expect(threshold).toBe(20);
    });

    it('returns configured setting value when defined in store', () => {
        store.set(pageSettingsAtom, {
            kds: {
                overheat_threshold_min: 35,
            },
        });

        const threshold = getSetting('kds', 'overheat_threshold_min', 20);
        expect(threshold).toBe(35);
    });

    it('supports boolean toggles and complex settings', () => {
        store.set(pageSettingsAtom, {
            pos: {
                table_lock_ttl_sec: 180,
                warn_no_terminal: false,
            },
        });

        expect(SettingsReader.getSetting('pos', 'table_lock_ttl_sec', 120)).toBe(180);
        expect(SettingsReader.getSetting('pos', 'warn_no_terminal', true)).toBe(false);
    });
});
