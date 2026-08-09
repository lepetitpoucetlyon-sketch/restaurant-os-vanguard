import { SimulacraEngine } from './SimulacraEngine';
import { runServiceMidi, runServiceSoir } from '../scenarios/service';
import { triggerDailyTempCheck } from '../scenarios/haccp';
import {
  triggerMaladieChef,
  triggerFrigoTemperatureAnomaly,
  triggerDLCExpire,
  triggerRushCritique,
  triggerNoShowSeries,
  triggerEcartCaisse,
  triggerImprimanteTombee,
  triggerPlatRetourneAllergie,
  triggerStockZero,
  triggerLivraisonEcartPrix,
  triggerPromoActivee,
  triggerNoShowSansEmpreinte,
  triggerFactureImpaee,
  triggerTransfertTable,
  triggerAnniversaireVIP,
  triggerRecallProduit,
  triggerContratExpirant,
  triggerOvertimeThreshold,
} from '../scenarios/incidents';
import {
  triggerDeliveryReceived,
  triggerBankReconciliation,
  triggerPhysicalInventory,
  triggerInvoiceProcessed,
} from '../scenarios/finance';
import { triggerSchedulePublished, triggerShiftSwap, triggerPayrollExport } from '../scenarios/staff';
import { logger } from '@/lib/logger';

export interface SimulationSummary {
  weeksSimulated: number;
  servicesExecuted: number;
  totalOrders: number;
  totalRevenueEur: number;
  incidentsHandled: number;
  ticketZClosedCount: number;
  customersWithCRM: number;
  haccpChecks: number;
}

// ── Incidents injectés de façon déterministe par jour ─────────────────────────
// (index du jour global → scénario joué)
const DAY_INCIDENT_MAP: Record<number, (engine: SimulacraEngine) => Promise<void>> = {
  1:  (e) => triggerDeliveryReceived(e),          // Lundi matin : livraison fournisseur
  2:  (e) => triggerDLCExpire(e),                 // Mardi matin : DLC expirée
  3:  (e) => triggerMaladieChef(e),               // Mercredi : Chef malade
  4:  (e) => triggerRushCritique(e),              // Jeudi soir : Rush critique KDS
  5:  (e) => triggerImprimanteTombee(e),          // Vendredi : Imprimante tombée
  6:  (e) => triggerEcartCaisse(e, -5),           // Samedi : Écart caisse -5€
  7:  (e) => triggerSchedulePublished(e),         // Lundi S2 : Planning publié
  8:  (e) => triggerFrigoTemperatureAnomaly(e),   // Mardi S2 : Frigo 14°C
  9:  (e) => triggerStockZero(e),                 // Mercredi S2 : Stock 0 en service
  10: (e) => triggerNoShowSansEmpreinte(e),       // Jeudi S2 : No-show sans empreinte
  11: (e) => triggerPromoActivee(e),              // Vendredi S2 : Promo happy hour
  12: (e) => triggerEcartCaisse(e, 50),           // Samedi S2 : Écart caisse +50€ CRITIQUE
};

// ── Incidents hebdomadaires (fin de semaine) ──────────────────────────────────
const WEEKLY_EVENTS: Array<(e: SimulacraEngine) => Promise<void>> = [
  (e) => triggerInvoiceProcessed(e),             // Facture fournisseur hebdo
  (e) => triggerBankReconciliation(e),           // Rapprochement bancaire
  (e) => triggerPhysicalInventory(e),            // Inventaire physique
  (e) => triggerAnniversaireVIP(e),              // Anniversaire client VIP
  (e) => triggerContratExpirant(e),              // Contrat expirant (J+29)
];

export class ScenarioRunner {
  constructor(private engine: SimulacraEngine) {}

