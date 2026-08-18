import { Nexus } from '@/lib/nexus/NexusAdapter';
import { FirestoreAdapter } from '@/lib/adapters/FirestoreAdapter';
import { LLMManager } from '@/modules/intelligence/ia/ai/LLMManager';
import { GeminiProvider } from '@/modules/intelligence/ia/GeminiProvider';
import { StorageManager } from '@/infrastructure/services/storage';
import { FirebaseStorageProvider } from '@/lib/storage/FirebaseStorageProvider';

/**
 * 🚀 Bootstrap standard infrastructure providers (Firestore, Gemini, Firebase Storage)
 */
export function bootstrapDefaultProviders(): void {
    try {
        Nexus.adapter = new FirestoreAdapter();
        LLMManager.provider = new GeminiProvider();
        StorageManager.provider = new FirebaseStorageProvider();
    } catch {
        // Silently handled in test/mock environments
    }
}
