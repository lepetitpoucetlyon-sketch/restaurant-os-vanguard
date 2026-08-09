import { SimulationSummary } from '../engine/ScenarioRunner';
import { expect } from 'vitest';

export function assertWeeklyCoherence(summary: SimulationSummary): void {
  // 1. Au moins un service exécuté
  expect(summary.servicesExecuted, 'Aucun service exécuté').toBeGreaterThan(0);

  // 2. Nombre de clôtures Z = nombre de services (1 Z par service)
  expect(summary.ticketZClosedCount, 'Nombre de Tickets Z ≠ nombre de services').toBe(summary.servicesExecuted);

  // 3. Commandes positif et cohérent
  expect(summary.totalOrders, 'Aucune commande enregistrée').toBeGreaterThan(0);

  // 4. CA > 0
  expect(summary.totalRevenueEur, 'CA total nul').toBeGreaterThan(0);

  // 5. Clients CRM crédités sur au moins 10% des services (engagement CRM actif)
  expect(summary.customersWithCRM, 'Aucun client CRM actif').toBeGreaterThanOrEqual(
    Math.floor(summary.servicesExecuted * 0.1)
  );

  // 6. Événements HACCP déclenchés (obligation légale quotidienne)
  expect(summary.haccpChecks, 'Aucun contrôle HACCP effectué').toBeGreaterThan(0);
}
