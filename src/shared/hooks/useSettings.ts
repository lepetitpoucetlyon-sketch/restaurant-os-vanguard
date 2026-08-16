import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { 
    globalSettingsAtom, 
    settingsLoadingAtom, 
    settingsSavingAtom, 
    settingsLastSavedAtom 
} from '@/store/settingsAtoms';
import { SettingsManager } from '@/lib/SettingsManager';
import { GlobalSettings } from '@nexus/contracts';
import { BusinessIdentity } from '@nexus/contracts/settings/identity';

/**
 * 🛰️ useSettings - Grade VI Atomic Bridge
 * Connects UI components directly to the settings state atoms.
 */
export const useSettings = () => {
    const settings = useAtomValue(globalSettingsAtom);
    const isLoading = useAtomValue(settingsLoadingAtom);
    const isSaving = useAtomValue(settingsSavingAtom);
    const lastSaved = useAtomValue(settingsLastSavedAtom);
    
    const setSettings = useSetAtom(globalSettingsAtom);
    const setSaving = useSetAtom(settingsSavingAtom);
    const setLastSaved = useSetAtom(settingsLastSavedAtom);

    const updateSettings = useCallback(async (newSettings: GlobalSettings) => {
        setSaving(true);
        try {
            const savedAt = await SettingsManager.saveSettings(newSettings);
            if (savedAt) setLastSaved(savedAt instanceof Date ? savedAt : new Date(savedAt));
            setSettings(newSettings);
        } finally {
            setSaving(false);
        }
    }, [setSettings, setSaving, setLastSaved]);

    const updateConfig = useCallback(async <K extends keyof GlobalSettings>(key: K, data: GlobalSettings[K]) => {
        if (!settings) return;
        const newSettings = {
            ...settings,
            [key]: data
        };
        return updateSettings(newSettings);
    }, [settings, updateSettings]);

    const updateList = useCallback(async <K extends keyof GlobalSettings>(key: K, data: GlobalSettings[K]) => {
        return updateConfig(key, data);
    }, [updateConfig]);

    const updateSLM = useCallback(async (data: import('@/shared/nexus-contract').SovereignData) => {
        if (!settings) return;
        return updateSettings({ ...settings, ...data } as GlobalSettings);
    }, [settings, updateSettings]);

    const updateReservationConfig = useCallback(async (data: Partial<import('@nexus/contracts').ReservationSettings>) => {
        return updateConfig('reservationConfig', data as GlobalSettings['reservationConfig']);
    }, [updateConfig]);

    const updateReservationSlots = useCallback(async (data: Partial<import('@nexus/contracts').ReservationSlotSettings>) => {
        return updateConfig('reservationSlots', data as GlobalSettings['reservationSlots']);
    }, [updateConfig]);
    
    const updateSchedule = useCallback(async (data: import('@nexus/contracts').DaySchedule[]) => {
        return updateConfig('schedule', data);
    }, [updateConfig]);

    const updateService = useCallback(async (data: import('@nexus/contracts').ServiceSettings) => {
        return updateConfig('service', data);
    }, [updateConfig]);

    const addClosedPeriod = useCallback(async (period: import('@nexus/contracts').ClosedPeriod) => {
        if (!settings) return;
        const newPeriods = [...(settings.closedPeriods || []), period];
        return updateConfig('closedPeriods', newPeriods);
    }, [settings, updateConfig]);

    const deleteClosedPeriod = useCallback(async (id: string) => {
        if (!settings) return;
        const newPeriods = (settings.closedPeriods || []).filter(p => p.id !== id);
        return updateConfig('closedPeriods', newPeriods);
    }, [settings, updateConfig]);

    const updateIdentity = useCallback(async (data: BusinessIdentity) => {
        return updateConfig('identity', data);
    }, [updateConfig]);

    const updateGoals = useCallback(async (data: GlobalSettings['goals']) => {
        return updateConfig('goals', data);
    }, [updateConfig]);

    return {
        settings,
        isLoading,
        isSaving,
        lastSaved: lastSaved ? new Date(lastSaved) : null,
        updateSettings,
        updateConfig,
        updateList,
        updateSLM,
        updateIdentity,
        updateSchedule,
        updateService,
        addClosedPeriod,
        deleteClosedPeriod,
        updateReservationConfig,
        updateReservationSlots,
        updateGoals
    };
};
