import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { GlobalSettings, defaultSettings } from '@nexus/contracts';
import { tenantScopedJSONStorage } from '@/infrastructure/services/storage/tenantScopedKey';

/**
 * GLOBAL SETTINGS ATOMS (GRADE VI)
 *
 * Synchronisés avec Firebase via useSettingsModule
 * Persistance locale via atomWithStorage — SCOPED PAR TENANT (SovereignGuard)
 */
export const globalSettingsAtom = atomWithStorage<GlobalSettings>(
    'nexus_global_settings',
    defaultSettings,
    tenantScopedJSONStorage<GlobalSettings>(),
);
export const settingsLoadingAtom = atom<boolean>(true);
export const settingsSavingAtom = atom<boolean>(false);
export const settingsLastSavedAtom = atom<Date | null>(null);

// Selectors
export const posSettingsAtom = atom((get) => get(globalSettingsAtom).posSettings);
export const themeSettingsAtom = atom((get) => get(globalSettingsAtom).theme);
export const nexusConfigAtom = atom((get) => get(globalSettingsAtom).nexusConfig);

import { SovereignData } from '@/shared/nexus-contract';

// Contextual UI Settings (Grade VI)
export const pageSettingsAtom = atomWithStorage<Record<string, SovereignData>>(
    'nexus_page_settings',
    {},
    tenantScopedJSONStorage<Record<string, SovereignData>>(),
);
export const isSettingsOpenAtom = atom<boolean>(false);
export const currentSettingsPageAtom = atom<string | null>(null);

export const updatePageSettingsAtom = atom(
    null,
    (get, set, { page, settings }: { page: string; settings: SovereignData }) => {
        const current = get(pageSettingsAtom);
        set(pageSettingsAtom, {
            ...current,
            [page]: {
                ...(current[page] || {}),
                ...settings
            }
        });
    }
);
