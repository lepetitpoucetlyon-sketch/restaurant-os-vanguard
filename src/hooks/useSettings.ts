import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { 
    globalSettingsAtom, 
    settingsLoadingAtom, 
    settingsSavingAtom, 
    settingsLastSavedAtom 
} from '@/store/settingsAtoms';
import { SettingsManager } from '@/domain/services/SettingsManager';
import { GlobalSettings } from '@/types/settings';

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
            setLastSaved(savedAt);
            setSettings(newSettings);
            return savedAt;
        } finally {
            setSaving(false);
        }
    }, [setSettings, setSaving, setLastSaved]);

    const updateConfig = useCallback(async (key: keyof GlobalSettings, data: any) => {
        if (!settings) return;
        const newSettings = {
            ...settings,
            [key]: data
        };
        return updateSettings(newSettings);
    }, [settings, updateSettings]);

    return {
        settings,
        isLoading,
        isSaving,
        lastSaved,
        updateSettings,
        updateConfig,
        updateIdentity: (data: any) => updateConfig('identity', data)
    };
};
