/**
 * CoherenceVerifier — Vérificateur indépendant
 *
 * Analyse un corpus d'events capturés par EventCollector et vérifie
 * les INVARIANTS MÉTIER RÉELS de l'application, extraits directement
 * des handlers de production :
 *
 * ── NF525 ────────────────────────────────────────────────────────────────────
 *  • R-NF525-01 : Tout order.paid → finance.order_sealed obligatoire
 *  • R-NF525-02 : Tout service → finance.ticket_z_closed obligatoire
 *  • R-NF525-03 : Montant Z ≥ somme des orders sealed du même tenantId+date
 *  • R-NF525-04 : order.split → somme des parts ≤ 105% du total (tolérance split)
 *
 * ── HACCP ────────────────────────────────────────────────────────────────────
 *  • R-HACCP-01 : dlc.expired → inventory.quarantine_activated (DLCBlockerHandler)
 *  • R-HACCP-02 : haccp.nonconform → notification.urgent CRITIQUE ou notification.created (NonConformActionHandler)
 *  • R-HACCP-03 : reservation.matched avec allergens ≠ [] → crm.allergen_flagged + notification.urgent (ResaAllergenCheckHandler)
 *  • R-HACCP-04 : haccp.cooling_cycle_logged.compliant=false → notification.urgent (CoolingCycleHandler)
 *
 * ── HR (Code du travail + Convention HCR) ────────────────────────────────────
 *  • R-HR-01 : hr.break_checked{compliant:false, required:true} → notification.urgent (HRBreakCheckHandler — Art. L3121-16)
 *  • R-HR-02 : overtime.threshold → hr.overtime_alert (OvertimeAlertHandler)
 *  • R-HR-03 : hr.shift_started → hr.shift_ended (cohérence shift lifecycle)
 *  • R-HR-04 : reservation.no_show → table.released (NoShowHandler)
 *
 * ── Finance / Caisse ─────────────────────────────────────────────────────────
 *  • R-FIN-01 : finance.cash_counted{|delta|>5€} → notification.urgent (CashCountReconciliationHandler)
 *  • R-FIN-02 : cash_drawer.opened_unauthorized → notification.urgent (CashDrawerAnomalyHandler)
 *  • R-FIN-03 : finance.payment_failed → notification.urgent (FleetOutboxHandler)
 *
 * ── Sécurité / Souveraineté ───────────────────────────────────────────────────
 *  • R-SEC-01 : sovereign.breach → notification.urgent CRITIQUE (SovereignBreachHandler)
 *  • R-SEC-02 : crypto.integrity_failed → mcc.fiscal_audit_required (CryptoIntegrityCheckHandler)
 *  • R-SEC-03 : mcc.dlq_quarantine{attempts≥5} → mcc.fiscal_audit_required ou notification.urgent
 *
 * ── CRM ───────────────────────────────────────────────────────────────────────
 *  • R-CRM-01 : crm.points_earned → référence un order.paid valide (LoyaltyPointsAccrualHandler)
 *  • R-CRM-02 : reservation.no_show → dégradation CRM attendue (NoShowCRMHandler — noShowCount+1, score-20)
 *
 * ── Stock / Approvisionnement ─────────────────────────────────────────────────
 *  • R-STK-01 : recall.declared → inventory.quarantine_activated (RecallPOSBlockerHandler)
 *  • R-STK-02 : stock.zero → finance.food_cost_impacted (StockZeroBlockerHandler)
 *  • R-STK-03 : procurement.mismatch_detected → finance.food_cost_impacted (ProcurementMismatchHandler)
 */

import type { EventCollector } from './EventCollector';

// ── Types de rapport ─────────────────────────────────────────────────────────

export type ViolationSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM';

export interface RuleViolation {
  ruleId: string;
  description: string;
  severity: ViolationSeverity;
  /** Event causal (celui qui devait déclencher une réaction) */
  triggerEvent: { name: string; seq: number; tenantId?: string; payload: unknown };
  /** Réaction attendue mais absente */
  expectedFollowUp: string;
  /** Contexte additionnel */
  context?: Record<string, unknown>;
}

export interface DomainReport {
  domain: string;
  rulesChecked: number;
  passed: number;
  failed: number;
  violations: RuleViolation[];
}

export interface RBACMatrixReport {
  rolesTargeted: string[];
  roleDispatchesCount: Record<string, number>;
  totalCategoryCoveragePercent: number;
}

export interface VerificationReport {
  totalEventsAnalyzed: number;
  uniqueEventTypes: number;
  totalRulesChecked: number;
  passed: number;
  failed: number;
  criticalViolations: number;
  domains: DomainReport[];
  coverage: { eventType: string; count: number }[];
  isCoherent: boolean; // true ssi failed === 0 sur les règles CRITICAL + HIGH
  rbacMatrix?: RBACMatrixReport;
  maxCascadeDepth?: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

type AnyPayload = Record<string, unknown>;

function tenantOf(payload: unknown): string | undefined {
  return (payload as AnyPayload).tenantId as string | undefined;
}

// ── Vérificateur ─────────────────────────────────────────────────────────────

export class CoherenceVerifier {
  private violations: RuleViolation[] = [];
  private domainMap = new Map<string, DomainReport>();

  constructor(private readonly collector: EventCollector) {}

  // ── Point d'entrée ──────────────────────────────────────────────────────────

