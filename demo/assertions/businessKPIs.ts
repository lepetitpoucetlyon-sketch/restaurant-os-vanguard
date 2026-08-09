import { SimulationSummary } from '../engine/ScenarioRunner';
import { expect } from 'vitest';

export function assertBusinessKPIs(summary: SimulationSummary): void {
  // Ticket moyen — fourchette 15€-55€ par commande (selon mix entrée + plat + dessert)
  const averageCheck = summary.totalOrders > 0 ? summary.totalRevenueEur / summary.totalOrders : 0;
  expect(averageCheck, `Ticket moyen hors fourchette (${averageCheck.toFixed(2)}€)`).toBeGreaterThanOrEqual(15);
  expect(averageCheck, `Ticket moyen hors fourchette (${averageCheck.toFixed(2)}€)`).toBeLessThanOrEqual(55);

  // CA total positif cohérent avec le nombre de services
  expect(summary.totalRevenueEur / summary.servicesExecuted, 'CA par service anormalement bas').toBeGreaterThan(500);
}
