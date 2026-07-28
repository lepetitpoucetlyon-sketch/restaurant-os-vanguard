import type { IRecruitmentProvider } from './types';
import { NativeFormProvider } from './providers/NativeFormProvider';

const PROVIDER_REGISTRY: Record<string, () => IRecruitmentProvider> = {
    native: () => new NativeFormProvider(),
};

export const DEFAULT_RECRUITMENT_PROVIDER = 'native';

export class RecruitmentProviderFactory {
    static get(providerId?: string | null): IRecruitmentProvider {
        const id = (
            providerId ??
            process.env.RECRUITMENT_DEFAULT_PROVIDER ??
            DEFAULT_RECRUITMENT_PROVIDER
        ).toLowerCase();
        const factory = PROVIDER_REGISTRY[id];
        if (!factory) {
            throw new Error(
                `Provider recrutement inconnu : "${id}". Disponibles : ${Object.keys(PROVIDER_REGISTRY).join(', ')}`
            );
        }
        return factory();
    }

    static list(): string[] {
        return Object.keys(PROVIDER_REGISTRY);
    }
}
