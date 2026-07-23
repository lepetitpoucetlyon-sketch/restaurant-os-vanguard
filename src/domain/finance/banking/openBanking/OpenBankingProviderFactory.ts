import type { IOpenBankingProvider } from './types';
import { PowensProvider } from './PowensProvider';
import { TinkProvider } from './TinkProvider';
import { GoCardlessProvider } from './GoCardlessProvider';

/**
 * Registre des agrégateurs bancaires disponibles.
 * Ajouter un nouveau provider = une classe qui implémente IOpenBankingProvider + une ligne ici.
 * Aucun call site (routes API, sync, webhook) n'a besoin de changer.
 *
 * Sélection :
 *   1. Argument explicite passé à `get(providerId)`
 *   2. Env var OPEN_BANKING_DEFAULT_PROVIDER
 *   3. 'powens' (défaut)
 */
const PROVIDER_REGISTRY: Record<string, () => IOpenBankingProvider> = {
    powens:      () => new PowensProvider(),
    tink:        () => new TinkProvider(),
    gocardless:  () => new GoCardlessProvider(),
};

export const DEFAULT_OPEN_BANKING_PROVIDER = 'powens';

export class OpenBankingProviderFactory {
    /**
     * @param providerId Id explicite (ex: préférence tenant). Sinon, valeur de
     * OPEN_BANKING_DEFAULT_PROVIDER, sinon 'powens'.
     */
    static get(providerId?: string | null): IOpenBankingProvider {
        const id = (providerId || process.env.OPEN_BANKING_DEFAULT_PROVIDER || DEFAULT_OPEN_BANKING_PROVIDER).toLowerCase();
        const factory = PROVIDER_REGISTRY[id];
        if (!factory) {
            throw new Error(`Agrégateur bancaire inconnu : "${id}". Disponibles : ${Object.keys(PROVIDER_REGISTRY).join(', ')}`);
        }
        return factory();
    }
}
