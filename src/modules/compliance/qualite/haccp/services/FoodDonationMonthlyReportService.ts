import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance/securite/AuditLogger';

export interface FoodDonationEntry {
  id: string;
  dateIso: string;
  foodDescription: string;
  weightKg: number;
  temperatureAtHandoverCelsius: number;
  beneficiaryAssociation: string; // ex: 'Banque Alimentaire', 'Restos du Cœur'
  associationRnaNumber: string;
  responsibleStaffName: string;
}

export interface MonthlyDonationReport {
  tenantId: string;
  periodLabel: string; // '2026-08'
  totalDonationsCount: number;
  totalWeightKg: number;
  entries: FoodDonationEntry[];
  cerfaFiscalDeductionEstimatedInMicrounits: number; // 60% valeur coût matière Art. 238 bis CGI
  generatedAt: number;
}

/**
 * FoodDonationMonthlyReportService — Angle mort E4.
 * Loi Garot (Art. L. 541-15-6 Code de l'environnement) :
 * Registre et rapport mensuel obligatoire des dons alimentaires non vendus avec traçabilité et éligibilité rescrit mécénat 60%.
 */
export class FoodDonationMonthlyReportService {
  static async generateMonthlyReport(
    tenantId: string,
    adminId: string,
    periodLabel: string,
    entries: FoodDonationEntry[],
    estimatedCostPerKgInMicrounits = 4_000_000 // 4.00 € / kg
  ): Promise<MonthlyDonationReport> {
    const totalWeightKg = entries.reduce((sum, e) => sum + e.weightKg, 0);
    const totalMaterialCostInMicrounits = totalWeightKg * estimatedCostPerKgInMicrounits;
    // 60% tax reduction under Art. 238 bis CGI
    const cerfaFiscalDeductionEstimatedInMicrounits = Math.round(totalMaterialCostInMicrounits * 0.6);

    NexusEventBus.emit('compliance.food_donation_report_generated', {
      v: 1,
      tenantId,
      periodLabel,
      totalWeightKg,
      beneficiaryOrg: entries[0]?.beneficiaryAssociation || 'Banque Alimentaire',
      generatedAt: Date.now(),
    });

    await AuditLogger.logAction({
      adminId,
      action: 'FOOD_DONATION_REPORT_GENERATED',
      targetId: `DONATION-REPORT-${tenantId}-${periodLabel}`,
      ipAddress: '127.0.0.1',
      metadata: {
        periodLabel,
        totalWeightKg,
        entriesCount: entries.length,
      },
    });

    return {
      tenantId,
      periodLabel,
      totalDonationsCount: entries.length,
      totalWeightKg,
      entries,
      cerfaFiscalDeductionEstimatedInMicrounits,
      generatedAt: Date.now(),
    };
  }
}
