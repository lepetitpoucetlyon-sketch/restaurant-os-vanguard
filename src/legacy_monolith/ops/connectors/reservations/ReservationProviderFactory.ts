import type { IReservationProvider } from './types';
import { WidgetReservationProvider } from './providers/WidgetReservationProvider';
import { ZenchefProvider } from './providers/ZenchefProvider';

const PROVIDER_REGISTRY: Record<string, () => IReservationProvider> = {
    widget:    () => new WidgetReservationProvider(),
    zenchef:   () => new ZenchefProvider(),
};

export const DEFAULT_RESERVATION_PROVIDER = 'widget';

export class ReservationProviderFactory {
    /**
     * @param providerId From tenant settings (tenants/{id}/settings.connectors.reservations).
     *                   Falls back to RESERVATION_DEFAULT_PROVIDER env var, then 'widget'.
     */
    static get(providerId?: string | null): IReservationProvider {
        const id = (
            providerId ??
            process.env.RESERVATION_DEFAULT_PROVIDER ??
            DEFAULT_RESERVATION_PROVIDER
        ).toLowerCase();
        const factory = PROVIDER_REGISTRY[id];
        if (!factory) {
            throw new Error(
                `Provider réservations inconnu : "${id}". Disponibles : ${Object.keys(PROVIDER_REGISTRY).join(', ')}`
            );
        }
        return factory();
    }

    static list(): string[] {
        return Object.keys(PROVIDER_REGISTRY);
    }
}
