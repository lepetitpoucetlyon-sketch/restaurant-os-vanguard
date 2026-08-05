"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { SettingsManager } from '@/lib/SettingsManager';
import { defaultSettings } from '@/shared/contexts/settings/defaults';
import { GlobalSettings } from '@nexus/contracts';

export function useSettingsModule() {
    const [settings, setSettings] = useState<GlobalSettings>(defaultSettings);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    useEffect(() => {
        const settingsPath = `${Nexus.getTenantPath('settings')}/global`;
        
        const safetyTimeout = setTimeout(() => {
            if (isLoading) {
                logger.warn('useSettingsModule: Initial load timed out - defaulting');
                setIsLoading(false);
            }
        }, 5000);

        const unsubscribe = Nexus.adapter.onSnapshot(settingsPath, (data) => {
            clearTimeout(safetyTimeout);
            if (data) {
                setSettings({ ...defaultSettings, ...data });
            } else {
                Nexus.adapter.set(settingsPath, defaultSettings);
            }
            setIsLoading(false);
        }, {
            onError: (error: unknown) => {
                logger.error('useSettingsModule: Sync error', { error });
                clearTimeout(safetyTimeout);
                setIsLoading(false);
            }
        });

        return () => {
            unsubscribe();
            clearTimeout(safetyTimeout);
        };
    }, []);

    const internalSave = useCallback(async (newSettings: GlobalSettings) => {
        setIsSaving(true);
        try {
            const savedAt = await SettingsManager.saveSettings(newSettings);
            setLastSaved(savedAt);
        } finally {
            setIsSaving(false);
        }
    }, []);

    return useMemo(() => ({
        settings,
        isLoading,
        isSaving,
        lastSaved,
        updateSettings: internalSave
    }), [settings, isLoading, isSaving, lastSaved, internalSave]);
}
