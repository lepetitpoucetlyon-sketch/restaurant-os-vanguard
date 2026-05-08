import { getTenantPath } from '@/lib/firebase';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { GlobalSettings } from '@nexus/contracts';
import { logger } from '@/lib/logger';

export class SettingsManager {
    static async saveSettings(newSettings: GlobalSettings): Promise<Date> {
        try {
            const settingsPath = `${getTenantPath('settings')}/global`;
            await Nexus.adapter.set(settingsPath, newSettings);
            logger.info('SettingsManager: Configuration saved successfully');
            return new Date();
        } catch (error: unknown) {
            logger.error('SettingsManager: Failed to save settings', { error });
            throw error;
        }
    }

    static exportSettings(settings: GlobalSettings): string {
        return JSON.stringify(settings, null, 2);
    }

    static importSettings(json: string, defaults: GlobalSettings): GlobalSettings {
        try {
            const imported = JSON.parse(json);
            return { ...defaults, ...imported };
        } catch (error: unknown) {
            logger.error('SettingsManager: Import failed', { error });
            throw new Error('Format de fichier invalide');
        }
    }
}
