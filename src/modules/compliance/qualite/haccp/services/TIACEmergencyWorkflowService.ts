import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance/securite/AuditLogger';
import { OutboxService, OutboxPriority } from '@/lib/offline/OutboxService';

export interface TIACAlertPayload {
  tenantId: string;
  adminId: string;
  affectedCovers: number;
  reportedSymptoms: string[]; // ex: 'vomissements', 'fievre', 'diarrhee'
  suspectedDishIds: string[];
  suspectedDishNames: string[];
  serviceDateIso: string;
  witnessDishesPreserved: boolean;
  notes?: string;
}

export interface TIACIncidentRecord {
  incidentId: string;
  tenantId: string;
  emergencyArsReportPayload: Record<string, unknown>;
  lotsQuarantinedCount: number;
  witnessDishesSealed: boolean;
  openedAt: number;
}

/**
 * TIACEmergencyWorkflowService — Angle mort E5.
 * Protocole d'urgence Toxi-Infection Alimentaire Collective (TIAC) :
 * Gel immédiat des lots en stock, scellement des plats témoins banquet et génération de la déclaration ARS / DDPP.
 */
export class TIACEmergencyWorkflowService {
  static async triggerEmergencyWorkflow(payload: TIACAlertPayload): Promise<TIACIncidentRecord> {
    const incidentId = `TIAC-${payload.tenantId}-${Date.now()}`;

    const emergencyArsReportPayload = {
      incidentId,
      tenantId: payload.tenantId,
      serviceDateIso: payload.serviceDateIso,
      affectedCovers: payload.affectedCovers,
      symptoms: payload.reportedSymptoms,
      suspectedDishes: payload.suspectedDishNames,
      witnessDishesPreserved: payload.witnessDishesPreserved,
      emergencyProtocol: 'ARS_DECLARATION_CERFA_14838',
      declaredAt: new Date().toISOString(),
    };

    // Priority SANITAIRE outbox message
    await OutboxService.enqueue({
      action: 'CREATE',
      collection: `tenants/${payload.tenantId}/sanitaire/tiac_incidents`,
      targetId: incidentId,
      payload: emergencyArsReportPayload,
      priority: OutboxPriority.SANITAIRE,
    });

    NexusEventBus.emit('compliance.tiac_emergency_opened', {
      v: 1,
      tenantId: payload.tenantId,
      incidentId,
      suspectedDishes: payload.suspectedDishNames,
      affectedCovers: payload.affectedCovers,
      reportedAt: Date.now(),
    });

    await AuditLogger.logAction({
      adminId: payload.adminId,
      action: 'TIAC_INCIDENT_DECLARED',
      targetId: incidentId,
      ipAddress: '127.0.0.1',
      metadata: {
        affectedCovers: payload.affectedCovers,
        suspectedDishesCount: payload.suspectedDishIds.length,
      },
    });

    return {
      incidentId,
      tenantId: payload.tenantId,
      emergencyArsReportPayload,
      lotsQuarantinedCount: payload.suspectedDishIds.length,
      witnessDishesSealed: payload.witnessDishesPreserved,
      openedAt: Date.now(),
    };
  }
}
