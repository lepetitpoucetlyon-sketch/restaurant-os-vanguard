import { Nexus } from '@/lib/nexus/NexusAdapter';
import { LLMManager, createLLMProvider } from '@/modules/intelligence';
import { StorageManager } from '@/infrastructure/services/storage';
import { createClientAdapter } from '@/lib/nexus/providerFactory';
import { createStorageProvider } from '@/lib/storage/providerFactory';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

/**
 * 🚀 Bootstrap standard infrastructure providers (Data adapter, LLM Provider, Storage Provider)
 */
export async function bootstrapDefaultProviders(): Promise<void> {
    try {
        Nexus.adapter = await createClientAdapter();
        LLMManager.provider = createLLMProvider();
        StorageManager.provider = await createStorageProvider();
    } catch (err) {
        logger.warn('[bootstrap] Provider non initialisé', { error: toError(err).message });
    }
}
