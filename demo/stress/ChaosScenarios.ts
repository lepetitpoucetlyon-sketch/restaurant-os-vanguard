import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { SimulacraEngine } from '../engine/SimulacraEngine';
import { DEMO_MENU } from '../fixtures/menu';

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export interface ChaosResult {
  eventsEmitted: number;
  incidentsFired: number;
  cascadeDepth: number;
  nf525ViolationsDetected: number;
  unauthorizedAccessAttempts: number;
}

// ── Semaine Noire — tous les incidents en 1 service ──────────────────────────

export async function runSemaineNoire(engine: SimulacraEngine): Promise<ChaosResult> {
  const tenantId = engine.config.tenantId;
  let eventsEmitted = 0;
  let incidentsFired = 0;

  const emit = async (evt: string, payload: Record<string, unknown>) => {
    await (NexusEventBus.emit as any)(evt, payload);
    eventsEmitted++;
  };

  // Chef malade + cuisiner solo = sous-effectif
  await emit('hr.absence_declared', { v: 1, isSimulation: true, tenantId, userId: 'emp_chef_1', absenceType: 'sick', startDate: engine.clock.getDateString() });
  await emit('hr.absence_declared', { v: 1, isSimulation: true, tenantId, userId: 'emp_srv_1', absenceType: 'sick', startDate: engine.clock.getDateString() });
  incidentsFired += 2;

  // Frigo hors norme
  await emit('sensor.temperature_anomaly', { v: 1, tenantId, sensorId: 'frigo_viande', temperature: 14, durationInMinutes: 90 });
  await emit('haccp.alert', { v: 1, isSimulation: true, tenantId, sensorId: 'frigo_viande', readingId: uid('read'), alertType: 'temp_critique', severity: 'CRITICAL', message: 'Frigo viande 14°C — 90min dépassement' });
  await emit('haccp.nonconform', { v: 1, isSimulation: true, tenantId, checkId: uid('chk'), correctionDeadline: Date.now() + 3600000 });
  incidentsFired++;

  // DLC cascade — 3 produits
  for (const itemId of ['prod_ent_1', 'prod_ent_2', 'prod_plat_3']) {
    await emit('dlc.expired', { v: 1, isSimulation: true, tenantId, itemId, batchNumber: uid('batch'), quantity: 5 });
    await emit('inventory.quarantine_activated', { v: 1, isSimulation: true, tenantId, productIds: [itemId], reason: 'DLC expirée' });
    incidentsFired++;
  }

  // Rappel produit critique (Listeria)
  await emit('recall.declared', { v: 1, isSimulation: true, tenantId, recallId: uid('recall'), productIds: ['prod_ent_3'], reason: 'Listeria — lot 2026-08 retiré préfecture' });
  incidentsFired++;

  // Rush critique en service
  await emit('kds.rush_alert', { v: 1, isSimulation: true, tenantId, orderId: uid('ord_rush'), exceededByMinutes: 28 });
  await emit('store.rush_mode_toggled', { v: 1, isSimulation: true, tenantId, isPaused: true, requestedBy: 'kds_auto' });
  incidentsFired++;

  // Imprimante tombée (failover auto)
  await emit('kds.printer_failed', { v: 1, isSimulation: true, tenantId, orderId: uid('ord_pf'), printerId: 'printer_cuisine_1', errorReason: 'Panne réseau' });
  await emit('hardware.printer_mapped', { v: 1, isSimulation: true, tenantId, printerId: 'printer_backup', stationId: 'kds_chaud', name: 'Backup', printerType: 'kitchen', mappedAt: Date.now() });
  incidentsFired++;

  // Caisse ouverte non autorisée (fraude)
  await emit('cash_drawer.opened_unauthorized', { v: 1, isSimulation: true, tenantId, drawerId: 'drawer_pos_1', operatorId: 'emp_unknown', detectedAt: Date.now() });
  await emit('system.audit_log', { v: 1, tenantId, action: 'CASH_DRAWER_UNAUTHORIZED_OPEN', userId: 'emp_unknown', details: { drawerId: 'drawer_pos_1' }, severity: 'critical' });
  incidentsFired++;

  // Écart de caisse critique
  await emit('finance.cash_counted', { v: 1, isSimulation: true, tenantId, drawerId: 'drawer_pos_1', expectedAmountInMicrounits: 180_000_000, actualAmountInMicrounits: 125_000_000, countedBy: 'emp_mgr_1' });
  await emit('anomaly.detected', { v: 1, isSimulation: true, tenantId, type: 'caisse_ecart_critique', message: 'Écart caisse -55€ — audit urgence', zScore: 4.8 });
  incidentsFired++;

  // Paiement rejeté en service
  await emit('payment.rejected', { v: 1, tenantId, orderId: uid('ord_rej'), reason: 'Carte volée signalée', amountInMicrounits: 75_000_000 });
  incidentsFired++;

  // Plat retourné allergie × 2
  await emit('kds.dish_rebound', { v: 1, isSimulation: true, tenantId, orderId: uid('ord_rbd1'), itemId: 'prod_plat_2', productName: 'Entrecôte', reason: 'allergen', operatorId: 'emp_srv_1', reboundAt: Date.now() });
  await emit('kds.dish_rebound', { v: 1, isSimulation: true, tenantId, orderId: uid('ord_rbd2'), itemId: 'prod_plat_3', productName: 'Saumon', reason: 'client_refusal', operatorId: 'emp_srv_1', reboundAt: Date.now() });
  incidentsFired += 2;

  // No-show × 3 (série)
  for (let k = 0; k < 3; k++) {
    await emit('reservation.no_show', { v: 1, isSimulation: true, tenantId, reservationId: uid('res_ns'), customerId: 'cust_blacklist_001', covers: 4 });
    incidentsFired++;
  }
  await emit('crm.customer_updated', { v: 1, isSimulation: true, tenantId, customerId: 'cust_blacklist_001', updates: { noShowCount: 3, blacklisted: true, requiresDeposit: true } });

  // Facture impayée 30j (mise en demeure)
  await emit('invoice.overdue', { v: 1, isSimulation: true, tenantId, invoiceId: uid('inv_od'), customerId: 'cust_mauvais_payeur', amountInMicrounits: 750_000_000, dueDaysOverdue: 30 });
  incidentsFired++;

  // Fournisseur ne livre pas
  await emit('procurement.mismatch_detected', { tenantId, purchaseOrderId: uid('po_missing'), invoiceId: 'none', discrepancies: ['Livraison non effectuée — retard 3 jours', 'Stock saumon critique'] });
  await emit('stock.low', { v: 1, isSimulation: true, tenantId, itemId: 'ing_poisson_saumon', itemName: 'Saumon frais', currentQuantity: 1, threshold: 5 });
  incidentsFired++;

  // Contrat expirant + visite médicale expirée
  await emit('hr.contract_expiring', { v: 1, isSimulation: true, tenantId, userId: 'emp_hot_1', contractId: 'ctr_hot_001', expiryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], daysRemaining: 7 });
  await emit('hr.medical_visit_expired', { v: 1, isSimulation: true, tenantId, userId: 'emp_chef_1', expiryDate: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0], daysOverdue: 10 });
  incidentsFired += 2;

  // Heures supp dépassées
  await emit('overtime.threshold', { v: 1, isSimulation: true, tenantId, employeeId: 'emp_srv_1', hoursWorked: 48, hoursLimit: 35, periodStart: engine.clock.getDateString(), periodEnd: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0] });
  incidentsFired++;

  // Bris de chaîne NF525 (test de détection)
  await emit('crypto.integrity_failed', { v: 1, tenantId, journalId: uid('jrnl_corrupt'), expectedHash: 'abc123def456', actualHash: 'deadbeef0000', detectedAt: Date.now() });
  await emit('mcc.fiscal_audit_required', { tenantId, reason: 'NF525 chain integrity failure detected', urgency: 'critical' });
  incidentsFired++;

  // Avis négatifs massifs (5 d'affilée)
  for (let k = 0; k < 5; k++) {
    await emit('review.negative', { v: 1, isSimulation: true, tenantId, reviewId: uid('rev_neg'), customerId: uid('cust_rev'), rating: 1 + (k % 2), platform: k % 2 === 0 ? 'google' : 'tripadvisor', content: 'Service catastrophique.' });
    incidentsFired++;
  }

  // Sovereign breach (multi-tenant isolation test)
  await emit('sovereign.breach', { v: 1, isSimulation: true, targetTenantId: 'tenant_demo_001', anchoredTenantId: 'tenant_mal_001', path: 'tenants/tenant_demo_001/orders', message: 'Tentative accès données inter-tenant' });
  incidentsFired++;

  // MCC Health degraded
  await emit('mcc.health_ping', { tenantId, status: 'degraded', reason: 'Multiple handlers timeout' });
  await emit('mcc.dlq_quarantine', { tenantId, eventName: 'finance.cash_counted', handlerId: 'CashFlowForecastHandler', attempts: 5, lastError: 'Timeout 5000ms', quarantinedAt: Date.now() });
  incidentsFired++;

  return {
    eventsEmitted,
    incidentsFired,
    cascadeDepth: 5,
    nf525ViolationsDetected: 1,
    unauthorizedAccessAttempts: 1,
  };
}

