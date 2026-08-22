import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance';

export interface PestControlIntervention {
  interventionDateIso: string;
  providerSiret: string;
  providerCompanyName: string;
  technicianCertibiocideNumber: string;
  treatedPests: ('rodents' | 'cockroaches' | 'flies' | 'moths')[];
  baitsInstalledCount: number;
  baitsConsumedCount: number;
  infestationScore: 'none' | 'low' | 'moderate' | 'critical';
  recommendations: string[];
}

export interface PestControlRegisterSummary {
  tenantId: string;
  lastInterventionDateIso: string;
  nextInterventionDueIso: string;
  isUpToDate: boolean;
  activeInfestationWarning: boolean;
  recordedAt: number;
}

/**
 * PestControl3DRegisterService — Angle mort T28.
 * Registre 3D obligatoire (Dératisation, Désinsectisation, Désinfection) :
 * Plan de lutte anti-nuisibles, contrôle Certibiocide, relevé des pièges et conformité DDPP.
 */
export class PestControl3DRegisterService {
  static async recordIntervention(
    tenantId: string,
    adminId: string,
    intervention: PestControlIntervention
  ): Promise<PestControlRegisterSummary> {
    const interventionDate = new Date(intervention.interventionDateIso);
    // Next due in 90 days max (quarterly inspection standard)
    const nextDueDate = new Date(interventionDate.getTime() + 90 * 24 * 3600 * 1000);

    const activeInfestationWarning = intervention.infestationScore === 'moderate' || intervention.infestationScore === 'critical';

    NexusEventBus.emit('compliance.pest_control_3d_recorded', {
      v: 1,
      tenantId,
      interventionDateIso: intervention.interventionDateIso,
      providerSiret: intervention.providerSiret,
      certNumber: intervention.technicianCertibiocideNumber,
      recordedAt: Date.now(),
    });

    await AuditLogger.logAction({
      adminId,
      action: 'PEST_CONTROL_3D_RECORDED',
      targetId: `3D-${tenantId}-${intervention.interventionDateIso}`,
      ipAddress: '127.0.0.1',
      metadata: {
        providerSiret: intervention.providerSiret,
        infestationScore: intervention.infestationScore,
        baitsConsumedCount: intervention.baitsConsumedCount,
      },
    });

    return {
      tenantId,
      lastInterventionDateIso: intervention.interventionDateIso,
      nextInterventionDueIso: nextDueDate.toISOString().split('T')[0],
      isUpToDate: true,
      activeInfestationWarning,
      recordedAt: Date.now(),
    };
  }
}
