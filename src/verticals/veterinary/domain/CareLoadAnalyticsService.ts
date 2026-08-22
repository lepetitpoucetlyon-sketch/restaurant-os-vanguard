import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { IPetRecord, ICareLoadReport, IConsultation, IPrescription } from './types';

/**
 * CareLoadAnalyticsService — logique métier propre à la verticale vétérinaire.
 * Charge de soins (patients/consultations) + ordonnances actives.
 */
export const CareLoadAnalyticsService = {
  async listPatients(tenantId: string): Promise<IPetRecord[]> {
    return Nexus.adapter.query<IPetRecord>(`tenants/${tenantId}/petRecords`, { limit: 200 });
  },

  async listConsultations(tenantId: string): Promise<IConsultation[]> {
    return Nexus.adapter.query<IConsultation>(`tenants/${tenantId}/consultations`, { limit: 200 });
  },

  async computeCareLoadReport(
    tenantId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<ICareLoadReport> {
    const [patients, consultations] = await Promise.all([
      this.listPatients(tenantId),
      this.listConsultations(tenantId),
    ]);

    const periodConsultations = consultations.filter(
      c => c.scheduledAt >= periodStart && c.scheduledAt <= periodEnd
    );

    const totalPatients = patients.length;
    const totalConsultations = periodConsultations.length;
    const avgConsultationsPerPatient = totalPatients > 0 ? totalConsultations / totalPatients : 0;
    const vaccinesDueCount = patients.filter(
      p => !p.lastConsultationAt || p.lastConsultationAt < periodStart
    ).length;

    return { periodStart, periodEnd, totalPatients, totalConsultations, avgConsultationsPerPatient, vaccinesDueCount };
  },

  async listActivePrescriptions(tenantId: string): Promise<IPrescription[]> {
    return Nexus.adapter.query<IPrescription>(`tenants/${tenantId}/prescriptions`, {
      where: [{ field: 'status', operator: '==', value: 'active' }],
      limit: 200,
    });
  },
};
