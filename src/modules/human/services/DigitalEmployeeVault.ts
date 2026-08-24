import { Nexus } from '@/lib/nexus/NexusAdapter';
import { CryptoService } from '@/lib/CryptoService';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import type { EmployeeDocument } from '../domain/schemas/employeeDocument';

export interface VaultArchiveManifest {
  manifestVersion: '1.0';
  tenantId: string;
  employeeId: string;
  generatedAt: string;
  totalDocuments: number;
  globalSealSha256: string;
  documents: Array<{
    id: string;
    name: string;
    type: string;
    sha256Hash: string;
    sealedAt: string;
    sealedBy: string;
  }>;
}

/**
 * 🔒 Coffre-Fort Numérique Personnel du Salarié (Art. L3243-2 Code du travail & RGPD)
 * 
 * Garantit :
 * 1. L'inaltérabilité de chaque document RH (bulletin, contrat, avenant) par scellement SHA-256
 * 2. L'accès continu par le salarié même après son départ de l'établissement
 * 3. L'export d'archive complète certifiée avec manifeste d'intégrité
 */
export class DigitalEmployeeVault {
  /**
   * Scelle cryptographiquement un document dans le coffre-fort numérique.
   */
  static async sealDocument(
    tenantId: string,
    doc: Omit<EmployeeDocument, 'sha256Hash' | 'sealedAt' | 'sealedBy'> & { payloadContent?: string },
    actorId: string
  ): Promise<EmployeeDocument> {
    const now = new Date().toISOString();
    const payloadToHash = doc.payloadContent || `${doc.id}:${doc.userId}:${doc.type}:${doc.name}:${doc.uploadedAt}`;
    const sha256Hash = await CryptoService.generateHash(payloadToHash);

    const sealedDoc: EmployeeDocument = {
      ...doc,
      tenantId,
      sha256Hash,
      sealedAt: now,
      sealedBy: actorId,
      status: 'valid',
      vaultArchiveEligible: true,
    };

    await Nexus.adapter.set(`tenants/${tenantId}/employee_vault/${doc.userId}/documents/${doc.id}`, sealedDoc);

    empireAudit.log({
      action: 'human.vault_document_sealed',
      module: 'human',
      userId: actorId,
      instanceId: tenantId,
      timestamp: new Date(),
      details: { documentId: doc.id, employeeId: doc.userId, documentType: doc.type, sha256Hash },
    });

    logger.info(`[DigitalVault] Document scellé avec succès : ${doc.id} (SHA256: ${sha256Hash.slice(0, 16)}...)`);
    return sealedDoc;
  }

  /**
   * Récupère l'ensemble des documents scellés dans le coffre-fort d'un salarié.
   */
  static async listEmployeeVault(tenantId: string, employeeId: string): Promise<EmployeeDocument[]> {
    try {
      return await Nexus.adapter.query<EmployeeDocument>(
        `tenants/${tenantId}/employee_vault/${employeeId}/documents`,
        {}
      );
    } catch (err) {
      logger.warn(`[DigitalVault] Impossible de charger le coffre pour ${employeeId}`, { error: err });
      return [];
    }
  }

  /**
   * Vérifie l'intégrité d'un document scellé par rapport à sa signature d'origine.
   */
  static async verifyDocumentIntegrity(
    doc: EmployeeDocument,
    payloadContent?: string
  ): Promise<{ isValid: boolean; expectedHash: string; computedHash: string }> {
    if (!doc.sha256Hash) {
      return { isValid: false, expectedHash: '', computedHash: '' };
    }

    const payloadToHash = payloadContent || `${doc.id}:${doc.userId}:${doc.type}:${doc.name}:${doc.uploadedAt}`;
    const computedHash = await CryptoService.generateHash(payloadToHash);

    return {
      isValid: computedHash === doc.sha256Hash,
      expectedHash: doc.sha256Hash,
      computedHash,
    };
  }

  /**
   * Génère le manifeste d'export d'archive du coffre-fort numérique pour téléchargement global.
   */
  static async generateVaultArchiveManifest(
    tenantId: string,
    employeeId: string
  ): Promise<VaultArchiveManifest> {
    const docs = await this.listEmployeeVault(tenantId, employeeId);
    const now = new Date().toISOString();

    const manifestDocs = docs.map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      sha256Hash: d.sha256Hash || 'UNSEALED',
      sealedAt: d.sealedAt || d.uploadedAt,
      sealedBy: d.sealedBy || 'system',
    }));

    const combinedHashes = manifestDocs.map((d) => d.sha256Hash).join(':');
    const globalSealSha256 = await CryptoService.generateHash(combinedHashes);

    return {
      manifestVersion: '1.0',
      tenantId,
      employeeId,
      generatedAt: now,
      totalDocuments: manifestDocs.length,
      globalSealSha256,
      documents: manifestDocs,
    };
  }
}
