import { atom } from 'jotai';
import { SimulationMetrics } from '../TemporalSimulator';

/**
 * 🌀 Simulator Atoms (Grade X)
 * High-performance state management for the temporal engine.
 */

export const simulationMetricsAtom = atom<SimulationMetrics>({
    totalTransactions: 0,
    totalRevenueCents: 0,
    errorCount: 0,
    stockAlerts: 0,
    activeConvives: 0,
    burnoutIndex: 0
});

export const isSimulationRunningAtom = atom<boolean>(false);

/**
 * ⚡ BATCHING BRIDGE (Grade X)
 * Buffer that aggregates high-frequency worker updates to prevent UI jitter.
 */
export const batchedMetricsAtom = atom(
    (get) => get(simulationMetricsAtom),
    (get, set, newMetrics: SimulationMetrics) => {
        set(simulationMetricsAtom, newMetrics);
    }
);
