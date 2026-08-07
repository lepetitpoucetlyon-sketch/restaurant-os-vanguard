import type { CartItem } from '@/modules/ops/workflow/engine/types';

export interface SYSTEMEvents {
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

  'system.reference_promoted': {
    variant: string;
    timestamp: string;
    collections: string[];
    promotedBy: string;
  };
}
