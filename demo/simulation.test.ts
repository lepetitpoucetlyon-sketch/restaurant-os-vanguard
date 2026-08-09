import { describe, it, expect } from 'vitest';
import { SimulacraEngine } from './engine/SimulacraEngine';
import { ScenarioRunner } from './engine/ScenarioRunner';
import { assertWeeklyCoherence } from './assertions/weeklyCoherence';
import { assertNF525Integrity } from './assertions/nf525Integrity';
import { assertBusinessKPIs } from './assertions/businessKPIs';
import {
  triggerMaladieChef,
  triggerFrigoTemperatureAnomaly,
  triggerDLCExpire,
  triggerRushCritique,
  triggerNoShowSeries,
  triggerImprimanteTombee,
  triggerPlatRetourneAllergie,
  triggerStockZero,
  triggerLivraisonEcartPrix,
  triggerPromoActivee,
  triggerAnniversaireVIP,
  triggerRecallProduit,
  triggerTransfertTable,
  triggerEcartCaisse,
  triggerFactureImpaee,
} from './scenarios/incidents';
import {
  triggerHuileOver25,
  triggerDailyTempCheck,
} from './scenarios/haccp';

describe('🎬 Simulation de Vie — Restaurant OS Core', () => {
  it('exécute la simulation complète de vie restaurant et valide les assertions de cohérence', async () => {
    const weeks = parseInt(process.env.DEMO_WEEKS ?? '2', 10);
    const tablesCount = parseInt(process.env.DEMO_TABLES ?? '5', 10);
    const staffCount = parseInt(process.env.DEMO_STAFF ?? '4', 10);
    const services = (process.env.DEMO_SERVICES ?? 'midi+soir') as 'midi' | 'soir' | 'midi+soir';
    const coversMidi = parseInt(process.env.DEMO_COVERS_MIDI ?? '35', 10);
    const coversSoir = parseInt(process.env.DEMO_COVERS_SOIR ?? '55', 10);
    const enableIncidents = process.env.DEMO_INCIDENTS === 'true';
    const forcedScenario = process.env.DEMO_SCENARIO ?? null;
    const verbose = process.env.DEMO_VERBOSE === 'true';
    const tenantId = process.env.DEMO_TENANT ?? 'tenant_demo_001';

    const engine = new SimulacraEngine({
      tenantId, weeks, tablesCount, staffCount,
      services, coversMidi, coversSoir, enableIncidents, forcedScenario, verbose,
    });

    await engine.bootstrap();

    // ── Scénario forcé ────────────────────────────────────────────────────────
    if (forcedScenario) {
      switch (forcedScenario) {
        case 'maladie_chef':           await triggerMaladieChef(engine); break;
        case 'frigo_temperature':      await triggerFrigoTemperatureAnomaly(engine); break;
        case 'dlc_cascade':
        case 'dlc_expire':             await triggerDLCExpire(engine); break;
        case 'rush_critique':          await triggerRushCritique(engine); break;
        case 'no_show_series':         await triggerNoShowSeries(engine); break;
        case 'imprimante_tombee':      await triggerImprimanteTombee(engine); break;
        case 'plat_retourne_allergie': await triggerPlatRetourneAllergie(engine); break;
        case 'stock_zero':             await triggerStockZero(engine); break;
        case 'livraison_ecart_prix':   await triggerLivraisonEcartPrix(engine); break;
        case 'lancement_promo':        await triggerPromoActivee(engine); break;
        case 'anniversaire_client_vip':await triggerAnniversaireVIP(engine); break;
        case 'recall_produit':         await triggerRecallProduit(engine); break;
        case 'transfert_table':        await triggerTransfertTable(engine); break;
        case 'ecart_caisse_5euros':    await triggerEcartCaisse(engine, -5); break;
        case 'ecart_caisse_gros':      await triggerEcartCaisse(engine, 50); break;
        case 'facture_impayee_b2b':    await triggerFactureImpaee(engine, 7); break;
        case 'facture_impayee_30j':    await triggerFactureImpaee(engine, 30); break;
        case 'huile_friture_25pct':    await triggerHuileOver25(engine); break;
      }
    }

    // ── Simulation temporelle globale ─────────────────────────────────────────
    const runner = new ScenarioRunner(engine);
    const summary = await runner.runFullSimulation();

    // ── Assertions de cohérence ───────────────────────────────────────────────
    assertWeeklyCoherence(summary);
    assertNF525Integrity(summary);
    assertBusinessKPIs(summary);

    // Sanity guards
    expect(summary.servicesExecuted).toBeGreaterThan(0);
    expect(summary.totalOrders).toBeGreaterThan(0);
    expect(summary.haccpChecks).toBeGreaterThan(0);
    expect(summary.ticketZClosedCount).toBe(summary.servicesExecuted);
  });
});
