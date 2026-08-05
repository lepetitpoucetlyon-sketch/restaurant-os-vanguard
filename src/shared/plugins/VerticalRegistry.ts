import { logger } from '@/lib/logger';
import { IVerticalPlugin, ICoreContext } from './IVerticalPlugin';

class VerticalRegistry {
    private plugins: Map<string, IVerticalPlugin> = new Map();
    private context!: ICoreContext;
    private isInitialized = false;

    /**
     * Définit le contexte d'injection du Core.
     * Doit être appelé avant de charger des plugins.
     */
    public setContext(context: ICoreContext) {
        if (this.isInitialized) {
            logger.warn('[VerticalRegistry] Contexte déjà initialisé.');
            return;
        }
        this.context = context;
        this.isInitialized = true;
    }

    /**
     * Charge un plugin métier.
     */
    public async register(plugin: IVerticalPlugin): Promise<void> {
        if (!this.isInitialized) {
            throw new Error('[VerticalRegistry] Le contexte Core n\'est pas défini. Appel setContext() d\'abord.');
        }

        if (this.plugins.has(plugin.id)) {
            logger.warn(`[VerticalRegistry] Le plugin ${plugin.id} est déjà chargé.`);
            return;
        }

        logger.info(`[VerticalRegistry] Chargement de la verticale : ${plugin.name} (v${plugin.version})...`);
        
        try {
            await plugin.initialize(this.context);
            this.plugins.set(plugin.id, plugin);
            logger.info(`[VerticalRegistry] Verticale ${plugin.name} chargée avec succès.`);
        } catch (error) {
            logger.error(`[VerticalRegistry] Échec du chargement de la verticale ${plugin.name}:`, error);
            throw error;
        }
    }

    public getPlugin(id: string): IVerticalPlugin | undefined {
        return this.plugins.get(id);
    }

    public getLoadedPlugins(): IVerticalPlugin[] {
        return Array.from(this.plugins.values());
    }
}

export const verticalRegistry = new VerticalRegistry();