  async runFullSimulation(): Promise<SimulationSummary> {
    if (!this.engine.isInitialized) {
      await this.engine.bootstrap();
    }

    const { weeks, services, tenantId } = this.engine.config;
    let servicesExecuted = 0;
    let totalOrders = 0;
    let totalRevenueMicrounits = 0;
    let ticketZClosedCount = 0;
    let incidentsHandled = 0;
    let customersWithCRM = 0;
    let haccpChecks = 0;

    const daysPerWeek = 6; // Lundi au Samedi
    const totalDays = weeks * daysPerWeek;

    logger.info(`🎬 Simulation démarrée — ${weeks} semaines · Tenant: ${tenantId}`);

    for (let day = 1; day <= totalDays; day++) {
      const currentDateStr = this.engine.clock.getDateString();

      // ── Contrôles HACCP en début de journée ──
      await triggerDailyTempCheck(this.engine);
      haccpChecks += 4; // 4 capteurs contrôlés

      // ── Incident du jour (si mappé) ──────────
      if (DAY_INCIDENT_MAP[day]) {
        await DAY_INCIDENT_MAP[day](this.engine);
        incidentsHandled++;
      }

      // ── Service Midi ─────────────────────────
      if (services === 'midi' || services === 'midi+soir') {
        this.engine.clock.setExactTime(`${currentDateStr}T12:00:00.000Z`);
        const res = await runServiceMidi(this.engine, currentDateStr);
        servicesExecuted++;
        totalOrders += res.ordersCount;
        totalRevenueMicrounits += res.revenueInMicrounits;
        customersWithCRM += res.customersWithCRM;
        if (res.zClosed) ticketZClosedCount++;
      }

      // ── Service Soir ─────────────────────────
      if (services === 'soir' || services === 'midi+soir') {
        this.engine.clock.setExactTime(`${currentDateStr}T19:00:00.000Z`);
        const res = await runServiceSoir(this.engine, currentDateStr);
        servicesExecuted++;
        totalOrders += res.ordersCount;
        totalRevenueMicrounits += res.revenueInMicrounits;
        customersWithCRM += res.customersWithCRM;
        haccpChecks++; // Cycle refroidissement
        if (res.zClosed) ticketZClosedCount++;
      }

      // ── Fin de semaine (Samedi) ───────────────
      if (day % daysPerWeek === 0) {
        const weekNumber = Math.floor(day / daysPerWeek);
        const weeklyEvt = WEEKLY_EVENTS[weekNumber - 1];
        if (weeklyEvt) {
          await weeklyEvt(this.engine);
          incidentsHandled++;
        }
        // Rapport hebdomadaire Intelligence
        logger.info(`📊 Fin semaine ${weekNumber} — ${servicesExecuted} services · CA ${(totalRevenueMicrounits / 1_000_000).toFixed(0)}€`);
      }

      // Avancer au jour suivant (08:00)
      this.engine.clock.setExactTime(
        `${new Date(this.engine.clock.getCurrentTime().getTime() + 86400000).toISOString().split('T')[0]}T08:00:00.000Z`
      );
    }

    // ── Fin de simulation ──────────────────────────────────────────────────
    await triggerOvertimeThreshold(this.engine);
    await triggerPayrollExport(this.engine);

    const totalRevenueEur = Number((totalRevenueMicrounits / 1_000_000).toFixed(2));
    const avgTicket = totalOrders > 0 ? (totalRevenueEur / totalOrders).toFixed(2) : '0';

    logger.info(`✅ Simulation terminée — ${servicesExecuted} services · ${totalOrders} commandes · CA ${totalRevenueEur}€ · Ticket moyen ${avgTicket}€`);
    logger.info(`   📦 ${incidentsHandled} incidents gérés · 🍽️  ${ticketZClosedCount} clôtures Z · 🧼 ${haccpChecks} contrôles HACCP`);

    return {
      weeksSimulated: weeks,
      servicesExecuted,
      totalOrders,
      totalRevenueEur,
      incidentsHandled,
      ticketZClosedCount,
      customersWithCRM,
      haccpChecks,
    };
  }
}