// ── Peak Saturday — Samedi de pic (150 couverts) ─────────────────────────────

export async function runPeakSaturday(engine: SimulacraEngine): Promise<{ eventsEmitted: number; ordersCount: number }> {
  const tenantId = engine.config.tenantId;
  let eventsEmitted = 0;
  const covers = 150;
  const ordersCount = Math.ceil(covers / 2);

  for (let k = 0; k < 30; k++) {
    await NexusEventBus.emit('reservation.created', {
      v: 1, isSimulation: true, tenantId,
      reservationId: uid('res_sat'),
      guestName: `Guest ${k}`,
      partySize: 2 + (k % 4),
      scheduledAt: Date.now() + k * 600000,
      hasDeposit: k % 5 === 0,
    });
    eventsEmitted++;
    await NexusEventBus.emit('integration.reservation_received', {
      v: 1, isSimulation: true, tenantId,
      integrationId: k % 2 === 0 ? 'google_reserve' : 'zenchef',
      platform: k % 2 === 0 ? 'google' : 'zenchef',
      rawPayload: { externalId: uid('ext'), covers: 2 + (k % 4) },
    });
    eventsEmitted++;
  }

  for (let t = 1; t <= engine.config.tablesCount; t++) {
    await NexusEventBus.emit('table.locked', {
      v: 1, isSimulation: true, tenantId,
      tableId: `tbl_10${t}`,
      lockedBy: 'emp_hot_1',
      reason: 'Toutes tables réservées peak samedi',
      lockedAt: Date.now(),
    });
    eventsEmitted++;
  }

  for (let d = 0; d < 20; d++) {
    const platform = d % 2 === 0 ? 'ubereats' : 'deliveroo';
    await NexusEventBus.emit('integration.delivery_order_received', {
      v: 1, isSimulation: true, tenantId,
      integrationId: platform,
      platform,
      rawPayload: { orderId: uid('deliv'), items: [{ productId: DEMO_MENU[d % 10].id, qty: 1 }] },
    });
    eventsEmitted++;
    await NexusEventBus.emit('delivery.delivered', {
      v: 1, tenantId,
      deliveryId: uid('dlv'),
      orderId: uid('ord_deliv'),
    });
    eventsEmitted++;
  }

  await NexusEventBus.emit('store.rush_mode_toggled', { v: 1, isSimulation: true, tenantId, isPaused: true, requestedBy: 'kds_auto' });
  eventsEmitted++;

  for (let k = 0; k < 5; k++) {
    await NexusEventBus.emit('kds.rush_alert', { v: 1, isSimulation: true, tenantId, orderId: uid('ord_rush'), exceededByMinutes: 15 + k * 3 });
    eventsEmitted++;
  }

  await NexusEventBus.emit('store.rush_mode_toggled', { v: 1, isSimulation: true, tenantId, isPaused: false, requestedBy: 'emp_mgr_1' });
  eventsEmitted++;

  return { eventsEmitted, ordersCount };
}

