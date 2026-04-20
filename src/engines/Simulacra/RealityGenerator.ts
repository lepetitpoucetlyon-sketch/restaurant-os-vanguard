import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * 🌀 RealityGenerator - The Vital Heart of the Simulacra
 * Generates realistic, noisy, and high-density data pulses.
 */
export class RealityGenerator {
    private static intervals: NodeJS.Timeout[] = [];

    /**
     * Generates a sinusoidal temperature reading with random noise.
     * Simulates a fridge cycle (e.g., compressor on/off).
     * @param baseTemp Average temperature (e.g., 4°C)
     * @param amplitude Variance (e.g., 2°C)
     * @param noiseLevel Random variation (e.g., 0.5°C)
     */
    static generateHACCPReading(baseTemp: number = 4, amplitude: number = 2, noiseLevel: number = 0.5) {
        const now = new Date();
        const timeInHours = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
        
        // Sine wave based on a 4-hour compressor cycle
        const cyclePosition = (timeInHours % 4) / 4;
        const sineValue = Math.sin(cyclePosition * 2 * Math.PI);
        
        // Random Gaussian-like noise
        const noise = (Math.random() - 0.5) * 2 * noiseLevel;
        
        // Occasional anomaly (1% chance)
        const anomaly = Math.random() < 0.01 ? Math.random() * 8 : 0;

        const finalTemp = baseTemp + (sineValue * amplitude) + noise + anomaly;
        
        return {
            id: uuidv4(),
            sensorId: 'fridge_main_01',
            value: parseFloat(finalTemp.toFixed(2)),
            unit: '°C',
            timestamp: now.toISOString(),
            isAnomaly: anomaly > 0 || finalTemp > (baseTemp + amplitude + 1)
        };
    }

    /**
     * Starts a live stream of HACCP data into the system.
     * This is the "Traffic" on the highway.
     */
    static startHACCPStream(callback: (reading: any) => void, frequencyMs: number = 5000) {
        logger.info(`✨ [SIMULACRA] Starting Live HACCP Reality Stream (${frequencyMs}ms)`);
        const interval = setInterval(() => {
            const reading = this.generateHACCPReading();
            if (reading.isAnomaly) {
                logger.warn(`🚨 [REALITY_GEN] TEMPERATURE ANOMALY DETECTED: ${reading.value}°C`);
            }
            callback(reading);
        }, frequencyMs);
        
        this.intervals.push(interval);
    }

    /**
     * Generates a burst of sales to simulate a busy "Rush Hour".
     */
    static async generateSalesRush(callback: (order: any) => void, count: number = 20) {
        logger.info(`🔥 [SIMULACRA] COMMENCING SALES RUSH: ${count} orders incoming...`);
        for (let i = 0; i < count; i++) {
            const items = ['Burger', 'Frites', 'Soda', 'Salade'];
            const order = {
                id: `sim_${uuidv4().substring(0, 8)}`,
                items: [items[Math.floor(Math.random() * items.length)]],
                total: Math.random() * 50 + 10,
                timestamp: new Date().toISOString(),
                staffId: 'staff_sim_01'
            };
            
            // Random delay to simulate real customers
            await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));
            callback(order);
        }
    }

    static stopAll() {
        this.intervals.forEach(clearInterval);
        this.intervals = [];
        logger.info('⏹️ [SIMULACRA] Reality Streams stopped.');
    }
}
