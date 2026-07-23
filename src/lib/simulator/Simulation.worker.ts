/**
 * 🧵 Simulation Engine WebWorker (Grade X)
 * High-performance, off-thread Monte-Carlo simulation.
 * Utilizing Poisson distribution for realistic arrival patterns.
 */

interface SimulationConfig {
    arrivalRate: number; // Lambda (arrivals per second)
    staffCount: number;
    chaosProbability: number;
    timeMultiplier: number;
}

self.onmessage = (e: MessageEvent) => {
    const { action, config } = e.data;

    if (action === 'start') {
        runSimulation(config);
    } else if (action === 'stop') {
        self.close();
    }
};

function runSimulation(config: SimulationConfig) {
    const { arrivalRate, staffCount: _staffCount, chaosProbability, timeMultiplier } = config;
    
    const isRunning = true;
    const metrics = {
        totalTransactions: 0,
        totalRevenueCents: 0,
        errorCount: 0,
        stockAlerts: 0,
        activeConvives: 0
    };

    // Poisson Arrival Loop
    const simulateArrival = () => {
        if (!isRunning) return;

        // Exponential distribution for inter-arrival time
        // T = -ln(U) / lambda
        const lambda = (arrivalRate * timeMultiplier) / 60; // Convert per-minute lambda to per-second scaled
        const delay = (-Math.log(Math.random()) / (lambda || 0.1)) * 1000;

        setTimeout(() => {
            // New transaction!
            metrics.totalTransactions++;
            const rev = Math.floor(Math.random() * 5000) + 1500;
            metrics.totalRevenueCents += rev;
            const convives = Math.floor(Math.random() * 4) + 1;
            metrics.activeConvives += convives;

            // Chaos/Error injection
            if (Math.random() < chaosProbability) {
                metrics.errorCount++;
            }

            // Sync back to main thread
            self.postMessage({ type: 'METRICS_UPDATE', metrics });

            // Random release of convives
            setTimeout(() => {
                metrics.activeConvives = Math.max(0, metrics.activeConvives - convives);
            }, (Math.random() * 20000 + 10000) / timeMultiplier);

            simulateArrival();
        }, delay);
    };

    // High frequency tick for other metrics (Burnout, Stock)
    const tickInterval = setInterval(() => {
        if (!isRunning) {
            clearInterval(tickInterval);
            return;
        }

        if (Math.random() < 0.05) {
            metrics.stockAlerts++;
        }

        self.postMessage({ type: 'METRICS_UPDATE', metrics });
    }, 1000 / timeMultiplier);

    simulateArrival();
}
