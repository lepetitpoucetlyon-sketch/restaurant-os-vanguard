import { logger } from '@/lib/logger';

/**
 * 🛡️ Mutex - Lock & Abort Strategy (Souveraineté Grade X)
 * Si une tâche tente d'être exécutée alors que le Mutex est verrouillé,
 * elle est silencieusement ignorée et avortée (Abort).
 * Ceci prévient les congestions et le "spam" d'interface de la part des utilisateurs.
 */
export class Mutex {
    private isLocked = false;
    private id: string;

    constructor(id: string = 'GLOBAL_MUTEX') {
        this.id = id;
    }

    async run<T>(task: () => Promise<T>): Promise<T | null> {
        if (this.isLocked) {
            logger.warn(`[Mutex:${this.id}] Collision détectée. Lock & Abort activé pour la requête entrante.`);
            return null; // Silent Abort
        }
        
        this.isLocked = true;
        try {
            return await task();
        } finally {
            this.isLocked = false;
        }
    }

    isCurrentlyLocked(): boolean {
        return this.isLocked;
    }
}
