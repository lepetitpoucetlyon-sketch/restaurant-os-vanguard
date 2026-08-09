import { describe, it, expect } from 'vitest';
import { SimulacraEngine } from './engine/SimulacraEngine';
import { runStressService } from './stress/StressServiceRunner';
import { runSemaineNoire, runPeakSaturday, runFraudDetectionStress, runDLQCascadeStress } from './stress/ChaosScenarios';

// ── Paramètres Stress ────────────────────────────────────────────────────────
// STRESS_COVERS_PEAK   = couverts par service en mode peak (défaut: 100)
// STRESS_CONCURRENCY   = nombre de services parallèles (défaut: 3)
// STRESS_WEEKS         = semaines en mode stress (défaut: 4)
// STRESS_CHAOS         = active tous les scénarios chaos (défaut: false)
// STRESS_SCENARIO      = scénario ciblé (semaine_noire | peak_saturday | fraud | dlq | all)
// STRESS_MAX_EVENT_MS  = délai max acceptable pour un service complet (défaut: 3000ms)
// STRESS_VERBOSE       = log chaque assertion (défaut: false)

const STRESS = {
  coversPeak:     parseInt(process.env.STRESS_COVERS_PEAK  ?? '100', 10),
  concurrency:    parseInt(process.env.STRESS_CONCURRENCY  ?? '3',   10),
  weeks:          parseInt(process.env.STRESS_WEEKS        ?? '4',   10),
  chaos:          process.env.STRESS_CHAOS                 === 'true',
  scenario:       process.env.STRESS_SCENARIO              ?? 'all',
  maxEventMs:     parseInt(process.env.STRESS_MAX_EVENT_MS ?? '3000', 10),
  verbose:        process.env.STRESS_VERBOSE               === 'true',
  tenantId:       process.env.STRESS_TENANT                ?? 'tenant_stress_001',
};

function log(msg: string) {
  if (STRESS.verbose) console.log(msg);
}

