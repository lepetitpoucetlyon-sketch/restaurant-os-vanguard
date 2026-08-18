import { Nexus } from '@/lib/nexus/NexusAdapter';
import { FirestoreAdapter } from '@/lib/adapters/FirestoreAdapter';
import { LLMManager, createLLMProvider } from '@/modules/intelligence/ia/ai';
import { StorageManager } from '@/infrastructure/services/storage';
import { FirebaseStorageProvider } from '@/lib/storage/FirebaseStorageProvider';

/**
 * 🚀 Bootstrap standard infrastructure providers (Firestore, LLM Provider, Firebase Storage)
 */
export function bootstrapDefaultProviders(): void {
    try {
        Nexus.adapter = new FirestoreAdapter();
        LLMManager.provider = createLLMProvider();
        StorageManager.provider = new FirebaseStorageProvider();
    } catch {
        // Silently handled in test/mock environments
    }
}
