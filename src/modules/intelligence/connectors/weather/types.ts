export interface WeatherForecast {
    date: string;           // YYYY-MM-DD
    tempMin: number;        // °C
    tempMax: number;        // °C
    description: string;
    precipitation: number;  // mm
    windSpeed: number;      // km/h
    icon?: string;
}

export interface LocalEvent {
    id: string;
    name: string;
    date: string;
    time?: string;
    venue?: string;
    category?: string;
    expectedAttendance?: number;
    url?: string;
}

export interface IWeatherProvider {
    readonly id: string;
    getForecast(lat: number, lng: number, days: number): Promise<WeatherForecast[]>;
}

export interface IEventsProvider {
    readonly id: string;
    getLocalEvents(lat: number, lng: number, radiusKm: number, days: number): Promise<LocalEvent[]>;
}
