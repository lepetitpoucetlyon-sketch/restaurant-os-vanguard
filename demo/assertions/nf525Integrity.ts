import { SimulationSummary } from '../engine/ScenarioRunner';
import { expect } from 'vitest';

export function assertNF525Integrity(summary: SimulationSummary): void {
  // Séquence des clôtures Z ininterrompue
  expect(summary.ticketZClosedCount).toBe(summary.servicesExecuted);
}