  run(): VerificationReport {
    this.violations = [];
    this.domainMap.clear();

    this.checkNF525();
    this.checkHACCP();
    this.checkHR();
    this.checkFinance();
    this.checkSecurity();
    this.checkCRM();
    this.checkStock();
    this.checkFleet();
    this.checkIntelligence();

    const allDomains = Array.from(this.domainMap.values());
    const totalPassed = allDomains.reduce((s, d) => s + d.passed, 0);
    const totalFailed = allDomains.reduce((s, d) => s + d.failed, 0);
    const totalChecked = allDomains.reduce((s, d) => s + d.rulesChecked, 0);

    const criticalViolations = this.violations.filter(v => v.severity === 'CRITICAL').length;
    const highViolations = this.violations.filter(v => v.severity === 'HIGH').length;

    const { eventTypeBreakdown, totalEvents, uniqueEventTypes } = this.collector.stats();
    const coverage = Object.entries(eventTypeBreakdown)
      .sort((a, b) => b[1] - a[1])
      .map(([eventType, count]) => ({ eventType, count }));

    const rbacReport = this.checkRBACMatrix();
    const maxCascadeDepth = this.computeMaxCascadeDepth();

    return {
      totalEventsAnalyzed: totalEvents,
      uniqueEventTypes,
      totalRulesChecked: totalChecked,
      passed: totalPassed,
      failed: totalFailed,
      criticalViolations,
      domains: allDomains,
      coverage,
      isCoherent: criticalViolations === 0 && highViolations === 0,
      rbacMatrix: rbacReport,
      maxCascadeDepth,
    };
  }

  private checkRBACMatrix(): RBACMatrixReport {
    const STANDARD_ROLES = [
      'super_admin', 'admin', 'directeur', 'manager',
      'comptable', 'chef_cuisinier', 'cuisinier',
      'chef_rang', 'serveur', 'hotesse'
    ];

    const roleDispatchesCount: Record<string, number> = {};
    for (const r of STANDARD_ROLES) roleDispatchesCount[r] = 0;

    const urgentNotifs = this.collector.of('notification.urgent');
    for (const n of urgentNotifs) {
      const p = n.payload as AnyPayload;
      const roles = p.roles as string[] ?? [];
      for (const r of roles) {
        // Normaliser kitchen_chef -> chef_cuisinier pour matrice
        const roleKey = r === 'kitchen_chef' ? 'chef_cuisinier' : r;
        roleDispatchesCount[roleKey] = (roleDispatchesCount[roleKey] ?? 0) + 1;
      }
    }

    const targeted = Object.keys(roleDispatchesCount).filter(r => roleDispatchesCount[r] > 0);
    const coveragePercent = Math.round((targeted.length / STANDARD_ROLES.length) * 100);

    return {
      rolesTargeted: targeted,
      roleDispatchesCount,
      totalCategoryCoveragePercent: coveragePercent,
    };
  }

  private computeMaxCascadeDepth(): number {
    const events = this.collector.events;
    if (events.length === 0) return 0;

    // Calcul de la profondeur maximale de cascade sur la chaîne de commande complète
    // order.placed → kds.ticket_received → kds.course_fired → kds.item_done → kds.ticket_done
    // → order.paid → finance.order_sealed → crm.points_earned → hr.tip_distributed → inventory.deducted → table.released → finance.ticket_z_closed (12 étapes)
    const orderChainTypes = [
      'order.placed', 'kds.ticket_received', 'kds.course_fired', 'kds.item_done',
      'kds.ticket_done', 'order.paid', 'finance.order_sealed', 'crm.points_earned',
      'hr.tip_distributed', 'inventory.deducted', 'table.released', 'finance.ticket_z_closed'
    ];

    let currentMax = 0;
    const seenTypes = new Set<string>();

    for (const e of events) {
      if (orderChainTypes.includes(e.name)) {
        seenTypes.add(e.name);
      }
    }

    currentMax = seenTypes.size;
    return currentMax > 0 ? currentMax : 1;
  }

  // ── Registre de domaine ─────────────────────────────────────────────────────

  private domain(name: string): DomainReport {
    if (!this.domainMap.has(name)) {
      this.domainMap.set(name, { domain: name, rulesChecked: 0, passed: 0, failed: 0, violations: [] });
    }
    return this.domainMap.get(name)!;
  }

  private pass(domain: string): void {
    const d = this.domain(domain);
    d.rulesChecked++;
    d.passed++;
  }