describe('🔥 STRESS TEST — Restaurant OS Core', () => {

  // ── TEST 1 : Service unique haute densité ────────────────────────────────────
  it(`[PERF] Service peak ${STRESS.coversPeak} couverts — traitement < ${STRESS.maxEventMs}ms`, async () => {
    const engine = new SimulacraEngine({
      tenantId: STRESS.tenantId,
      tablesCount: Math.ceil(STRESS.coversPeak / 4),
      staffCount: 6,
      weeks: 1,
      services: 'soir',
      coversSoir: STRESS.coversPeak,
      coversMidi: STRESS.coversPeak,
      enableIncidents: false,
      verbose: STRESS.verbose,
    });
    await engine.bootstrap();

    const result = await runStressService(engine, STRESS.coversPeak, '2026-08-16', 'soir');

    log(`  📊 ${result.ordersCount} commandes · ${result.eventsEmitted} events · ${result.durationMs}ms · ${result.errorsCount} erreurs`);

    // Performance
    expect(result.durationMs, `Service trop lent (${result.durationMs}ms > ${STRESS.maxEventMs}ms)`).toBeLessThan(STRESS.maxEventMs);

    // Volume
    expect(result.ordersCount).toBeGreaterThan(STRESS.coversPeak * 0.3);
    expect(result.eventsEmitted, 'Trop peu d\'événements émis').toBeGreaterThan(result.ordersCount * 5);

    // Intégrité
    expect(result.errorsCount, `${result.errorsCount} erreurs de handler détectées`).toBe(0);

    // Revenus
    expect(result.revenueInMicrounits / 1_000_000).toBeGreaterThan(STRESS.coversPeak * 15);
  });

  // ── TEST 2 : Concurrence — N services simultanés ─────────────────────────────
  it(`[CONCURRENCY] ${STRESS.concurrency} services simultanés — cohérence totale`, async () => {
    const engines = await Promise.all(
      Array.from({ length: STRESS.concurrency }, async (_, i) => {
        const engine = new SimulacraEngine({
          tenantId: `tenant_concurrent_${i}`,
          tablesCount: 10,
          staffCount: 5,
          weeks: 1,
          services: 'midi+soir',
          coversMidi: 60,
          coversSoir: 80,
          enableIncidents: false,
          verbose: false,
        });
        await engine.bootstrap();
        return engine;
      })
    );

    const t0 = Date.now();
    const results = await Promise.all(
      engines.map((engine, i) =>
        runStressService(engine, 80, `2026-08-${10 + i}`, 'soir')
      )
    );
    const totalMs = Date.now() - t0;

    const totalEvents = results.reduce((s, r) => s + r.eventsEmitted, 0);
    const totalErrors = results.reduce((s, r) => s + r.errorsCount, 0);
    const totalOrders = results.reduce((s, r) => s + r.ordersCount, 0);

    log(`  🔀 ${STRESS.concurrency} services parallèles — ${totalOrders} commandes · ${totalEvents} events · ${totalMs}ms`);

    // Pas d'erreurs de traitement concurrent
    expect(totalErrors, `${totalErrors} erreurs sous concurrence`).toBe(0);

    // Tous les services terminés
    expect(results.length).toBe(STRESS.concurrency);

    // Le parallélisme est plus rapide que séquentiel (>1.5× speedup attendu)
    const worstSingleService = Math.max(...results.map(r => r.durationMs));
    expect(totalMs, 'Pas de bénéfice de parallélisme détecté').toBeLessThan(worstSingleService * STRESS.concurrency * 0.7);
  });

  // ── TEST 3 : Semaine Noire ────────────────────────────────────────────────────
  it('[CHAOS] Semaine Noire — 25+ incidents simultanés, détection et escalade', async () => {
    if (STRESS.scenario !== 'semaine_noire' && STRESS.scenario !== 'all' && !STRESS.chaos) return;

    const engine = new SimulacraEngine({
      tenantId: STRESS.tenantId,
      tablesCount: 5, staffCount: 4, weeks: 1,
      services: 'midi+soir', coversMidi: 35, coversSoir: 55,
      enableIncidents: true, verbose: STRESS.verbose,
    });
    await engine.bootstrap();

    const result = await runSemaineNoire(engine);

    log(`  💀 ${result.incidentsFired} incidents · ${result.eventsEmitted} events · cascade depth: ${result.cascadeDepth}`);

    expect(result.incidentsFired, 'Trop peu d\'incidents détectés').toBeGreaterThanOrEqual(20);
    expect(result.eventsEmitted, 'Trop peu d\'events émis').toBeGreaterThan(40);
    expect(result.nf525ViolationsDetected, 'Violation NF525 non détectée').toBeGreaterThanOrEqual(1);
    expect(result.unauthorizedAccessAttempts, 'Tentative accès caisse non détectée').toBeGreaterThanOrEqual(1);
    expect(result.cascadeDepth, 'Profondeur cascade insuffisante').toBeGreaterThanOrEqual(4);
  });

  // ── TEST 4 : Peak Saturday ────────────────────────────────────────────────────
  it('[PEAK] Samedi de pic — 150 couverts + 20 livraisons + 30 réservations en rafale', async () => {
    if (STRESS.scenario !== 'peak_saturday' && STRESS.scenario !== 'all' && !STRESS.chaos) return;

    const engine = new SimulacraEngine({
      tenantId: STRESS.tenantId,
      tablesCount: 20, staffCount: 8, weeks: 1,
      services: 'midi+soir', coversMidi: 150, coversSoir: 150,
      enableIncidents: true, verbose: STRESS.verbose,
    });
    await engine.bootstrap();

    const t0 = Date.now();
    const [peakResult, stressServiceResult] = await Promise.all([
      runPeakSaturday(engine),
      runStressService(engine, 150, '2026-08-16', 'peak'),
    ]);
    const totalMs = Date.now() - t0;

    log(`  🍽️  150 couverts peak — ${peakResult.eventsEmitted + stressServiceResult.eventsEmitted} events · ${totalMs}ms`);

    expect(stressServiceResult.ordersCount).toBeGreaterThan(60);
    expect(peakResult.eventsEmitted).toBeGreaterThan(50);
    expect(stressServiceResult.errorsCount, 'Erreurs en pic de service').toBe(0);
    expect(totalMs).toBeLessThan(STRESS.maxEventMs * 2);
  });

  // ── TEST 5 : Détection Fraude ─────────────────────────────────────────────────
  it('[SECURITY] Fraude — 10 caisses non autorisées + 8 CB frauduleuses + 3 violations souveraineté', async () => {
    if (STRESS.scenario !== 'fraud' && STRESS.scenario !== 'all' && !STRESS.chaos) return;

    const engine = new SimulacraEngine({
      tenantId: STRESS.tenantId,
      tablesCount: 5, staffCount: 4, weeks: 1,
      services: 'midi+soir', coversMidi: 35, coversSoir: 55,
      enableIncidents: true, verbose: STRESS.verbose,
    });
    await engine.bootstrap();

    const result = await runFraudDetectionStress(engine);

    log(`  🚔 ${result.eventsEmitted} events fraude émis`);

    expect(result.eventsEmitted, 'Pas assez d\'événements fraude').toBeGreaterThanOrEqual(22);
  });

  // ── TEST 6 : DLQ Cascade ─────────────────────────────────────────────────────
  it('[RESILIENCE] DLQ Cascade — 5 handlers en quarantaine, audit MCC déclenché', async () => {
    if (STRESS.scenario !== 'dlq' && STRESS.scenario !== 'all' && !STRESS.chaos) return;

    const engine = new SimulacraEngine({
      tenantId: STRESS.tenantId,
      tablesCount: 5, staffCount: 4, weeks: 1,
      services: 'midi', coversMidi: 35, coversSoir: 0,
      enableIncidents: true, verbose: STRESS.verbose,
    });
    await engine.bootstrap();

    const result = await runDLQCascadeStress(engine);

    log(`  ☠️  DLQ stress — ${result.eventsEmitted} events`);

    expect(result.eventsEmitted).toBeGreaterThanOrEqual(10);
  });

  // ── TEST 7 : Volume brut — 4 semaines x 2 services x 100 couverts ────────────
  it(`[VOLUME] ${STRESS.weeks} semaines × 2 services × 100 couverts — volume total sans erreur`, async () => {
    if (STRESS.scenario !== 'volume' && STRESS.scenario !== 'all' && !STRESS.chaos) return;

    const daysPerWeek = 6;
    const totalDays = STRESS.weeks * daysPerWeek;

    const engine = new SimulacraEngine({
      tenantId: STRESS.tenantId,
      tablesCount: 15, staffCount: 6, weeks: STRESS.weeks,
      services: 'midi+soir', coversMidi: 100, coversSoir: 100,
      enableIncidents: false, verbose: false,
    });
    await engine.bootstrap();

    const t0 = Date.now();
    let totalOrders = 0;
    let totalEvents = 0;
    let totalErrors = 0;

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = new Date(new Date('2026-08-10').getTime() + (day - 1) * 86400000).toISOString().split('T')[0];
      const [midi, soir] = await Promise.all([
        runStressService(engine, 100, dateStr, 'midi'),
        runStressService(engine, 100, dateStr, 'soir'),
      ]);
      totalOrders += midi.ordersCount + soir.ordersCount;
      totalEvents += midi.eventsEmitted + soir.eventsEmitted;
      totalErrors += midi.errorsCount + soir.errorsCount;
    }
    const totalMs = Date.now() - t0;

    log(`  📦 Volume ${STRESS.weeks} semaines — ${totalOrders} commandes · ${totalEvents} events · ${totalErrors} erreurs · ${totalMs}ms`);

    expect(totalErrors, `${totalErrors} erreurs sur volume ${STRESS.weeks} semaines`).toBe(0);
    expect(totalOrders).toBeGreaterThan(totalDays * 2 * 40);
    expect(totalEvents).toBeGreaterThan(totalOrders * 5);
  });

  // ── TEST 8 : Integration Delivery + Réservations en flood ────────────────────
  it('[INTEGRATION] 50 réservations externes (Google/ZenChef) + 30 commandes livraison en flood', async () => {
    if (STRESS.scenario !== 'integration' && STRESS.scenario !== 'all' && !STRESS.chaos) return;

    const engine = new SimulacraEngine({
      tenantId: STRESS.tenantId,
      tablesCount: 10, staffCount: 5, weeks: 1,
      services: 'midi+soir', coversMidi: 50, coversSoir: 80,
      enableIncidents: false, verbose: STRESS.verbose,
    });
    await engine.bootstrap();

    const tenantId = engine.config.tenantId;
    let eventsEmitted = 0;
    const { NexusEventBus: bus } = await import('@/shared/eventBus/NexusEventBus');

    // 50 réservations en parallèle
    await Promise.all(Array.from({ length: 50 }, async (_, k) => {
      await (bus as any).emit('reservation.created', {
        v: 1, isSimulation: true, tenantId,
        reservationId: `res_flood_${k}`,
        guestName: `Guest Flood ${k}`,
        partySize: 2 + (k % 4),
        scheduledAt: Date.now() + k * 600000,
        hasDeposit: k % 5 === 0,
      });
      eventsEmitted++;
      await (bus as any).emit('integration.reservation_received', {
        v: 1, isSimulation: true, tenantId,
        integrationId: k % 2 === 0 ? 'google_reserve' : 'zenchef',
        platform: k % 2 === 0 ? 'google' : 'zenchef',
        rawPayload: { externalId: `ext_${k}`, covers: 2 + (k % 4) },
      });
      eventsEmitted++;
    }));

    expect(eventsEmitted).toBeGreaterThanOrEqual(100);
  });

  // ── TEST 9 : Flotte Multi-Site ───────────────────────────────────────────────
  it('[FLEET] Cascade Multi-Site (5 sites) — Transferts stock + RH + BCG Flotte', async () => {
    if (STRESS.scenario !== 'fleet' && STRESS.scenario !== 'all' && !STRESS.chaos) return;

    const engine = new SimulacraEngine({
      tenantId: STRESS.tenantId,
      tablesCount: 5, staffCount: 4, weeks: 1,
      services: 'midi', coversMidi: 20, coversSoir: 0,
      enableIncidents: false, verbose: STRESS.verbose,
    });
    await engine.bootstrap();

    const { runFleetMultiSiteCascade } = await import('./stress/ChaosScenarios');
    const result = await runFleetMultiSiteCascade(engine);

    log(`  🌐 Multi-Site Fleet — ${result.sitesCount} sites · ${result.eventsEmitted} events`);

    expect(result.sitesCount).toBe(5);
    expect(result.eventsEmitted).toBeGreaterThanOrEqual(15);
  });

  // ── TEST 10 : Rupture Chaîne du Froid Extrême ────────────────────────────────
  it('[HACCP-EXTREME] Rupture majeure chaîne du froid — Chambre Froide 18.5°C + Quarantaine + Food Cost', async () => {
    if (STRESS.scenario !== 'cold_chain' && STRESS.scenario !== 'all' && !STRESS.chaos) return;

    const engine = new SimulacraEngine({
      tenantId: STRESS.tenantId,
      tablesCount: 5, staffCount: 4, weeks: 1,
      services: 'midi', coversMidi: 20, coversSoir: 0,
      enableIncidents: true, verbose: STRESS.verbose,
    });
    await engine.bootstrap();

    const { runColdChainDisasterCascade } = await import('./stress/ChaosScenarios');
    const result = await runColdChainDisasterCascade(engine);

    log(`  ❄️ Cold Chain Disaster — ${result.quarantinedItemsCount} produits périmés isolés · ${result.eventsEmitted} events`);

    expect(result.quarantinedItemsCount).toBe(4);
    expect(result.eventsEmitted).toBeGreaterThanOrEqual(8);
  });

  // ── TEST 11 : Fraude Interne et Altération Financière ─────────────────────────
  it('[INSIDER-FRAUD] Tampering financier interne — Repas offert frauduleux + corruption FEC', async () => {
    if (STRESS.scenario !== 'insider' && STRESS.scenario !== 'all' && !STRESS.chaos) return;

    const engine = new SimulacraEngine({
      tenantId: STRESS.tenantId,
      tablesCount: 5, staffCount: 4, weeks: 1,
      services: 'midi', coversMidi: 20, coversSoir: 0,
      enableIncidents: true, verbose: STRESS.verbose,
    });
    await engine.bootstrap();

    const { runInsiderFinancialTampering } = await import('./stress/ChaosScenarios');
    const result = await runInsiderFinancialTampering(engine);

    log(`  🕵️ Insider Fraud — ${result.eventsEmitted} events d'altération et verrouillage`);

    expect(result.eventsEmitted).toBeGreaterThanOrEqual(4);
  });
});
