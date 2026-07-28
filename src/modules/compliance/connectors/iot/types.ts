export type SensorUnit = 'celsius' | 'fahrenheit' | 'humidity_pct' | 'co2_ppm' | 'custom';

export interface SensorReading {
    sensorId: string;
    tenantId: string;
    value: number;
    unit: SensorUnit;
    timestamp: string; // ISO 8601
    zoneId?: string;
    zoneName?: string;
}

export interface Sensor {
    id: string;
    name: string;
    type: 'temperature' | 'humidity' | 'co2' | 'custom';
    zoneId?: string;
    zoneName?: string;
    lastReading?: SensorReading;
    /** Seuil bas — en dessous = non-conformité HACCP */
    minThreshold?: number;
    /** Seuil haut — au dessus = non-conformité HACCP */
    maxThreshold?: number;
}

export interface IIoTProvider {
    readonly id: string;
    /** Subscribe to live readings. Returns an unsubscribe function. */
    subscribe(tenantId: string, onReading: (r: SensorReading) => void): () => void;
    fetchHistory(sensorId: string, from: Date, to: Date): Promise<SensorReading[]>;
    listSensors(tenantId: string): Promise<Sensor[]>;
}
