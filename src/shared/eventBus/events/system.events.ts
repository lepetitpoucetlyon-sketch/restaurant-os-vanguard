export interface SYSTEMEvents {
  "mcc.changelog_recorded": {
    v: 1;
    isSimulation?: boolean;
    id: string;
    tenantId: string;
    category: string;
    action: string;
    title?: string;
    description: string;
    appliedBy: string;
    authorType: string;
    scope: string;
    appliedAt: string;
  };

  "mcc.feature_flag_toggled": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    flagKey: string;
    enabled: boolean;
    rolloutPercentage: number;
    tenantIds: string[];
    updatedBy: string;
  };

  "integration.reservation_received": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    integrationId: string;
    platform: string;
    rawPayload: Record<string, unknown>;
  };

  "tenant.onboarding_step_completed": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    stepId: string;
  };

  "tenant.subscription_expired": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    expiredAt: string;
  };

  "fleet.device_provisioned": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    deviceId: string;
  };

  "fleet.device_wipe_requested": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    deviceId: string;
  };

  "security.device_remote_wipe": {
    v?: 1;
    isSimulation?: boolean;
    tenantId: string;
    deviceId: string;
    revokedAt: string;
    revokedBy: string;
  };

  "fleet.weekly_report_due": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
  };

  'fleet.vehicle_assigned': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    vehicleId: string;
    driverId: string;
    assignedAt: number;
  };

  'integration.delivery_order_received': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    integrationId: string;
    platform: 'ubereats' | 'deliveroo' | 'other';
    rawPayload: Record<string, unknown>;
  };

  'integration.menu_sync_requested': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    integrationId: string;
    requestedBy: string;
  };

  'integration.catalog_mapping_updated': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    internalProductId: string;
    externalId: string;
    platform: string;
  };

  'system.audit_log': {
    v: 1;
    tenantId: string;
    action: string;
    userId: string;
    details: Record<string, unknown>;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };

  'system.reference_promoted': {
    variant: string;
    timestamp: string;
    collections: string[];
    promotedBy: string;
  };

  // ── MCC platform ──────────────────────────────────────────────────────────
  'mcc.health_ping': { tenantId: string; status: 'healthy' | 'degraded'; [key: string]: unknown };
  'mcc.fiscal_audit_required': { tenantId: string; reason: string; urgency: 'low' | 'high' | 'critical' };
  'mcc.dlq_quarantine': {
    tenantId: string;
    eventName: string;
    handlerId: string;
    attempts: number;
    lastError: string;
    quarantinedAt: number;
  };

  // ── Tenant lifecycle ───────────────────────────────────────────────────────
  'tenant.ready': { tenantId: string };

  // ── Hardware & Facility Telemetry (Invariant #6) ───────────────────────────
  'facility.hardware_fault': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    deviceType: 'printer' | 'payment_terminal' | 'iot_sensor' | 'backup_router' | 'display';
    deviceId: string;
    faultCode: 'OUT_OF_PAPER' | 'COVER_OPEN' | 'CONNECTION_LOST' | 'BATTERY_CRITICAL' | 'PAPER_JAM' | 'POWER_OFF';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
  };

  'facility.hardware_restored': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    deviceType: 'printer' | 'payment_terminal' | 'iot_sensor' | 'backup_router' | 'display';
    deviceId: string;
    timestamp: string;
  };

  'notification.created': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    id: string;
    type: 'alert' | 'info' | 'warning' | 'error';
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    read: boolean;
    timestamp: string;
  };

  'notification.urgent': {
    v: 1;
    tenantId: string;
    message: string;
    metadata?: Record<string, unknown>;
    roles: string[];
    /** Responsabilité métier ciblée (RESP_HYGIENE…) — résolue par AlertRouter au dispatch. */
    responsibility?: string;
    priority?: 'CRITICAL' | 'HIGH';
  };

  'system.sms_delivery_failed': {
    v: 1;
    tenantId: string;
    recipientPhone: string;
    provider: string;
    error: string;
    fallbackUsed: 'email' | 'none';
    failedAt: number;
  };

  'system.sms_segment_warning': {
    v: 1;
    tenantId: string;
    recipientPhone: string;
    originalLength: number;
    sanitizedLength: number;
    encoding: 'GSM-7' | 'UCS-2';
    segments: number;
    strippedChars: string[];
  };

  'fleet.merchant_provisioned': { v:1; tenantId: string; merchantSiret: string; tradeName: string; initialPlan: string; provisionedAt: number };

  'fleet.saas_billing_invoiced': { v:1; tenantId: string; invoiceId: string; periodLabel: string; totalAmountInMicrounits: number; invoiceStatus: 'issued' | 'paid' | 'overdue'; invoicedAt: number };

  'fleet.benchmark_computed': { v:1; tenantId: string; clusterCategory: string; avgTicketInMicrounits: number; foodCostRatioPct: number; percentileRank: number; computedAt: number };

  'fleet.compliance_audit_computed': { v:1; tenantId: string; overallScorePct: number; nf525Passed: boolean; haccpPassed: boolean; hcrPassed: boolean; computedAt: number };

  'fleet.kill_switch_toggled': { v:1; tenantId: string; featureFlag: string; isEnabled: boolean; toggledBy: string; toggledAt: number };

  'fleet.alert_escalated': { v:1; tenantId: string; incidentId: string; severity: 'P1' | 'P2'; destinationService: 'pagerduty' | 'opsgenie'; escalatedAt: number };

  'fleet.sla_breach_detected': { v:1; tenantId: string; endpoint: string; latencyMs: number; allowedLatencyMs: number; breachAt: number };
}
