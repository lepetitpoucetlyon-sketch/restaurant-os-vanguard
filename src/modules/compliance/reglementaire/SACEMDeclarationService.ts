/**
 * L80 — Déclaration SACEM (musique diffusée).
 *
 * Art. L. 132-20 + L. 214-1 Code de la Propriété Intellectuelle :
 * Tout établissement qui diffuse de la musique (radio, playlist, live, TV)
 * doit avoir une licence SACEM et déclarer ses diffusions annuellement.
 * Amende : jusqu'à 300 000 € + 3 ans de prison pour contrefaçon.
 *
 * Ce service enregistre les informations de licence SACEM du tenant et
 * génère le rapport de diffusion annuel.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L80.
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { OutboxService, OutboxPriority } from '@/lib/offline/OutboxService';
import { AuditLogger } from '@/modules/compliance';

export interface SACEMLicense {
  licenseNumber: string;
  contractType: 'sono' | 'live' | 'tv' | 'mixed';
  validFrom: string;
  validUntil: string;
  annualFeeInMicrounits: number;
  lastDeclarationYear?: number;
}

export interface SACEMDiffusionReport {
  id: string;
  tenantId: string;
  year: number;
  licenseNumber: string;
  diffusionTypes: ('radio' | 'playlist' | 'live' | 'tv')[];
  openingDaysCount: number;
  seatingCapacity: number;
  generatedAt: number;
  legalRef: 'Art. L. 132-20 CPI';
}

export class SACEMDeclarationService {
  private static licensePath(tenantId: string): string {
    return `tenants/${tenantId}/sacem_license`;
  }

  static async setLicense(tenantId: string, license: SACEMLicense): Promise<void> {
    await Nexus.adapter.set(this.licensePath(tenantId), license);
  }

  static async getLicense(tenantId: string): Promise<SACEMLicense | null> {
    return Nexus.adapter.get<SACEMLicense>(this.licensePath(tenantId));
  }

  static async isLicenseValid(tenantId: string, now?: number): Promise<boolean> {
    const ts = now ?? Date.now();
    const license = await this.getLicense(tenantId);
    if (!license) return false;
    return new Date(license.validUntil).getTime() >= ts;
  }

  static async generateAnnualReport(input: {
    tenantId: string;
    year: number;
    diffusionTypes: ('radio' | 'playlist' | 'live' | 'tv')[];
    openingDaysCount: number;
    seatingCapacity: number;
    requestedBy: string;
    now?: number;
  }): Promise<SACEMDiffusionReport> {
    const now = input.now ?? Date.now();
    const license = await this.getLicense(input.tenantId);
    if (!license) throw new Error('SACEM_LICENSE_NOT_CONFIGURED');

    const id = `sacem_${input.year}_${now}`;
    const report: SACEMDiffusionReport = {
      id,
      tenantId: input.tenantId,
      year: input.year,
      licenseNumber: license.licenseNumber,
      diffusionTypes: input.diffusionTypes,
      openingDaysCount: input.openingDaysCount,
      seatingCapacity: input.seatingCapacity,
      generatedAt: now,
      legalRef: 'Art. L. 132-20 CPI',
    };

    await Nexus.adapter.set(`tenants/${input.tenantId}/sacem_reports/${id}`, report);
    await Nexus.adapter.set(this.licensePath(input.tenantId), {
      ...license,
      lastDeclarationYear: input.year,
    });

    await OutboxService.enqueue({
      action: 'CREATE',
      collection: `tenants/${input.tenantId}/sacem_reports`,
      targetId: id,
      priority: OutboxPriority.LEGAL,
      payload: report as unknown as Record<string, unknown>,
    }).catch(() => 0);

    await AuditLogger.logAction(
      input.requestedBy,
      'FISCAL_ARCHIVE_EXPORT',
      `sacem_${input.year}`,
      { licenseNumber: license.licenseNumber, year: input.year },
    ).catch(() => null);

    return report;
  }
}