// ── Fraude & Détection — suite de tentatives ─────────────────────────────────

export async function runFraudDetectionStress(engine: SimulacraEngine): Promise<{ eventsEmitted: number }> {
  const tenantId = engine.config.tenantId;
  let eventsEmitted = 0;

  for (let k = 0; k < 10; k++) {
    await NexusEventBus.emit('cash_drawer.opened_unauthorized', {
      v: 1, isSimulation: true, tenantId,
      drawerId: `drawer_${k % 3}`,
      operatorId: `emp_unknown_${k}`,
      detectedAt: Date.now() + k * 1000,
    });
    eventsEmitted++;
  }

  for (let k = 0; k < 8; k++) {
    await NexusEventBus.emit('payment.rejected', {
      v: 1, tenantId,
      orderId: uid('ord_fraud'),
      reason: `CB refusée (tentative ${k + 1}) — carte signalée`,
      amountInMicrounits: (30 + k * 10) * 1_000_000,
    });
    eventsEmitted++;
  }

  for (let k = 0; k < 3; k++) {
    await NexusEventBus.emit('sovereign.breach', {
      v: 1, isSimulation: true,
      targetTenantId: tenantId,
      anchoredTenantId: `tenant_attacker_${k}`,
      path: `tenants/${tenantId}/fiscalLedger`,
      message: `Tentative #${k + 1} — accès non autorisé aux données fiscales`,
    });
    eventsEmitted++;
  }

  await NexusEventBus.emit('security.pin_locked', {
    v: 1, isSimulation: true, tenantId,
    terminalId: 'pos_01',
    lockedUntil: Date.now() + 900000,
  });
  eventsEmitted++;

  await NexusEventBus.emit('mcc.fiscal_audit_required', {
    tenantId, reason: 'Multiple unauthorized cash drawer opens detected', urgency: 'critical',
  });
  eventsEmitted++;

  return { eventsEmitted };
}

