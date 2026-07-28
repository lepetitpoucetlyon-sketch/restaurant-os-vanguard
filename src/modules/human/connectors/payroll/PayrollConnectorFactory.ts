import type { IPayrollConnectorProvider } from './types';
import { SilaeConnectorProvider } from './providers/SilaeConnectorProvider';

const PROVIDER_REGISTRY: Record<string, () => IPayrollConnectorProvider> = {
    silae: () => new SilaeConnectorProvider(),
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
}
