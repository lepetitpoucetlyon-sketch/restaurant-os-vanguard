import { IVerticalPlugin, ICoreContext } from '@/shared/plugins/IVerticalPlugin';
import React from 'react';
import { logger } from '@/lib/logger';
import {
  HealthOpsAdapter,
  HealthCommerceAdapter,
  HealthFinanceAdapter,
  HealthFacilityAdapter,
  HealthHumanAdapter,
  HealthIntelligenceAdapter,
  HealthLogisticsAdapter,
  HealthComplianceAdapter,
  HealthMccAdapter,
} from './adapters';

export class HealthVertical implements IVerticalPlugin {
  public readonly id = 'health';
  public readonly name = 'Clinic OS';
  public readonly version = '1.0.0';
  public readonly description = 'Patient Flow, Bed Management, HDS Compliance, Insurance Billing';
  public readonly dependencies = ['finance', 'compliance', 'human', 'facility'];

  public async initialize(context: ICoreContext): Promise<void> {
    logger.info(`[${this.id}] Initialisation verticale clinique…`);

    // Routes
    context.registerRoute('/clinic', React.lazy(() =>
      import('./ops/components/ClinicDashboard').then(m => ({ default: m.ClinicDashboard }))));
    context.registerRoute('/patient-flow', React.lazy(() =>
      import('./ops/patient-flow').then(m => ({ default: m.PatientFlowPage }))));
    context.registerRoute('/beds', React.lazy(() =>
      import('./ops/bed-management').then(m => ({ default: m.BedManagementPage }))));
    context.registerRoute('/insurance', React.lazy(() =>
      import('./finance/insurance-billing').then(m => ({ default: m.InsuranceBillingPage }))));

    // Ops — admission → lit occupé + snapshot flux patient
    context.registerEventHandler<{ tenantId: string; patientId: string; wardId: string; admittedAt: string; pathology?: string }>(
      'health.patient_admitted',
      ({ tenantId, patientId, wardId, admittedAt }) => {
        HealthOpsAdapter.emitBedStatusChanged({ tenantId, bedId: `bed-${wardId}`, wardId, status: 'occupied' });
        HealthComplianceAdapter.emitHdsAuditLog({ tenantId, patientId, action: 'ADMITTED', performedBy: 'system', timestamp: admittedAt });
        HealthIntelligenceAdapter.emitPatientFlowSnapshot({ tenantId, date: admittedAt.slice(0, 10), admissions: 1, discharges: 0, occupancyRate: 0 });
      },
    );

    // Ops — sortie → lit libéré + facturation actes
    context.registerEventHandler<{ tenantId: string; patientId: string; wardId: string; dischargedAt: string }>(
      'health.patient_discharged',
      ({ tenantId, patientId, wardId, dischargedAt }) => {
        HealthOpsAdapter.emitBedStatusChanged({ tenantId, bedId: `bed-${wardId}`, wardId, status: 'cleaning' });
        HealthComplianceAdapter.emitHdsAuditLog({ tenantId, patientId, action: 'DISCHARGED', performedBy: 'system', timestamp: dischargedAt });
        HealthIntelligenceAdapter.emitPatientFlowSnapshot({ tenantId, date: dischargedAt.slice(0, 10), admissions: 0, discharges: 1, occupancyRate: 0 });
      },
    );

    // Commerce — RDV réservé → praticien de garde assigné
    context.registerEventHandler<{ tenantId: string; appointmentId: string; patientId: string; practitionerId: string; slot: string }>(
      'health.appointment_booked',
      ({ tenantId, practitionerId, slot }) => {
        const slotDate = new Date(slot);
        const until = new Date(slotDate.getTime() + 3600_000).toISOString();
        HealthHumanAdapter.emitPractitionerOnCall({ tenantId, practitionerId, specialty: 'généraliste', onCallFrom: slot, onCallUntil: until });
      },
    );

    // Finance — acte facturé → dossier assurance
    context.registerEventHandler<{ tenantId: string; patientId: string; actCode: string; amountInMicrounits: number; practitionerId: string }>(
      'health.act_billed',
      ({ tenantId, patientId, actCode, amountInMicrounits, practitionerId }) => {
        HealthFinanceAdapter.emitActBilled({ tenantId, patientId, actCode, amountInMicrounits, practitionerId });
        HealthFinanceAdapter.emitInsuranceClaimSubmitted({ tenantId, patientId, claimId: `claim-${actCode}-${Date.now()}`, amountInMicrounits, insurerId: 'cpam' });
      },
    );

    // Compliance — consentement HDS enregistré
    context.registerEventHandler<{ tenantId: string; patientId: string; consentType: string; grantedAt: string }>(
      'health.consent_recorded',
      ({ tenantId, patientId, consentType, grantedAt }) => {
        HealthComplianceAdapter.emitConsentRecorded({ tenantId, patientId, consentType, grantedAt });
        HealthComplianceAdapter.emitHdsAuditLog({ tenantId, patientId, action: `CONSENT_${consentType.toUpperCase()}`, performedBy: 'system', timestamp: grantedAt });
      },
    );

    // Logistics — médicament dispensé → réassort si stock bas
    context.registerEventHandler<{ tenantId: string; patientId: string; medicationId: string; quantity: number; dispensedBy: string }>(
      'health.medication_dispensed',
      ({ tenantId, patientId, medicationId, quantity, dispensedBy }) => {
        HealthLogisticsAdapter.emitMedicationDispensed({ tenantId, patientId, medicationId, quantity, dispensedBy });
        HealthLogisticsAdapter.emitSupplyReorderNeeded({ tenantId, supplyId: medicationId, currentStock: 0, reorderThreshold: 10 });
      },
    );

    // Facility — équipement à maintenir
    context.registerEventHandler<{ tenantId: string; equipmentId: string; type: string; dueDate: string; critical: boolean }>(
      'health.equipment_maintenance_required',
      ({ tenantId, equipmentId, type, dueDate, critical }) => {
        HealthFacilityAdapter.emitEquipmentMaintenanceRequired({ tenantId, equipmentId, type, dueDate, critical });
        if (critical) {
          HealthMccAdapter.emitHealthPing({ tenantId, status: 'degraded', hdsCompliant: false, bedsAvailable: 0 });
        }
      },
    );

    // MCC — health ping
    context.registerEventHandler<{ tenantId: string }>(
      'tenant.ready',
      ({ tenantId }) => {
        HealthMccAdapter.emitHealthPing({ tenantId, status: 'healthy', hdsCompliant: true, bedsAvailable: 0 });
      },
    );

    logger.info(`[${this.id}] Verticale clinique active — ${context.getRegisteredRoutes().length} routes`);
  }

  public async destroy(): Promise<void> {
    logger.info(`[${this.id}] Arrêt de la verticale clinique.`);
  }
}
