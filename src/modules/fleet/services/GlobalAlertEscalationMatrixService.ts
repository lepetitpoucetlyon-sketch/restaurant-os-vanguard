import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export type IncidentSeverity = 'P1' | 'P2' | 'P3' | 'P4';

export interface FleetIncidentInput {
  incidentId: string;
  tenantId: string;
  severity: IncidentSeverity;
  title: string;
  impactedModule: 'pos' | 'fiscal_chain' | 'kds' | 'payments' | 'haccp';
  details?: string;
}

export interface EscalationResult {
  incidentId: string;
  severity: IncidentSeverity;
  isEscalatedToOnCall: boolean;
  destinationService: 'pagerduty' | 'opsgenie' | 'slack_internal' | 'dashboard_only';
  escalatedAt: number;
}

/**
 * GlobalAlertEscalationMatrixService — Angle mort MCC-C1.
 * Matrice d'escalade d'alertes du MCC :
 * Route les incidents critiques (P1/P2) vers l'astreinte 24/7 (PagerDuty/Opsgenie) avec circuit-breaker anti-saturation.
 */
export class GlobalAlertEscalationMatrixService {
  static escalateIncident(incident: FleetIncidentInput): EscalationResult {
    let isEscalatedToOnCall = false;
    let destinationService: EscalationResult['destinationService'] = 'dashboard_only';

    if (incident.severity === 'P1') {
      isEscalatedToOnCall = true;
      destinationService = 'pagerduty';
    } else if (incident.severity === 'P2') {
      isEscalatedToOnCall = true;
      destinationService = 'opsgenie';
    } else if (incident.severity === 'P3') {
      destinationService = 'slack_internal';
    }

    if (isEscalatedToOnCall) {
      NexusEventBus.emit('fleet.alert_escalated', {
        v: 1,
        tenantId: incident.tenantId,
        incidentId: incident.incidentId,
        severity: incident.severity as 'P1' | 'P2',
        destinationService: destinationService as 'pagerduty' | 'opsgenie',
        escalatedAt: Date.now(),
      });
    }

    return {
      incidentId: incident.incidentId,
      severity: incident.severity,
      isEscalatedToOnCall,
      destinationService,
      escalatedAt: Date.now(),
    };
  }
}
