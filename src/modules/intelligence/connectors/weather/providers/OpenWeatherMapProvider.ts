import type { IWeatherProvider, WeatherForecast } from '../types';
import { logger } from '@/lib/logger';

/**
 * OpenWeatherMap — gratuit jusqu'à 1 000 appels/jour.
 * Variable requise : OPENWEATHERMAP_API_KEY
 * Doc : https://openweathermap.org/forecast5
 */
export class OpenWeatherMapProvider implements IWeatherProvider {
    readonly id = 'openweathermap';

    private get apiKey(): string {
        const key = process.env.OPENWEATHERMAP_API_KEY;
        if (!key) throw new Error('OPENWEATHERMAP_API_KEY manquant');
        return key;
    }

    async getForecast(lat: number, lng: number, days: number): Promise<WeatherForecast[]> {
        try {
            const cnt = Math.min(days * 8, 40); // OWM renvoie des tranches de 3h
            const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&cnt=${cnt}&appid=${this.apiKey}&units=metric&lang=fr`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`OpenWeatherMap → ${res.status}`);
            const data = await res.json() as { list: Array<Record<string, unknown>> };

            // Agréger par jour (garder min/max/description du premier créneau de chaque jour)
            const byDay = new Map<string, WeatherForecast>();
            for (const item of data.list) {
                const date = String(item['dt_txt'] ?? '').slice(0, 10);
                if (!byDay.has(date)) {
                    const main    = item['main'] as Record<string, number>;
                    const weather = (item['weather'] as Array<Record<string, unknown>>)[0] ?? {};
                    const wind    = item['wind'] as Record<string, number>;
                    const rain    = item['rain'] as Record<string, number> | undefined;
                    byDay.set(date, {
                        date,
                        tempMax:       main?.['temp_max'] ?? 0,
                        tempMin:       main?.['temp_min'] ?? 0,
                        precipitation: rain?.['3h'] ?? 0,
                        windSpeed:     Math.round((wind?.['speed'] ?? 0) * 3.6), // m/s → km/h
                        description:   String(weather['description'] ?? ''),
                        icon:          String(weather['icon'] ?? ''),
                    });
                }
            }
            return Array.from(byDay.values()).slice(0, days);
        } catch (err) {
            logger.error('[OpenWeatherMapProvider] getForecast error', String(err));
            return [];
        }
    }
}
