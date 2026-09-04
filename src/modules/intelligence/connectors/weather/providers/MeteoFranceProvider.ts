import type { IWeatherProvider, WeatherForecast } from '../types';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";
import { fetchWithTimeout } from '@/lib/http/resilientFetch';

/**
 * Météo France — API publique gratuite (api.meteo.fr / meteo.data.gouv.fr).
 * Aucune clé API requise pour les données de prévision publiques.
 * Doc : https://portail-api.meteofrance.fr/
 */
export class MeteoFranceProvider implements IWeatherProvider {
    readonly id = 'meteofrance';

    async getForecast(lat: number, lng: number, days: number): Promise<WeatherForecast[]> {
        try {
            const url = `https://api.meteo.fr/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode&forecast_days=${Math.min(days, 14)}&timezone=Europe%2FParis`;
            const res = await fetchWithTimeout(url, {
                headers: { 'Accept': 'application/json' },
            }, 8_000);
            if (!res.ok) throw new Error(`Météo France API → ${res.status}`);
            const data = await res.json() as {
                daily: {
                    time: string[];
                    temperature_2m_max: number[];
                    temperature_2m_min: number[];
                    precipitation_sum: number[];
                    windspeed_10m_max: number[];
                    weathercode: number[];
                };
            };

            return data.daily.time.map((date, i) => ({
                date,
                tempMax:       data.daily.temperature_2m_max[i] ?? 0,
                tempMin:       data.daily.temperature_2m_min[i] ?? 0,
                precipitation: data.daily.precipitation_sum[i] ?? 0,
                windSpeed:     data.daily.windspeed_10m_max[i] ?? 0,
                description:   wmoDescription(data.daily.weathercode[i] ?? 0),
                icon:          wmoIcon(data.daily.weathercode[i] ?? 0),
            }));
        } catch (err) {
            logger.error('[MeteoFranceProvider] getForecast error', toError(err).message);
            return [];
        }
    }
}

function wmoDescription(code: number): string {
    if (code === 0)              return 'Ciel dégagé';
    if (code <= 2)               return 'Partiellement nuageux';
    if (code <= 3)               return 'Couvert';
    if (code <= 49)              return 'Brouillard';
    if (code <= 59)              return 'Bruine';
    if (code <= 69)              return 'Pluie';
    if (code <= 79)              return 'Neige';
    if (code <= 82)              return 'Averses';
    if (code <= 99)              return 'Orage';
    return 'Conditions inconnues';
}

function wmoIcon(code: number): string {
    if (code === 0)  return '☀️';
    if (code <= 2)   return '⛅';
    if (code <= 3)   return '☁️';
    if (code <= 49)  return '🌫️';
    if (code <= 69)  return '🌧️';
    if (code <= 79)  return '❄️';
    if (code <= 82)  return '🌦️';
    return '⛈️';
}