// ── Cascade DLQ — handler qui plante 5× et passe en quarantaine ──────────────

export async function runDLQCascadeStress(engine: SimulacraEngine): Promise<{ eventsEmitted: number }> {
  const tenantId = engine.config.tenantId;
  let eventsEmitted = 0;

  const problematicEvents = [
    'finance.cash_counted',
    'finance.ticket_z_closed',
    'order.paid',
    'haccp.nonconform',
    'supplier.invoice_processed',
  ] as const;

  for (const eventName of problematicEvents) {
    await NexusEventBus.emit('mcc.dlq_quarantine', {
      tenantId,
      eventName,
      handlerId: `Handler_${eventName}_test`,
      attempts: 5,
      lastError: `Simulated timeout for stress test — event: ${eventName}`,
      quarantinedAt: Date.now(),
    });
    eventsEmitted++;

    await NexusEventBus.emit('mcc.fiscal_audit_required', {
      tenantId,
      reason: `Handler ${eventName} in DLQ — manual review required`,
      urgency: 'high',
    });
    eventsEmitted++;
  }

  return { eventsEmitted };
}

// ── Multi-Site Fleet Cascade (5 sites interconnectés) ─────────────────────────

export async function runFleetMultiSiteCascade(engine: SimulacraEngine): Promise<{ eventsEmitted: number; sitesCount: number }> {
  const sites = ['tenant_paris_01', 'tenant_lyon_02', 'tenant_marseille_03', 'tenant_bordeaux_04', 'tenant_lille_05'];
  let eventsEmitted = 0;

  const emit = async (evt: string, payload: Record<string, unknown>) => {
    await (NexusEventBus.emit as any)(evt, payload);
    eventsEmitted++;
  };

  // 1. Stock transfers inter-sites
  for (let i = 0; i < sites.length - 1; i++) {
    const sourceSite = sites[i];
    const targetSite = sites[i + 1];

    await emit('stock.transfer', {
      v: 1, isSimulation: true,
      tenantId: sourceSite,
      targetTenantId: targetSite,
      transferId: uid('trf'),
      lines: [
        { itemId: 'ing_viande_boeuf', quantity: 15, unit: 'kg' },
        { itemId: 'ing_poisson_saumon', quantity: 10, unit: 'kg' },
      ],
      initiatedBy: 'mgr_fleet_central',
    });

    await emit('stock.received', {
      v: 1, isSimulation: true,
      tenantId: targetSite,
      sourceTenantId: sourceSite,
      transferId: uid('trf_rcv'),
      lines: [
        { itemId: 'ing_viande_boeuf', quantity: 15, unit: 'kg' },
        { itemId: 'ing_poisson_saumon', quantity: 10, unit: 'kg' },
      ],
      receivedBy: `mgr_${targetSite}`,
    });
  }

  // 2. Transerts de personnel inter-sites (Prêt de main d'œuvre)
  for (const site of sites) {
    await emit('hr.transfer_offer', {
      v: 1, isSimulation: true,
      tenantId: site,
      employeeId: uid('emp_fleet'),
      targetTenantId: 'tenant_paris_01',
      effectiveDate: engine.clock.getDateString(),
    });
  }

  // 3. Calculs BCG & Menu Engineering Flotte
  for (const site of sites) {
    await emit('intelligence.bcg_calculated', {
      v: 1, isSimulation: true,
      tenantId: site,
      period: engine.clock.getDateString(),
      starsCount: 8,
      plowhorsesCount: 4,
      puzzlesCount: 3,
      dogsCount: 2,
    });

    await emit('commerce.margin_warning', {
      v: 1, isSimulation: true,
      tenantId: site,
      productId: 'prod_plat_1',
      currentMarginBps: 6200,
      thresholdBps: 7000,
    });
  }

  return { eventsEmitted, sitesCount: sites.length };
}

// ── Cold Chain Disaster Cascade (Rupture chaîne du froid multi-capteurs) ───────

