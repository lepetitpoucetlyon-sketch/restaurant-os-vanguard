/* eslint-disable no-restricted-imports -- infrastructure/aggregator: deep path required */
import { fleetTelemetry } from './FleetTelemetryService';
import { FleetComplianceService } from './FleetComplianceService';
import { HACCPTelemetryBridge } from '@/modules/compliance/qualite/haccp/services/HACCPTelemetryBridge';
import { NexusTelemetryService } from '@/lib/NexusTelemetryService';
import { fleetEngine } from '@/modules/intelligence/ia/fleet/FleetAdapter';

export const FleetAggregator = {
  fleetTelemetry,
  FleetComplianceService,
  HACCPTelemetryBridge,
  NexusTelemetryService,
  fleetEngine,
};
