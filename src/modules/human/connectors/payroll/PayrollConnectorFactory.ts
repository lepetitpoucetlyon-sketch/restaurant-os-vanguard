import type { IPayrollConnectorProvider } from './types';
import { SilaeConnectorProvider } from './providers/SilaeConnectorProvider';
import { MergeConnectorProvider } from './providers/MergeConnectorProvider';

/**
 * Registre plug-and-play des providers paie.
 * Pour ajouter un nouveau prestataire (PayFit, ADP, Sage...) :
 *   1. Créer `providers/MyProviderConnectorProvider.ts` qui implémente `IPayrollConnectorProvider`
 *   2. L'enregistrer ici sous une clé string (ex: 'payfit')
 *   3. Définir PAYROLL_DEFAULT_PROVIDER=payfit en env ou choisir dans l'UI tenant
 */
const PROVIDER_REGISTRY: Record<string, () => IPayrollConnectorProvider> = {
    silae: () => new SilaeConnectorProvider(),
    merge: () => new MergeConnectorProvider(),
    // payfit: () => new PayFitConnectorProvider(),
    // adp:    () => new AdpConnectorProvider(),
};

export const DEFAULT_PAYROLL_PROVIDER = 'silae';

export class PayrollConnectorFactory {
    static get(providerId?: string | null): IPayrollConnectorProvider {
        const id = (
            providerId ??
            process.env.PAYROLL_DEFAULT_PROVIDER ??
            DEFAULT_PAYROLL_PROVIDER
        ).toLowerCase();
        const factory = PROVIDER_REGISTRY[id];
        if (!factory) {
            throw new Error(
                `Provider paie inconnu : "${id}". Disponibles : ${Object.keys(PROVIDER_REGISTRY).join(', ')}`
            );
        }
        return factory();
    }

    static list(): string[] {
        return Object.keys(PROVIDER_REGISTRY);
    }

    /** Enregistre dynamiquement un provider (ex: pour les tests ou plugins MCC). */
    static register(id: string, factory: () => IPayrollConnectorProvider): void {
        PROVIDER_REGISTRY[id.toLowerCase()] = factory;
    }
}
