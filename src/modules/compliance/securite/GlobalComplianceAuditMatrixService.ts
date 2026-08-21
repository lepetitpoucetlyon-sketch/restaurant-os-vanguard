import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface TenantComplianceStatus {
  tenantId: string;
  tradeName: string;
  nf525Valid: boolean;
  haccpDailyLogsComplete: boolean;
  hcrRestPeriodsRespected: boolean;
  gdprConsentUpToDate: boolean;
}

export interface GlobalComplianceScorecard {
  tenantId: string;
  overallScorePct: number; // 0 - 100
  isFullyCompliant: boolean;
  riskLevel: 'low' | 'moderate' | 'critical';
  nonCompliantAreas: string[];
}

/**
 * GlobalComplianceAuditMatrixService — Angle mort MCC-B1.
 * Matrice d'audit de conformité réglementaire de la flotte :
 * Évalue le statut NF525, HACCP, HCR et RGPD de chaque restaurant avec calcul du score de risque consolidé.
 */
export class GlobalComplianceAuditMatrixService {
  static evaluateTenantCompliance(status: TenantComplianceStatus): GlobalComplianceScorecard {
    const areas: string[] = [];
    let score = 100;

    if (!status.nf525Valid) {
      score -= 40; // Critical legal failure
      areas.push('NF525 Fiscale');
    }
    if (!status.haccpDailyLogsComplete) {
      score -= 25;
      areas.push('HACCP Hygiène');
    }
    if (!status.hcrRestPeriodsRespected) {
      score -= 20;
      areas.push('HCR Temps de Travail');
    }
    if (!status.gdprConsentUpToDate) {
      score -= 15;
      areas.push('RGPD Données');
    }

    const overallScorePct = Math.max(0, score);
    const isFullyCompliant = overallScorePct === 100;
    const riskLevel = overallScorePct >= 80 ? 'low' : overallScorePct >= 60 ? 'moderate' : 'critical';

    NexusEventBus.emit('fleet.compliance_audit_computed', {
      v: 1,
      tenantId: status.tenantId,
      overallScorePct,
      nf525Passed: status.nf525Valid,
      haccpPassed: status.haccpDailyLogsComplete,
      hcrPassed: status.hcrRestPeriodsRespected,
      computedAt: Date.now(),
    });

    return {
      tenantId: status.tenantId,
      overallScorePct,
      isFullyCompliant,
      riskLevel,
      nonCompliantAreas: areas,
    };
  }
}