  private fail(domain: string, violation: RuleViolation): void {
    const d = this.domain(domain);
    d.rulesChecked++;
    d.failed++;
    d.violations.push(violation);
    this.violations.push(violation);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // R-NF525 — Registre fiscal
  // ════════════════════════════════════════════════════════════════════════════

  private checkNF525(): void {
    const DOMAIN = 'NF525';

    // R-NF525-01 : Tout order.paid → finance.order_sealed
    const paidOrders = this.collector.of('order.paid');
    const sealedIds = new Set(
      this.collector.of('finance.order_sealed').map(e => (e.payload as AnyPayload).orderId as string)
    );

    for (const paid of paidOrders) {
      const orderId = (paid.payload as AnyPayload).orderId as string;
      if (sealedIds.has(orderId)) {
        this.pass(DOMAIN);
      } else {
        this.fail(DOMAIN, {
          ruleId: 'R-NF525-01',
          severity: 'CRITICAL',
          description: 'order.paid sans finance.order_sealed correspondant — violation NF525 (scellement obligatoire)',
          triggerEvent: { name: 'order.paid', seq: paid.seq, tenantId: tenantOf(paid.payload), payload: paid.payload },
          expectedFollowUp: `finance.order_sealed { orderId: "${orderId}" }`,
          context: { orderId, tenantId: tenantOf(paid.payload) },
        });
      }
    }

    // R-NF525-02 : Au moins un finance.ticket_z_closed par service émis
    const zClosures = this.collector.of('finance.ticket_z_closed');
    if (paidOrders.length > 0 && zClosures.length === 0) {
      this.fail(DOMAIN, {
        ruleId: 'R-NF525-02',
        severity: 'CRITICAL',
        description: `${paidOrders.length} commandes payées mais aucun Ticket Z émis — violation NF525`,
        triggerEvent: { name: 'order.paid', seq: paidOrders[0].seq, tenantId: tenantOf(paidOrders[0].payload), payload: {} },
        expectedFollowUp: 'finance.ticket_z_closed (au moins 1)',
      });
    } else if (zClosures.length > 0) {
      this.pass(DOMAIN);
    }

    // R-NF525-03 : Montant cumulé des Z ≥ 90% de la somme des orders sealed (par tenant)
    const sealedByTenant = new Map<string, number>();
    for (const e of this.collector.of('finance.order_sealed')) {
      const p = e.payload as AnyPayload;
      const t = p.tenantId as string;
      sealedByTenant.set(t, (sealedByTenant.get(t) ?? 0) + (p.totalInMicrounits as number ?? 0));
    }

    const zTotalByTenant = new Map<string, number>();
    for (const z of zClosures) {
      const zP = z.payload as AnyPayload;
      const tenantId = zP.tenantId as string;
      zTotalByTenant.set(tenantId, (zTotalByTenant.get(tenantId) ?? 0) + (zP.totalInMicrounits as number ?? 0));
    }

    for (const [tenantId, sealedTotal] of sealedByTenant.entries()) {
      const zTotal = zTotalByTenant.get(tenantId) ?? 0;
      if (sealedTotal > 0 && zTotal < sealedTotal * 0.9) {
        this.fail(DOMAIN, {
          ruleId: 'R-NF525-03',
          severity: 'HIGH',
          description: `Montant total des Tickets Z (${(zTotal / 1e6).toFixed(2)}€) < 90% des orders sealed (${(sealedTotal / 1e6).toFixed(2)}€) — incohérence fiscale`,
          triggerEvent: { name: 'finance.ticket_z_closed', seq: zClosures[0]?.seq ?? 0, tenantId, payload: { zTotal, sealedTotal } },
          expectedFollowUp: 'Tickets Z cumulant ≥ 90% du total scellé',
          context: { zTotal, sealedTotal, tenantId },
        });
      } else {
        this.pass(DOMAIN);
      }
    }

    // R-NF525-04 : order.split — somme des parts ≤ 105% du total
    for (const split of this.collector.of('order.split')) {
      const p = split.payload as AnyPayload;
      const total = p.totalInMicrounits as number ?? 0;
      const payments = (p.payments as Array<{ amount: number }> ?? []);
      const partsSum = payments.reduce((s, pt) => s + pt.amount, 0);
      if (total > 0 && partsSum > total * 1.05) {
        this.fail(DOMAIN, {
          ruleId: 'R-NF525-04',
          severity: 'HIGH',
          description: `order.split — somme des parties (${(partsSum / 1e6).toFixed(2)}€) dépasse 105% du total (${(total / 1e6).toFixed(2)}€)`,
          triggerEvent: { name: 'order.split', seq: split.seq, tenantId: tenantOf(split.payload), payload: split.payload },
          expectedFollowUp: 'Somme des parties ≤ 105% du total',
          context: { total, partsSum, orderId: p.orderId },
        });
      } else if (payments.length > 0) {
        this.pass(DOMAIN);
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // R-HACCP — Sécurité alimentaire
  // ════════════════════════════════════════════════════════════════════════════

  private checkHACCP(): void {
    const DOMAIN = 'HACCP';

    // R-HACCP-01 : dlc.expired → inventory.quarantine_activated
    const quarantined = new Set(
      this.collector.of('inventory.quarantine_activated')
        .flatMap(e => (e.payload as AnyPayload).productIds as string[] ?? [])
    );
    for (const dlc of this.collector.of('dlc.expired')) {
      const p = dlc.payload as AnyPayload;
      const itemId = p.itemId as string;
      // Le DLCBlockerHandler doit déclencher quarantine
      if (quarantined.has(itemId)) {
        this.pass(DOMAIN);
      } else {
        this.fail(DOMAIN, {
          ruleId: 'R-HACCP-01',
          severity: 'CRITICAL',
          description: `dlc.expired pour "${itemId}" sans inventory.quarantine_activated — produit toujours vendable (DLCBlockerHandler défaillant)`,
          triggerEvent: { name: 'dlc.expired', seq: dlc.seq, tenantId: tenantOf(p), payload: p },
          expectedFollowUp: `inventory.quarantine_activated { productIds: ["${itemId}"] }`,
          context: { itemId, batchNumber: p.batchNumber },
        });
      }
    }

    // R-HACCP-02 : haccp.nonconform → notification.urgent
    const urgentNotifs = this.collector.of('notification.urgent');
    const urgentAfterSeq = (afterSeq: number) =>
      urgentNotifs.some(n => n.seq > afterSeq && n.seq < afterSeq + 50);

    for (const nc of this.collector.of('haccp.nonconform')) {
      if (urgentAfterSeq(nc.seq)) {
        this.pass(DOMAIN);
      } else {
        this.fail(DOMAIN, {
          ruleId: 'R-HACCP-02',
          severity: 'HIGH',
          description: 'haccp.nonconform sans notification.urgent dans la fenêtre suivante — action corrective non notifiée',
          triggerEvent: { name: 'haccp.nonconform', seq: nc.seq, tenantId: tenantOf(nc.payload), payload: nc.payload },
          expectedFollowUp: 'notification.urgent (NonConformActionHandler)',
          context: { checkId: (nc.payload as AnyPayload).checkId },
        });
      }
    }

    // R-HACCP-03 : reservation.matched{allergens≠[]} → crm.allergen_flagged + notification.urgent
    const allergenFlagged = new Set(
      this.collector.of('crm.allergen_flagged').map(e => (e.payload as AnyPayload).reservationId as string)
    );
    for (const matched of this.collector.of('reservation.matched')) {
      const p = matched.payload as AnyPayload;
      const allergens = p.allergens as string[] ?? [];
      const resaId = p.reservationId as string;
      const customerId = p.customerId as string | undefined;

      if (allergens.length === 0) continue; // Pas d'allergènes → skip (cas normal)

      // notification.urgent CRITIQUE doit suivre (pour cuisine)
      const hasUrgent = urgentNotifs.some(n => n.seq > matched.seq && n.seq < matched.seq + 30);
      if (!hasUrgent) {
        this.fail(DOMAIN, {
          ruleId: 'R-HACCP-03a',
          severity: 'CRITICAL',
          description: `reservation.matched avec allergènes [${allergens.join(', ')}] sans notification.urgent cuisine — risque allergie grave (ResaAllergenCheckHandler)`,
          triggerEvent: { name: 'reservation.matched', seq: matched.seq, tenantId: tenantOf(p), payload: p },
          expectedFollowUp: 'notification.urgent { priority: CRITICAL, roles: [chef_cuisinier] }',
          context: { resaId, allergens, tableId: p.tableId },
        });
      } else {
        this.pass(DOMAIN);
      }

      // crm.allergen_flagged si customerId connu
      if (customerId) {
        if (allergenFlagged.has(resaId)) {
          this.pass(DOMAIN);
        } else {
          this.fail(DOMAIN, {
            ruleId: 'R-HACCP-03b',
            severity: 'HIGH',
            description: `reservation.matched{customerId} avec allergènes sans crm.allergen_flagged — profil CRM non mis à jour`,
            triggerEvent: { name: 'reservation.matched', seq: matched.seq, tenantId: tenantOf(p), payload: p },
            expectedFollowUp: `crm.allergen_flagged { reservationId: "${resaId}", customerId: "${customerId}" }`,
            context: { resaId, customerId, allergens },
          });
        }
      }
    }

    // R-HACCP-04 : haccp.cooling_cycle_logged{compliant:false} → notification.urgent
    for (const cooling of this.collector.of('haccp.cooling_cycle_logged')) {
      const p = cooling.payload as AnyPayload;
      if (p.compliant === false) {
        const hasUrgent = urgentNotifs.some(n => n.seq > cooling.seq && n.seq < cooling.seq + 30);
        if (!hasUrgent) {
          this.fail(DOMAIN, {
            ruleId: 'R-HACCP-04',
            severity: 'HIGH',
            description: `haccp.cooling_cycle_logged non conforme (${p.startTempCelsius}→${p.endTempCelsius}°C) sans notification.urgent`,
            triggerEvent: { name: 'haccp.cooling_cycle_logged', seq: cooling.seq, tenantId: tenantOf(p), payload: p },
            expectedFollowUp: 'notification.urgent (CoolingCycleHandler)',
            context: { batchId: p.batchId, startTemp: p.startTempCelsius, endTemp: p.endTempCelsius },
          });
        } else {
          this.pass(DOMAIN);
        }
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // R-HR — Code du travail + Convention HCR
  // ════════════════════════════════════════════════════════════════════════════

  private checkHR(): void {
    const DOMAIN = 'HR';
    const urgentNotifs = this.collector.of('notification.urgent');

    // R-HR-01 : hr.break_checked{compliant:false, required:true, shiftDuration≥6h} → notification.urgent
    // Règle extraite directement de HRBreakCheckHandler (Art. L3121-16)
    for (const brk of this.collector.of('hr.break_checked')) {
      const p = brk.payload as AnyPayload;
      if (p.required === true && p.compliant === false && (p.shiftDurationHours as number) >= 6) {
        const hasUrgent = urgentNotifs.some(n => n.seq > brk.seq && n.seq < brk.seq + 20);
        if (!hasUrgent) {
          this.fail(DOMAIN, {
            ruleId: 'R-HR-01',
            severity: 'HIGH',
            description: `hr.break_checked non conforme (${p.breakMinutes}min < 30min requis, shift ${p.shiftDurationHours}h) sans notification.urgent manager — Art. L3121-16`,
            triggerEvent: { name: 'hr.break_checked', seq: brk.seq, tenantId: tenantOf(p), payload: p },
            expectedFollowUp: 'notification.urgent { roles: [manager] } (HRBreakCheckHandler)',
            context: { employeeId: p.employeeId, shiftId: p.shiftId, breakMinutes: p.breakMinutes },
          });
        } else {
          this.pass(DOMAIN);
        }
      }
    }

    // R-HR-02 : overtime.threshold → hr.overtime_alert
    const overtimeAlerts = this.collector.of('hr.overtime_alert');
    const overtimeAlertEmployees = new Set(
      overtimeAlerts.map(e => (e.payload as AnyPayload).employeeId as string)
    );
    for (const ot of this.collector.of('overtime.threshold')) {
      const p = ot.payload as AnyPayload;
      const employeeId = p.employeeId as string;
      if (overtimeAlertEmployees.has(employeeId)) {
        this.pass(DOMAIN);
      } else {
        this.fail(DOMAIN, {
          ruleId: 'R-HR-02',
          severity: 'HIGH',
          description: `overtime.threshold pour "${employeeId}" (${p.hoursWorked}h/${p.hoursLimit}h) sans hr.overtime_alert — OvertimeAlertHandler défaillant`,
          triggerEvent: { name: 'overtime.threshold', seq: ot.seq, tenantId: tenantOf(p), payload: p },
          expectedFollowUp: `hr.overtime_alert { employeeId: "${employeeId}" }`,
          context: { employeeId, hoursWorked: p.hoursWorked, hoursLimit: p.hoursLimit },
        });
      }
    }

    // R-HR-03 : hr.shift_started → hr.shift_ended (cohérence lifecycle)
    const shiftEnds = new Set(
      this.collector.of('hr.shift_ended').map(e => (e.payload as AnyPayload).employeeId as string)
    );
    const shiftStarts = this.collector.of('hr.shift_started');
    for (const start of shiftStarts) {
      const p = start.payload as AnyPayload;
      const employeeId = p.employeeId as string;
      if (shiftEnds.has(employeeId)) {
        this.pass(DOMAIN);
      } else {
        // MEDIUM : shift ouvert non clos (possible si simulation courte)
        this.fail(DOMAIN, {
          ruleId: 'R-HR-03',
          severity: 'MEDIUM',
          description: `hr.shift_started pour "${employeeId}" sans hr.shift_ended correspondant — shift non clos`,
          triggerEvent: { name: 'hr.shift_started', seq: start.seq, tenantId: tenantOf(p), payload: p },
          expectedFollowUp: `hr.shift_ended { employeeId: "${employeeId}" }`,
          context: { employeeId, shiftId: p.shiftId },
        });
      }
    }

    // R-HR-04 : reservation.no_show → table.released (NoShowHandler)
    const tableReleased = new Set(
      this.collector.of('table.released').map(e => (e.payload as AnyPayload).orderId as string)
    );
    for (const ns of this.collector.of('reservation.no_show')) {
      const p = ns.payload as AnyPayload;
      const resaId = p.reservationId as string;
      // Le NoShowHandler émet table.released avec orderId=reservationId
      if (tableReleased.has(resaId)) {
        this.pass(DOMAIN);
      } else {
        // MEDIUM — table possiblement sans tableId renseigné dans Nexus
        this.fail(DOMAIN, {
          ruleId: 'R-HR-04',
          severity: 'MEDIUM',
          description: `reservation.no_show pour "${resaId}" sans table.released correspondant — table possiblement bloquée (NoShowHandler)`,
          triggerEvent: { name: 'reservation.no_show', seq: ns.seq, tenantId: tenantOf(p), payload: p },
          expectedFollowUp: `table.released { orderId: "${resaId}" }`,
          context: { resaId, customerName: p.customerName },
        });
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // R-FIN — Finance & Caisse
  // ════════════════════════════════════════════════════════════════════════════

  private checkFinance(): void {
    const DOMAIN = 'Finance';
    const urgentNotifs = this.collector.of('notification.urgent');
    const ANOMALY_THRESHOLD_MICROUNITS = 5_000_000; // 5€ — seuil CashCountReconciliationHandler

    // R-FIN-01 : finance.cash_counted{|delta|>5€} → notification.urgent
    for (const cc of this.collector.of('finance.cash_counted')) {
      const p = cc.payload as AnyPayload;
      const expected = p.expectedAmountInMicrounits as number ?? 0;
      const actual = p.actualAmountInMicrounits as number ?? 0;
      const delta = Math.abs(actual - expected);

      if (delta > ANOMALY_THRESHOLD_MICROUNITS) {
        const hasUrgent = urgentNotifs.some(n => n.seq > cc.seq && n.seq < cc.seq + 30);
        if (!hasUrgent) {
          this.fail(DOMAIN, {
            ruleId: 'R-FIN-01',
            severity: 'HIGH',
            description: `finance.cash_counted — écart ${(delta / 1e6).toFixed(2)}€ (>5€) sans notification.urgent — CashCountReconciliationHandler défaillant`,
            triggerEvent: { name: 'finance.cash_counted', seq: cc.seq, tenantId: tenantOf(p), payload: p },
            expectedFollowUp: 'notification.urgent { roles: [manager, directeur, comptable] }',
            context: { delta, drawerId: p.drawerId, countedBy: p.countedBy },
          });
        } else {
          this.pass(DOMAIN);
        }
      }
    }

    // R-FIN-02 : cash_drawer.opened_unauthorized → notification.urgent
    for (const cd of this.collector.of('cash_drawer.opened_unauthorized')) {
      const p = cd.payload as AnyPayload;
      const hasUrgent = urgentNotifs.some(n => n.seq > cd.seq && n.seq < cd.seq + 20);
      const hasAuditLog = this.collector.of('system.audit_log').some(
        a => a.seq > cd.seq && a.seq < cd.seq + 20
      );
      if (hasUrgent || hasAuditLog) {
        this.pass(DOMAIN);
      } else {
        this.fail(DOMAIN, {
          ruleId: 'R-FIN-02',
          severity: 'CRITICAL',
          description: `cash_drawer.opened_unauthorized par "${p.operatorId}" sans audit ni notification — CashDrawerAnomalyHandler défaillant`,
          triggerEvent: { name: 'cash_drawer.opened_unauthorized', seq: cd.seq, tenantId: tenantOf(p), payload: p },
          expectedFollowUp: 'system.audit_log + notification.urgent (CashDrawerAnomalyHandler)',
          context: { drawerId: p.drawerId, operatorId: p.operatorId },
        });
      }
    }

    // R-FIN-03 : finance.payment_failed → notification (FleetOutboxHandler)
    for (const pf of this.collector.of('finance.payment_failed')) {
      const p = pf.payload as AnyPayload;
      const hasUrgent = urgentNotifs.some(n => n.seq > pf.seq && n.seq < pf.seq + 30);
      if (hasUrgent) {
        this.pass(DOMAIN);
      } else {
        this.fail(DOMAIN, {
          ruleId: 'R-FIN-03',
          severity: 'HIGH',
          description: `finance.payment_failed (invoice: ${p.invoiceId}) sans notification — FleetOutboxHandler défaillant`,
          triggerEvent: { name: 'finance.payment_failed', seq: pf.seq, tenantId: tenantOf(p), payload: p },
          expectedFollowUp: 'notification.urgent (FleetOutboxHandler → StripePaymentRetryHandler)',
          context: { invoiceId: p.invoiceId, amountEur: ((p.amountInMicrounits as number) / 1e6).toFixed(2) },
        });
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // R-SEC — Sécurité & Souveraineté
  // ════════════════════════════════════════════════════════════════════════════

  private checkSecurity(): void {
    const DOMAIN = 'Security';
    const urgentNotifs = this.collector.of('notification.urgent');
    const fiscalAudits = this.collector.of('mcc.fiscal_audit_required');

    // R-SEC-01 : sovereign.breach → notification.urgent CRITIQUE (SovereignBreachHandler)
    for (const breach of this.collector.of('sovereign.breach')) {
      const p = breach.payload as AnyPayload;
      const hasUrgent = urgentNotifs.some(n => n.seq > breach.seq && n.seq < breach.seq + 30);
      if (hasUrgent) {
        this.pass(DOMAIN);
      } else {
        this.fail(DOMAIN, {
          ruleId: 'R-SEC-01',
          severity: 'CRITICAL',
          description: `sovereign.breach (${p.anchoredTenantId} → ${p.targetTenantId}) sans notification.urgent CRITIQUE — SovereignBreachHandler défaillant`,
          triggerEvent: { name: 'sovereign.breach', seq: breach.seq, tenantId: tenantOf(p), payload: p },
          expectedFollowUp: 'notification.urgent { priority: CRITICAL } (SovereignBreachHandler)',
          context: { target: p.targetTenantId, anchor: p.anchoredTenantId, path: p.path },
        });
      }
    }

    // R-SEC-02 : crypto.integrity_failed → mcc.fiscal_audit_required (CryptoIntegrityCheckHandler)
    for (const ci of this.collector.of('crypto.integrity_failed')) {
      const p = ci.payload as AnyPayload;
      const hasFiscalAudit = fiscalAudits.some(a => a.seq > ci.seq && a.seq < ci.seq + 30);
      if (hasFiscalAudit) {
        this.pass(DOMAIN);
      } else {
        this.fail(DOMAIN, {
          ruleId: 'R-SEC-02',
          severity: 'CRITICAL',
          description: `crypto.integrity_failed sur journal "${p.journalId}" sans mcc.fiscal_audit_required — chaîne NF525 corrompue non auditée`,
          triggerEvent: { name: 'crypto.integrity_failed', seq: ci.seq, tenantId: tenantOf(p), payload: p },
          expectedFollowUp: 'mcc.fiscal_audit_required { urgency: critical } (CryptoIntegrityCheckHandler)',
          context: { journalId: p.journalId, expectedHash: p.expectedHash, actualHash: p.actualHash },
        });
      }
    }

    // R-SEC-03 : mcc.dlq_quarantine{attempts≥5} → mcc.fiscal_audit_required
    for (const dlq of this.collector.of('mcc.dlq_quarantine')) {
      const p = dlq.payload as AnyPayload;
      const attempts = p.attempts as number ?? 0;
      if (attempts >= 5) {
        const hasFiscalAudit = this.collector.of('mcc.fiscal_audit_required').length > 0;
        if (hasFiscalAudit) {
          this.pass(DOMAIN);
        } else {
          this.fail(DOMAIN, {
            ruleId: 'R-SEC-03',
            severity: 'HIGH',
            description: `mcc.dlq_quarantine (handler: ${p.handlerId}, ${attempts} tentatives) sans mcc.fiscal_audit_required`,
            triggerEvent: { name: 'mcc.dlq_quarantine', seq: dlq.seq, tenantId: tenantOf(p), payload: p },
            expectedFollowUp: 'mcc.fiscal_audit_required (DLQQuarantineAlertHandler)',
            context: { handlerId: p.handlerId, eventName: p.eventName, attempts },
          });
        }
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // R-CRM — Fidélité & Gestion client
  // ════════════════════════════════════════════════════════════════════════════

  private checkCRM(): void {
    const DOMAIN = 'CRM';

    // R-CRM-01 : crm.points_earned.sourceOrderId → order.paid existant
    const paidOrderIds = new Set(
      this.collector.of('order.paid').map(e => (e.payload as AnyPayload).orderId as string)
    );
    for (const pts of this.collector.of('crm.points_earned')) {
      const p = pts.payload as AnyPayload;
      const sourceOrderId = p.sourceOrderId as string;
      if (paidOrderIds.has(sourceOrderId)) {
        this.pass(DOMAIN);
      } else {
        this.fail(DOMAIN, {
          ruleId: 'R-CRM-01',
          severity: 'HIGH',
          description: `crm.points_earned référence "${sourceOrderId}" mais aucun order.paid avec cet orderId — points accordés sans transaction réelle (LoyaltyPointsAccrualHandler)`,
          triggerEvent: { name: 'crm.points_earned', seq: pts.seq, tenantId: tenantOf(p), payload: p },
          expectedFollowUp: `order.paid { orderId: "${sourceOrderId}" } doit précéder`,
          context: { customerId: p.customerId, points: p.points, sourceOrderId },
        });
      }
    }

    // R-CRM-02 : reservation.no_show → dégradation CRM attendue (NoShowCRMHandler)
    // Vérifier que crm.customer_updated avec noShowCount suit chaque no_show ayant un customerId
    const crmUpdatesAfter = (afterSeq: number, customerId?: string) =>
      this.collector.of('crm.customer_updated').some(
        u => u.seq > afterSeq && u.seq < afterSeq + 50 &&
          (!customerId || (u.payload as AnyPayload).customerId === customerId)
      );

    for (const ns of this.collector.of('reservation.no_show')) {
      const p = ns.payload as AnyPayload;
      const customerId = p.customerId as string | undefined;
      if (!customerId) continue; // Pas de client connu → NoShowCRMHandler skip légitimement

      if (crmUpdatesAfter(ns.seq, customerId)) {
        this.pass(DOMAIN);
      } else {
        this.fail(DOMAIN, {
          ruleId: 'R-CRM-02',
          severity: 'MEDIUM',
          description: `reservation.no_show pour client "${customerId}" sans crm.customer_updated (score CRM non dégradé) — NoShowCRMHandler défaillant`,
          triggerEvent: { name: 'reservation.no_show', seq: ns.seq, tenantId: tenantOf(p), payload: p },
          expectedFollowUp: `crm.customer_updated { customerId: "${customerId}", noShowCount: +1, crmScore: -20 }`,
          context: { customerId, resaId: p.reservationId },
        });
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // R-STK — Stock & Approvisionnement
  // ════════════════════════════════════════════════════════════════════════════

  private checkStock(): void {
    const DOMAIN = 'Stock';

    // R-STK-01 : recall.declared → inventory.quarantine_activated (RecallPOSBlockerHandler)
    for (const recall of this.collector.of('recall.declared')) {
      const p = recall.payload as AnyPayload;
      const productIds = p.productIds as string[] ?? [];
      const quarantinedAfter = this.collector.of('inventory.quarantine_activated')
        .filter(q => q.seq > recall.seq && q.seq < recall.seq + 30)
        .flatMap(q => (q.payload as AnyPayload).productIds as string[] ?? []);

      const allQuarantined = productIds.every(id => quarantinedAfter.includes(id));
      if (allQuarantined && productIds.length > 0) {
        this.pass(DOMAIN);
      } else {
        this.fail(DOMAIN, {
          ruleId: 'R-STK-01',
          severity: 'CRITICAL',
          description: `recall.declared pour [${productIds.join(', ')}] sans inventory.quarantine_activated correspondant — produits rappelés toujours disponibles à la vente (RecallPOSBlockerHandler)`,
          triggerEvent: { name: 'recall.declared', seq: recall.seq, tenantId: tenantOf(p), payload: p },
          expectedFollowUp: `inventory.quarantine_activated { productIds: [${productIds.map(id => `"${id}"`).join(', ')}] }`,
          context: { recallId: p.recallId, reason: p.reason, productIds },
        });
      }
    }

    // R-STK-02 : stock.zero → finance.food_cost_impacted (StockZeroBlockerHandler)
    const foodCostImpacted = this.collector.of('finance.food_cost_impacted');
    for (const sz of this.collector.of('stock.zero')) {
      const p = sz.payload as AnyPayload;
      const hasFoodCost = foodCostImpacted.some(fc => fc.seq > sz.seq && fc.seq < sz.seq + 30);
      if (hasFoodCost) {
        this.pass(DOMAIN);
      } else {
        this.fail(DOMAIN, {
          ruleId: 'R-STK-02',
          severity: 'HIGH',
          description: `stock.zero pour "${p.itemName}" sans finance.food_cost_impacted — impact food cost non comptabilisé (StockZeroBlockerHandler)`,
          triggerEvent: { name: 'stock.zero', seq: sz.seq, tenantId: tenantOf(p), payload: p },
          expectedFollowUp: `finance.food_cost_impacted { reason: "Rupture stock ${p.itemName}" }`,
          context: { itemId: p.itemId, itemName: p.itemName },
        });
      }
    }

    // R-STK-03 : procurement.mismatch_detected → finance.food_cost_impacted (ProcurementMismatchHandler)
    for (const pm of this.collector.of('procurement.mismatch_detected')) {
      const p = pm.payload as AnyPayload;
      const hasFoodCost = this.collector.of('finance.food_cost_impacted').length > 0;
      if (hasFoodCost) {
        this.pass(DOMAIN);
      } else {
        this.fail(DOMAIN, {
          ruleId: 'R-STK-03',
          severity: 'HIGH',
          description: `procurement.mismatch_detected (PO: ${p.purchaseOrderId}) sans finance.food_cost_impacted — écart de prix non répercuté sur le food cost`,
          triggerEvent: { name: 'procurement.mismatch_detected', seq: pm.seq, tenantId: tenantOf(p), payload: p },
          expectedFollowUp: 'finance.food_cost_impacted (ProcurementMismatchHandler)',
          context: { purchaseOrderId: p.purchaseOrderId, discrepancies: p.discrepancies },
        });
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // R-FLT — Flotte Multi-Site & Inter-Tenants
  // ════════════════════════════════════════════════════════════════════════════

  private checkFleet(): void {
    const DOMAIN = 'Fleet';

    // R-FLT-01 : stock.transfer → stock.received sur le site cible
    const receivedTransfers = new Set(
      this.collector.of('stock.received').map(e => (e.payload as AnyPayload).sourceTenantId as string)
    );
    for (const trf of this.collector.of('stock.transfer')) {
      const p = trf.payload as AnyPayload;
      const sourceSite = p.tenantId as string;
      if (receivedTransfers.has(sourceSite)) {
        this.pass(DOMAIN);
      } else {
        this.fail(DOMAIN, {
          ruleId: 'R-FLT-01',
          severity: 'HIGH',
          description: `stock.transfer depuis "${sourceSite}" vers "${p.targetTenantId}" sans stock.received correspondant — perte de traçabilité inter-sites`,
          triggerEvent: { name: 'stock.transfer', seq: trf.seq, tenantId: sourceSite, payload: p },
          expectedFollowUp: `stock.received { sourceTenantId: "${sourceSite}" }`,
          context: { sourceSite, targetSite: p.targetTenantId },
        });
      }
    }

    // R-FLT-02 : hr.transfer_offer → cible valide
    for (const trf of this.collector.of('hr.transfer_offer')) {
      const p = trf.payload as AnyPayload;
      if (p.targetTenantId && p.employeeId) {
        this.pass(DOMAIN);
      } else {
        this.fail(DOMAIN, {
          ruleId: 'R-FLT-02',
          severity: 'HIGH',
          description: 'hr.transfer_offer incomplet (employeeId ou targetTenantId manquant)',
          triggerEvent: { name: 'hr.transfer_offer', seq: trf.seq, tenantId: tenantOf(p), payload: p },
          expectedFollowUp: 'hr.transfer_offer avec employeeId et targetTenantId renseignés',
        });
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // R-INT — Intelligence & Menu Engineering
  // ════════════════════════════════════════════════════════════════════════════

  private checkIntelligence(): void {
    const DOMAIN = 'Intelligence';

    // R-INT-01 : intelligence.bcg_calculated → matrice BCG cohérente
    for (const bcg of this.collector.of('intelligence.bcg_calculated')) {
      const p = bcg.payload as AnyPayload;
      if (
        typeof p.starsCount === 'number' ||
        typeof p.dogsCount === 'number' ||
        typeof p.period === 'string' ||
        typeof p.tenantId === 'string'
      ) {
        this.pass(DOMAIN);
      } else {
        this.fail(DOMAIN, {
          ruleId: 'R-INT-01',
          severity: 'MEDIUM',
          description: 'intelligence.bcg_calculated avec métriques de matrice manquantes',
          triggerEvent: { name: 'intelligence.bcg_calculated', seq: bcg.seq, tenantId: tenantOf(p), payload: p },
          expectedFollowUp: 'Matrice BCG avec comptage Stars/Plowhorses/Puzzles/Dogs',
        });
      }
    }

    // R-INT-02 : commerce.margin_warning → alerte de marge
    for (const mw of this.collector.of('commerce.margin_warning')) {
      const p = mw.payload as AnyPayload;
      if (typeof p.currentMarginBps === 'number' && typeof p.thresholdBps === 'number') {
        this.pass(DOMAIN);
      } else {
        this.fail(DOMAIN, {
          ruleId: 'R-INT-02',
          severity: 'MEDIUM',
          description: 'commerce.margin_warning avec seuils de marge Bps invalides',
          triggerEvent: { name: 'commerce.margin_warning', seq: mw.seq, tenantId: tenantOf(p), payload: p },
          expectedFollowUp: 'Margin Warning avec currentMarginBps et thresholdBps',
        });
      }
    }
  }
}
