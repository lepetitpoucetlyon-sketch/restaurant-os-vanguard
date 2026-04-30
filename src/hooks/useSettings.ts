import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { 
    globalSettingsAtom, 
    settingsLoadingAtom, 
    settingsSavingAtom, 
    settingsLastSavedAtom 
} from '@/store/settingsAtoms';
import { SettingsManager } from '@domain/services/SettingsManager';
import { GlobalSettings } from '@nexus/contracts';
import { RestaurantIdentity } from '@nexus/contracts/settings/identity';

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
    const setLastSaved = useSetAtom(settingsLastSavedAtom as any);

    const updateSettings = useCallback(async (newSettings: GlobalSettings) => {
        setSaving(true);
        try {
            const savedAt = await SettingsManager.saveSettings(newSettings);
            if (savedAt) setLastSaved(savedAt instanceof Date ? savedAt.toISOString() : savedAt);
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

    const updateSLM = useCallback(async (data: Partial<GlobalSettings>) => {
        if (!settings) return;
        return updateSettings({ ...settings, ...data });
    }, [settings, updateSettings]);
    
    return {
        settings,
        isLoading,
        isSaving,
        lastSaved,
        updateSettings,
        updateConfig,
        updateList,
        updateSLM,
        updateIdentity: (data: RestaurantIdentity) => updateConfig('identity', data)
    };
};
