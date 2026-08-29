import { Nexus } from '@/lib/nexus/NexusAdapter';
import { GlobalSettings } from '@nexus/contracts';
import { logger } from '@/lib/logger';
import type { SovereignData } from "@/shared/nexus/contracts";

export class SettingsManager {
    static async saveSettings(newSettings: GlobalSettings): Promise<Date> {
        try {
            const settingsPath = `${Nexus.getTenantPath('settings')}/global`;
            await Nexus.adapter.set(settingsPath, newSettings);
            logger.info('SettingsManager: Configuration saved successfully');
            return new Date();
        } catch (error) {
            logger.error('SettingsManager: Failed to save settings', { error });
            throw error;
        }
    }

    static async savePageSettings(page: string, settings: SovereignData): Promise<Date> {
        try {
            const pagePath = `${Nexus.getTenantPath('settings')}/pages/${page}`;
            await Nexus.adapter.set(pagePath, settings);
            logger.info(`SettingsManager: Page settings saved for ${page}`);
            return new Date();
        } catch (error) {
            logger.error(`SettingsManager: Failed to save page settings for ${page}`, { error });
            throw error;
        }
    }

    static async loadPageSettings(): Promise<Record<string, SovereignData>> {
        try {
            const pagesPath = `${Nexus.getTenantPath('settings')}/pages`;
            const data = await Nexus.adapter.get<Record<string, SovereignData>>(pagesPath);
            return (data && typeof data === 'object') ? data : {};
        } catch (error) {
            logger.warn('SettingsManager: Failed to load page settings from Nexus, using local fallback', { error });
            return {};
        }
    }

    static exportSettings(settings: GlobalSettings): string {
        return JSON.stringify(settings, null, 2);
    }

    static importSettings(json: string, defaults: GlobalSettings): GlobalSettings {
        try {
            const imported = JSON.parse(json);
            return { ...defaults, ...imported };
        } catch (error) {
            logger.error('SettingsManager: Import failed', { error });
            throw new Error('Format de fichier invalide');
        }
    }
}

