/**
 * L26 — RPI (Registre du Personnel Instantané) — Export smartphone.
 *
 * Art. L. 1221-13 + R. 1221-26 Code du Travail :
 * L'employeur doit tenir un registre du personnel à jour avec les entrées/sorties.
 * L'inspecteur du travail peut demander à le consulter sur place immédiatement.
 * Sans export mobile, le gérant ne peut pas le présenter lors d'un contrôle inopiné.
 *
 * Ce service produit un snapshot signé (SHA-256) du registre, exportable en PDF/JSON,
 * lisible depuis un smartphone sans connexion.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L26.
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { AuditLogger } from '@/lib/audit';
import { CryptoService } from '@/lib/CryptoService';

export interface RpiEmployee {
  employeeId: string;
  lastName: string;
  firstName: string;
  nationality: string;
  dateOfBirth: string;
  jobTitle: string;
  contractType: 'CDI' | 'CDD' | 'interim' | 'apprentissage' | 'stage';
  entryDate: string;
  exitDate?: string;
  dpaeNumber?: string;
}

export interface RpiSnapshot {
  tenantId: string;
  generatedAt: number;
  generatedBy: string;
  employeeCount: number;
  employees: RpiEmployee[];
  snapshotHash: string;
  legalRef: 'Art. L. 1221-13 CT';
}

export class RpiExportService {
  static async generateSnapshot(input: {
    tenantId: string;
    requestedBy: string;
    now?: number;
  }): Promise<RpiSnapshot> {
    const now = input.now ?? Date.now();

    const employees = await Nexus.adapter.query<RpiEmployee>(
      `tenants/${input.tenantId}/hr_employees`,
    );

    const sorted = [...employees].sort((a, b) => a.entryDate.localeCompare(b.entryDate));

    const dataToHash = JSON.stringify({ tenantId: input.tenantId, generatedAt: now, employees: sorted });
    const snapshotHash = await CryptoService.generateHash(dataToHash);

    const snapshot: RpiSnapshot = {
      tenantId: input.tenantId,
      generatedAt: now,
      generatedBy: input.requestedBy,
      employeeCount: sorted.length,
      employees: sorted,
      snapshotHash,
      legalRef: 'Art. L. 1221-13 CT',
    };

    await Nexus.adapter.set(
      `tenants/${input.tenantId}/rpi_snapshots/latest`,
      snapshot,
    );

    await AuditLogger.logAction(
      input.requestedBy,
      'CUSTOMER_MASS_EXPORT',
      'rpi_register',
      { employeeCount: sorted.length, snapshotHash },
    ).catch(() => null);

    return snapshot;
  }

  static async getLatestSnapshot(tenantId: string): Promise<RpiSnapshot | null> {
    return Nexus.adapter.get<RpiSnapshot>(`tenants/${tenantId}/rpi_snapshots/latest`);
  }
}
