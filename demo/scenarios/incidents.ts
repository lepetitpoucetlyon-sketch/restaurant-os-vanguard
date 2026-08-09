import { SimulacraEngine } from '../engine/SimulacraEngine';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';

function seq(prefix: string, idx: number) {
  return `${prefix}_${idx}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── RH : Maladie chef cuisinier 3 jours ─────────────────────────────────────

export async function triggerMaladieChef(engine: SimulacraEngine): Promise<void> {
  const { tenantId } = engine.config;
  logger.warn(`[Incident] maladie_chef — absence signalée pour 3 jours`);
  await NexusEventBus.emit('hr.absence_declared', {
    v: 1, isSimulation: true, tenantId,
    userId: 'emp_chef_1',
    absenceType: 'sick',
    startDate: engine.clock.getDateString(),
    endDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
  });
  // Alerte sous-effectif → manager
  await NexusEventBus.emit('notification.urgent', {
    v: 1, tenantId,
    message: '⚠️ Chef cuisinier absent 3 jours — planification sous-effectif',
    roles: ['manager'],
    priority: 'CRITICAL',
  });
}

// ── RH : Congé sans remplaçant ──────────────────────────────────────────────

export async function triggerCongesSansRemplacant(engine: SimulacraEngine): Promise<void> {
  const { tenantId } = engine.config;
  await NexusEventBus.emit('hr.absence_declared', {
    v: 1, isSimulation: true, tenantId,
    userId: 'emp_srv_1',
    absenceType: 'vacation',
    startDate: engine.clock.getDateString(),
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  });
  await NexusEventBus.emit('notification.urgent', {
    v: 1, tenantId,
    message: '⚠️ Congé validé sans remplaçant identifié — semaine prochaine',
    roles: ['manager'],
    priority: 'HIGH',
  });
}

// ── RH : Contrat expirant dans 29 jours ─────────────────────────────────────

export async function triggerContratExpirant(engine: SimulacraEngine): Promise<void> {
  const { tenantId } = engine.config;
  await NexusEventBus.emit('hr.contract_expiring', {
    v: 1, isSimulation: true, tenantId,
    userId: 'emp_hot_1',
    contractId: 'ctr_hotesse_001',
    expiryDate: new Date(Date.now() + 29 * 86400000).toISOString().split('T')[0],
    daysRemaining: 29,
  });
}

// ── RH : Visite médicale expirée ─────────────────────────────────────────────

export async function triggerVisiteMedicaleDepassee(engine: SimulacraEngine): Promise<void> {
  const { tenantId } = engine.config;
  await NexusEventBus.emit('hr.medical_visit_expired', {
    v: 1, isSimulation: true, tenantId,
    userId: 'emp_chef_1',
    expiryDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    daysOverdue: 5,
  });
  await NexusEventBus.emit('compliance.deadline_approaching', {
    v: 1, isSimulation: true, tenantId,
    type: 'visite_medicale',
    daysLeft: -5,
  });
}

// ── RH : Heures supplémentaires dépassées ────────────────────────────────────

export async function triggerOvertimeThreshold(engine: SimulacraEngine): Promise<void> {
  const { tenantId } = engine.config;
  await NexusEventBus.emit('overtime.threshold', {
    v: 1, isSimulation: true, tenantId,
    employeeId: 'emp_srv_1',
    hoursWorked: 42,
    hoursLimit: 35,
    periodStart: engine.clock.getDateString(),
    periodEnd: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  });
  await NexusEventBus.emit('hr.overtime_alert', {
    tenantId, employeeId: 'emp_srv_1', extraMinutes: 7 * 60,
  });
}

// ── HACCP : Frigo à 14°C pendant 45 minutes ─────────────────────────────────

export async function triggerFrigoTemperatureAnomaly(engine: SimulacraEngine): Promise<void> {
  const { tenantId } = engine.config;
  logger.warn(`[Incident] frigo_temperature — 14°C pendant 45min`);
  await NexusEventBus.emit('sensor.temperature_anomaly', {
    v: 1, tenantId, sensorId: 'frigo_viande', temperature: 14, durationInMinutes: 45,
  });
  await NexusEventBus.emit('haccp.alert', {
    v: 1, isSimulation: true, tenantId,
    sensorId: 'frigo_viande',
    readingId: seq('read', Date.now()),
    alertType: 'temperature_depassement',
    severity: 'CRITICAL',
    message: 'Frigo viande à 14°C — seuil légal dépassé (4°C max)',
  });
  await NexusEventBus.emit('haccp.nonconform', {
    v: 1, isSimulation: true, tenantId,
    checkId: seq('hcpchk_frigo', Date.now()),
    correctionDeadline: Date.now() + 2 * 3600000,
  });
  // Capteur IoT offline possible
  await NexusEventBus.emit('iot.offline', {
    v: 1, isSimulation: true, tenantId,
    sensorId: 'frigo_viande_sensor',
    lastSeenAt: Date.now() - 3600000,
  });
}

// ── HACCP : DLC expirée (2 produits) ─────────────────────────────────────────

export async function triggerDLCExpire(engine: SimulacraEngine): Promise<void> {
  const { tenantId } = engine.config;
  logger.warn(`[Incident] dlc_expire — salade_verte + tomate_cerise bloquées`);
  for (const [itemId, batchNumber] of [['prod_ent_1', 'batch_salade_001'], ['prod_ent_2', 'batch_tomate_002']]) {
    await NexusEventBus.emit('dlc.expired', {
      v: 1, isSimulation: true, tenantId, itemId, batchNumber, quantity: 3,
    });
    await NexusEventBus.emit('inventory.quarantine_activated', {
      v: 1, isSimulation: true, tenantId,
      productIds: [itemId],
      reason: 'DLC dépassée — quarantaine automatique',
    });
  }
  await NexusEventBus.emit('notification.urgent', {
    v: 1, tenantId,
    message: '🚨 2 produits DLC expirée — retirés du POS automatiquement',
    roles: ['manager', 'chef_cuisinier'],
    priority: 'CRITICAL',
  });
}

// ── Stock : Ingrédient à 0 en service ────────────────────────────────────────

export async function triggerStockZero(engine: SimulacraEngine): Promise<void> {
  const { tenantId } = engine.config;
  await NexusEventBus.emit('stock.zero', {
    v: 1, isSimulation: true, tenantId,
    itemId: 'ing_viande_boeuf',
    itemName: 'Bœuf haché',
  });
  // Alerte food cost impacté
  await NexusEventBus.emit('finance.food_cost_impacted', {
    v: 1, isSimulation: true, tenantId,
    reason: 'Rupture stock bœuf haché — plat 86',
    affectedItems: ['prod_plat_1', 'prod_plat_6'],
    impactDate: engine.clock.getDateString(),
  });
}

// ── Stock : Livraison à +8% du prix PO ──────────────────────────────────────

export async function triggerLivraisonEcartPrix(engine: SimulacraEngine): Promise<void> {
  const { tenantId } = engine.config;
  await NexusEventBus.emit('procurement.mismatch_detected', {
    tenantId,
    purchaseOrderId: 'po_viande_032',
    invoiceId: 'inv_boucher_032',
    discrepancies: ['Bœuf entrecôte: +8% vs PO — 28.50€/kg vs 26.40€/kg commandé'],
  });
  await NexusEventBus.emit('finance.food_cost_impacted', {
    v: 1, isSimulation: true, tenantId,
    reason: 'Écart prix livraison +8% — fournisseur Boucheries de France',
    affectedItems: ['prod_plat_2', 'prod_plat_6'],
    impactDate: engine.clock.getDateString(),
  });
  // Recalcul marge commerciale
  await NexusEventBus.emit('commerce.margin_warning', {
    v: 1, isSimulation: true, tenantId,
    productId: 'prod_plat_2',
    currentMarginBps: 5200,
    thresholdBps: 6000,
    triggerEventId: 'evt_delivery_mismatch',
  });
}

// ── Ops : Rush critique KDS delay > 20 min ──────────────────────────────────

export async function triggerRushCritique(engine: SimulacraEngine): Promise<void> {
  const { tenantId } = engine.config;
  logger.warn(`[Incident] rush_critique — KDS delay > 20min → bridage bornes`);
  await NexusEventBus.emit('kds.rush_alert', {
    v: 1, isSimulation: true, tenantId,
    orderId: 'ord_rush_overflow',
    exceededByMinutes: 22,
  });
  await NexusEventBus.emit('kds.ticket_delayed', {
    tenantId, orderId: 'ord_rush_overflow', delayInMinutes: 22,
  });
  await NexusEventBus.emit('store.rush_mode_toggled', {
    v: 1, isSimulation: true, tenantId,
    isPaused: true, requestedBy: 'kds_auto_throttle',
  });
}

// ── Ops : Imprimante cuisine tombée ─────────────────────────────────────────

export async function triggerImprimanteTombee(engine: SimulacraEngine): Promise<void> {
  const { tenantId } = engine.config;
  await NexusEventBus.emit('kds.printer_failed', {
    v: 1, isSimulation: true, tenantId,
    orderId: 'ord_print_fail',
    printerId: 'printer_cuisine_1',
    errorReason: 'Connexion réseau perdue',
  });
  // Bascule imprimante secours
  await NexusEventBus.emit('hardware.printer_mapped', {
    v: 1, isSimulation: true, tenantId,
    printerId: 'printer_cuisine_backup',
    stationId: 'kds_chaud',
    name: 'Imprimante de secours Cuisine',
    printerType: 'kitchen',
    mappedAt: Date.now(),
  });
}

// ── Ops : Plat retourné pour allergie ───────────────────────────────────────

export async function triggerPlatRetourneAllergie(engine: SimulacraEngine): Promise<void> {
  const { tenantId } = engine.config;
  await NexusEventBus.emit('kds.dish_rebound', {
    v: 1, isSimulation: true, tenantId,
    orderId: 'ord_rebound_001',
    itemId: 'prod_plat_2',
    productName: 'Entrecôte Grillée',
    reason: 'allergen',
    operatorId: 'emp_srv_1',
    reboundAt: Date.now(),
  });
  await NexusEventBus.emit('notification.urgent', {
    v: 1, tenantId,
    message: '🚨 ALLERGIE — Entrecôte retournée table T102 — intervention immédiate',
    roles: ['chef_cuisinier', 'manager'],
    priority: 'CRITICAL',
  });
}

// ── Finance : Écart de caisse ────────────────────────────────────────────────

export async function triggerEcartCaisse(
  engine: SimulacraEngine,
  deltaEur: number
): Promise<void> {
  const { tenantId } = engine.config;
  const deltaMicrounits = deltaEur * 1_000_000;
  logger.warn(`[Incident] ecart_caisse — ${deltaEur > 0 ? '+' : ''}${deltaEur}€`);
  await NexusEventBus.emit('finance.cash_counted', {
    v: 1, isSimulation: true, tenantId,
    drawerId: 'drawer_pos_1',
    expectedAmountInMicrounits: 200_000_000,
    actualAmountInMicrounits: 200_000_000 + deltaMicrounits,
    countedBy: 'emp_mgr_1',
  });
  if (Math.abs(deltaEur) >= 20) {
    await NexusEventBus.emit('anomaly.detected', {
      v: 1, isSimulation: true, tenantId,
      type: 'caisse_ecart_critique',
      message: `Écart caisse critique de ${deltaEur}€ — audit déclenché`,
      zScore: 3.5,
    });
    await NexusEventBus.emit('analytics.anomaly_detected', {
      tenantId, metric: 'cash_drawer_delta',
      value: Math.abs(deltaEur),
      threshold: 20,
      detectedAt: new Date().toISOString(),
    });
  }
}

// ── Finance : Paiement rejeté ────────────────────────────────────────────────

export async function triggerPaiementRejete(engine: SimulacraEngine): Promise<void> {
  const { tenantId } = engine.config;
  await NexusEventBus.emit('payment.rejected', {
    v: 1, tenantId,
    orderId: seq('ord_rejected', Date.now()),
    reason: 'Carte refusée — solde insuffisant',
    amountInMicrounits: 45_000_000,
  });
}

// ── Finance : Facture groupe impayée ─────────────────────────────────────────

export async function triggerFactureImpaee(
  engine: SimulacraEngine,
  daysOverdue: number
): Promise<void> {
  const { tenantId } = engine.config;
  await NexusEventBus.emit('invoice.overdue', {
    v: 1, isSimulation: true, tenantId,
    invoiceId: seq('inv_b2b', Date.now()),
    customerId: 'cust_groupe_dupont',
    amountInMicrounits: 350_000_000,
    dueDaysOverdue: daysOverdue,
  });
}

// ── No-Show : Sans empreinte bancaire ────────────────────────────────────────

export async function triggerNoShowSansEmpreinte(engine: SimulacraEngine): Promise<void> {
  const { tenantId } = engine.config;
  await NexusEventBus.emit('reservation.no_show', {
    v: 1, isSimulation: true, tenantId,
    reservationId: 'res_demo_3',
    customerId: 'cust_bernard',
    customerName: 'Thomas Bernard',
    covers: 4,
    date: engine.clock.getDateString(),
    time: '13:00',
  });
}

// ── No-Show : Série (récidiviste → flag CRM) ─────────────────────────────────

export async function triggerNoShowSeries(engine: SimulacraEngine): Promise<void> {
  const { tenantId } = engine.config;
  logger.warn(`[Incident] no_show_series — client récidiviste flagué`);
  for (let i = 1; i <= 3; i++) {
    await NexusEventBus.emit('reservation.no_show', {
      v: 1, isSimulation: true, tenantId,
      reservationId: seq('res_noshow', i),
      customerId: 'cust_noshow_serial',
      covers: 2,
      date: engine.clock.getDateString(),
      time: '20:00',
    });
  }
  // Flag CRM + client inactif
  await NexusEventBus.emit('crm.customer_updated', {
    v: 1, isSimulation: true, tenantId,
    customerId: 'cust_noshow_serial',
    updates: { noShowCount: 3, requiresDeposit: true, riskFlag: 'HIGH' },
  });
}

// ── Huile friture > 25% polaires ─────────────────────────────────────────────

export async function triggerHuileFritureOver25Pct(engine: SimulacraEngine): Promise<void> {
  const { tenantId } = engine.config;
  await NexusEventBus.emit('haccp.nonconform', {
    v: 1, isSimulation: true, tenantId,
    checkId: seq('hcpchk_oil', Date.now()),
    correctionDeadline: Date.now() + 2 * 3600000,
  });
  await NexusEventBus.emit('facility.maintenance_required', {
    tenantId, assetId: 'fryer_principal',
    assetType: 'friteuse',
    description: 'Huile à changer — taux polaires 26% (limite légale 25%)',
  });
}

// ── Commerce : Promotion activée (remise 15%) ────────────────────────────────

export async function triggerPromoActivee(engine: SimulacraEngine): Promise<void> {
  const { tenantId } = engine.config;
  await NexusEventBus.emit('commerce.promotion_activated', {
    v: 1, isSimulation: true, tenantId,
    promotionId: 'promo_happy_hour',
    discountBps: 1500,
    productIds: ['prod_boi_3', 'prod_boi_4'],
  });
  await NexusEventBus.emit('marketing.campaign_launched', {
    v: 1, isSimulation: true, tenantId,
    campaignId: 'camp_happy_hour',
    targetSegment: 'regular_clients',
    launchedBy: 'emp_mgr_1',
  });
}

// ── Client VIP Anniversaire ──────────────────────────────────────────────────

export async function triggerAnniversaireVIP(engine: SimulacraEngine): Promise<void> {
  const { tenantId } = engine.config;
  await NexusEventBus.emit('crm.birthday_approaching', {
    v: 1, isSimulation: true, tenantId,
    customerId: 'cust_alice_martin',
    birthdayAt: engine.clock.getDateString(),
    daysUntil: 0,
  });
  await NexusEventBus.emit('notification.urgent', {
    v: 1, tenantId,
    message: '🎂 Alice Martin — anniversaire ce soir ! Offre dessert automatique prête.',
    roles: ['manager', 'hotesse'],
    priority: 'HIGH',
  });
}

// ── Retour rappel produit (recall) ───────────────────────────────────────────

export async function triggerRecallProduit(engine: SimulacraEngine): Promise<void> {
  const { tenantId } = engine.config;
  await NexusEventBus.emit('recall.declared', {
    v: 1, isSimulation: true, tenantId,
    recallId: seq('recall', Date.now()),
    productIds: ['prod_ent_3'],
    reason: 'Contamination Listeria — terrine lot 2026-08-08',
  });
  await NexusEventBus.emit('inventory.quarantine_activated', {
    v: 1, isSimulation: true, tenantId,
    productIds: ['prod_ent_3'],
    reason: 'ALERTE RAPPEL — contamination Listeria',
  });
}

// ── Transfert de table ───────────────────────────────────────────────────────

export async function triggerTransfertTable(engine: SimulacraEngine): Promise<void> {
  const { tenantId } = engine.config;
  await NexusEventBus.emit('table.transferred', {
    v: 1, isSimulation: true, tenantId,
    fromTableId: 'tbl_102',
    toTableId: 'tbl_201',
    orderId: seq('ord_transfer', Date.now()),
    operatorId: 'emp_srv_1',
    transferredAt: Date.now(),
  });
}