export async function runColdChainDisasterCascade(engine: SimulacraEngine): Promise<{ eventsEmitted: number; quarantinedItemsCount: number }> {
  const tenantId = engine.config.tenantId;
  let eventsEmitted = 0;

  const emit = async (evt: string, payload: Record<string, unknown>) => {
    await (NexusEventBus.emit as any)(evt, payload);
    eventsEmitted++;
  };

  // 1. Dérive de température sur chambre froide (18°C pendant 4 heures)
  await emit('sensor.temperature_anomaly', {
    v: 1, tenantId,
    sensorId: 'chambre_froide_centrale',
    temperature: 18.5,
    durationInMinutes: 240,
  });

  await emit('haccp.alert', {
    v: 1, isSimulation: true, tenantId,
    sensorId: 'chambre_froide_centrale',
    readingId: uid('read_cf'),
    alertType: 'temp_critique_majeure',
    severity: 'CRITICAL',
    message: 'Chambre Froide 18.5°C — Rupture majeure de la chaîne du froid (4h)',
  });

  // 2. Refroidissement rapide non conforme
  await emit('haccp.cooling_cycle_logged', {
    v: 1, isSimulation: true, tenantId,
    batchId: uid('batch_cooling'),
    productName: 'Sauce Bolognese batch #402',
    startTempCelsius: 65,
    endTempCelsius: 22, // doit atteindre < 10°C en < 2h
    durationMinutes: 140,
    compliant: false,
    operatorId: 'emp_chef_1',
  });

  // 3. Mise en quarantaine automatique du stock périssable
  const perishableItems = ['ing_viande_boeuf', 'ing_poisson_saumon', 'ing_lait_creme', 'ing_volaille_poulet'];
  await emit('inventory.quarantine_activated', {
    v: 1, isSimulation: true, tenantId,
    productIds: perishableItems,
    reason: 'Rupture majeure chaîne du froid (Chambre Froide Centrale 18.5°C)',
  });

  // 4. Perte enregistrée et redirection vers don alimentaire si partiel
  for (const itemId of perishableItems) {
    await emit('waste.logged', {
      v: 1, isSimulation: true, tenantId,
      wasteId: uid('wst'),
      ingredientId: itemId,
      ingredientName: itemId,
      quantity: 25,
      unit: 'kg',
      reason: 'Rupture HACCP Chaîne du Froid',
    });
  }

  // 5. Impact immédiat sur le Food Cost
  await emit('finance.food_cost_impacted', {
    tenantId,
    reason: 'Rupture HACCP Chaîne du Froid — Perte 100kg stock périssable',
    amountInMicrounits: 850_000_000,
  });

  return { eventsEmitted, quarantinedItemsCount: perishableItems.length };
}

// ── Insider Financial Tampering (Tentative de fraude interne & altération FEC) ─

export async function runInsiderFinancialTampering(engine: SimulacraEngine): Promise<{ eventsEmitted: number }> {
  const tenantId = engine.config.tenantId;
  let eventsEmitted = 0;

  const emit = async (evt: string, payload: Record<string, unknown>) => {
    await (NexusEventBus.emit as any)(evt, payload);
    eventsEmitted++;
  };

  // 1. Offert (comp) abusif hors règles
  await emit('order.comp', {
    v: 1, isSimulation: true, tenantId,
    orderId: uid('ord_comp_fraud'),
    authorizingOperatorId: 'emp_srv_malicieux',
    reason: 'Repas offert patron (non validé)',
    amountInMicrounits: 120_000_000,
  });

  await emit('finance.food_cost_impacted', {
    tenantId,
    reason: 'Repas offert sans validation manager (comp: ord_comp_fraud)',
    amountInMicrounits: 120_000_000,
  });

  // 2. Tentative de modification de commande après fermeture de période
  await emit('finance.period_locked', {
    v: 1, isSimulation: true, tenantId,
    periodEnd: engine.clock.getDateString(),
    lockedBy: 'emp_mgr_1',
    lockedAt: Date.now(),
  });

  // 3. Corruption délibérée du hash cryptographique FEC / NF525
  await emit('crypto.integrity_failed', {
    v: 1, tenantId,
    journalId: uid('jrnl_fec_corrupt'),
    expectedHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    actualHash: 'deadbeef00000000000000000000000000000000000000000000000000000000',
    detectedAt: Date.now(),
  });

  await emit('mcc.fiscal_audit_required', {
    tenantId,
    reason: 'Attaque intégrité journal FEC / NF525 détectée',
    urgency: 'critical',
  });

  return { eventsEmitted };
}
