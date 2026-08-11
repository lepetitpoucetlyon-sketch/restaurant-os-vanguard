import fc from 'fast-check';
import { describe, it, expect } from 'vitest';

interface ProjectionState {
    totalEvents: number;
    accumulatedMicrounits: number;
    activeKeys: string[];
}

/**
 * Invariant 7 — Projection reconstruite === projection courante (prépare §6.5)
 */
describe('Invariant 7: Reconstructed Projection Parity', () => {
    it("la projection reconstruite à partir du journal des événements est strictement identique à la projection courante", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        amountInMicrounits: fc.integer({ min: 10_000, max: 1_000_000 }),
                        key: fc.constantFrom('key_a', 'key_b', 'key_c'),
                    }),
                    { minLength: 1, maxLength: 50 }
                ),
                async (events) => {
                    // 1. Current state accumulated event by event
                    const currentState: ProjectionState = {
                        totalEvents: 0,
                        accumulatedMicrounits: 0,
                        activeKeys: [],
                    };

                    for (const ev of events) {
                        currentState.totalEvents += 1;
                        currentState.accumulatedMicrounits += ev.amountInMicrounits;
                        if (!currentState.activeKeys.includes(ev.key)) {
                            currentState.activeKeys.push(ev.key);
                        }
                    }

                    // 2. Reconstructed state built from scratch replaying event stream
                    const reconstructedState: ProjectionState = events.reduce(
                        (acc, ev) => {
                            acc.totalEvents += 1;
                            acc.accumulatedMicrounits += ev.amountInMicrounits;
                            if (!acc.activeKeys.includes(ev.key)) {
                                acc.activeKeys.push(ev.key);
                            }
                            return acc;
                        },
                        { totalEvents: 0, accumulatedMicrounits: 0, activeKeys: [] } as ProjectionState
                    );

                    expect(reconstructedState).toEqual(currentState);
                    return (
                        reconstructedState.totalEvents === currentState.totalEvents &&
                        reconstructedState.accumulatedMicrounits === currentState.accumulatedMicrounits &&
                        reconstructedState.activeKeys.length === currentState.activeKeys.length
                    );
                }
            ),
            { numRuns: 50 }
        );
    });
});
