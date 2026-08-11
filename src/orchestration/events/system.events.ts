export interface SYSTEMEvents {
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

  'system.alert': {
    tenantId: string;
    message: string;
    severity: string;
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
}
