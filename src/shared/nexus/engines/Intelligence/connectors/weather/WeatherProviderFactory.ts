import type { IWeatherProvider, IEventsProvider } from './types';
import { MeteoFranceProvider } from './providers/MeteoFranceProvider';
import { OpenWeatherMapProvider } from './providers/OpenWeatherMapProvider';
import { TicketmasterEventsProvider } from './providers/TicketmasterEventsProvider';

const WEATHER_REGISTRY: Record<string, () => IWeatherProvider> = {
    meteofrance:    () => new MeteoFranceProvider(),
    openweathermap: () => new OpenWeatherMapProvider(),
};

const EVENTS_REGISTRY: Record<string, () => IEventsProvider> = {
    ticketmaster: () => new TicketmasterEventsProvider(),
};

export const DEFAULT_WEATHER_PROVIDER = 'meteofrance';
export const DEFAULT_EVENTS_PROVIDER  = 'ticketmaster';

export class WeatherProviderFactory {
    static get(providerId?: string | null): IWeatherProvider {
        const id = (
            providerId ??
            process.env.WEATHER_DEFAULT_PROVIDER ??
            DEFAULT_WEATHER_PROVIDER
        ).toLowerCase();
        const factory = WEATHER_REGISTRY[id];
        if (!factory) {
            throw new Error(
                `Provider météo inconnu : "${id}". Disponibles : ${Object.keys(WEATHER_REGISTRY).join(', ')}`
            );
        }
        return factory();
    }

    static getEventsProvider(providerId?: string | null): IEventsProvider {
        const id = (
            providerId ??
            process.env.EVENTS_DEFAULT_PROVIDER ??
            DEFAULT_EVENTS_PROVIDER
        ).toLowerCase();
        const factory = EVENTS_REGISTRY[id];
        if (!factory) {
            throw new Error(
                `Provider événements inconnu : "${id}". Disponibles : ${Object.keys(EVENTS_REGISTRY).join(', ')}`
            );
        }
        return factory();
    }
}
