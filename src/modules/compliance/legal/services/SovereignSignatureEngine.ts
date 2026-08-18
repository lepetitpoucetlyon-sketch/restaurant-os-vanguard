import { Nexus } from '@/lib/nexus/NexusAdapter';
import { CryptoService } from '@/lib/CryptoService';
import { LegalContractGenerator, type ContractDraftInput, type GeneratedContractDocument, type ContractPartyInfo, type ContractPricingPlan, type VerticalType } from './LegalContractGenerator';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import type {
  DocuSealWebhookPayload,
  ContractSignatureState,
  SignatureSubmissionInput,
  ProofCertificate,
  ContractRecord,
} from './legalContractsTypes';

export type {
  ContractSignatureState,
  SignatureSubmissionInput,
  ProofCertificate,
  ContractRecord,
};

/**
 * ✍️ SovereignSignatureEngine — Moteur d'E-Signature & Horodatage eIDAS
 * Système souverain équivalent DocuSign / Documenso avec scellement SHA-256 et preuve probante.
 */
export class SovereignSignatureEngine {
  /**
   * Génère et émet un nouveau contrat B2B / DPA depuis le MCC vers le compte client.
   */
  static async createAndSendContract(input: ContractDraftInput): Promise<ContractRecord> {
    const document = LegalContractGenerator.generateContract(input);
    const signingToken = `sign_tok_${document.contractId}_${Math.random().toString(36).substring(2, 10)}`;
    const now = Date.now();

    const record: ContractRecord = {
      id: document.contractId,
      tenantId: input.tenantId,
      vertical: input.vertical,
      status: 'SENT',
      document,
      client: input.client,
      pricing: input.pricing,
      signingToken,
      createdAt: now,
      sentAt: now,
    };

    // 1. Persistance Tenant
    await Nexus.adapter.set(`tenants/${input.tenantId}/contracts/${document.contractId}`, record);

    // 2. Persistance Index Flotte MCC
    const mccIndex = (await Nexus.adapter.get<Record<string, ContractRecord>>('mcc_contracts_index')) || {};
    mccIndex[document.contractId] = record;
    await Nexus.adapter.set('mcc_contracts_index', mccIndex);

    empireAudit.log({
      module: 'legal',
      action: 'CONTRACT_CREATED_AND_SENT',
      details: {
        contractId: document.contractId,
        tenantId: input.tenantId,
        vertical: input.vertical,
        clientCompany: input.client.companyName,
        planName: input.pricing.planName,
      },
      severity: 'medium',
      timestamp: new Date(now),
    });

    logger.info(`[Legal] Contrat ${document.contractId} émis pour ${input.client.companyName} (${input.tenantId})`);
    return record;
  }

  /**
   * Associe un identifiant de soumission DocuSeal à un contrat existant.
   */
  static async attachDocuSealSubmission(
    tenantId: string,
    contractId: string,
    submissionId: number | string,
    slug: string
  ): Promise<ContractRecord> {
    const contractPath = `tenants/${tenantId}/contracts/${contractId}`;
    const contract = await Nexus.adapter.get<ContractRecord>(contractPath);
    if (!contract) {
      throw new Error(`Contrat introuvable: ${contractId}`);
    }

    const updated: ContractRecord = {
      ...contract,
      docusealSubmissionId: submissionId,
      docusealSlug: slug,
    };

    await Nexus.adapter.set(contractPath, updated);
    const mccIndex = (await Nexus.adapter.get<Record<string, ContractRecord>>('mcc_contracts_index')) || {};
    mccIndex[contractId] = updated;
    await Nexus.adapter.set('mcc_contracts_index', mccIndex);

    return updated;
  }

  /**
   * Marque le contrat comme lu / visualisé lors de l'ouverture par le client.
   */
  static async markContractViewed(
    tenantId: string,
    contractId: string,
    meta?: { ip?: string; userAgent?: string }
  ): Promise<ContractRecord> {
    const contractPath = `tenants/${tenantId}/contracts/${contractId}`;
    const contract = await Nexus.adapter.get<ContractRecord>(contractPath);

    if (!contract) {
      throw new Error(`Contrat introuvable: ${contractId}`);
    }

    if (contract.status === 'SENT') {
      const updated: ContractRecord = {
        ...contract,
        status: 'VIEWED',
        viewedAt: Date.now(),
      };

      await Nexus.adapter.set(contractPath, updated);

      const mccIndex = (await Nexus.adapter.get<Record<string, ContractRecord>>('mcc_contracts_index')) || {};
      mccIndex[contractId] = updated;
      await Nexus.adapter.set('mcc_contracts_index', mccIndex);

      logger.info(`[Legal] Contrat ${contractId} visualisé par le client (IP: ${meta?.ip || 'inconnue'})`);
      return updated;
    }

    return contract;
  }

  /**
   * Exécute la signature électronique certifiée du contrat, calcule le Master Seal et génère le certificat de preuve.
   */
  static async signContract(
    tenantId: string,
    contractId: string,
    submission: SignatureSubmissionInput
  ): Promise<ContractRecord> {
    const contractPath = `tenants/${tenantId}/contracts/${contractId}`;
    const contract = await Nexus.adapter.get<ContractRecord>(contractPath);

    if (!contract) {
      throw new Error(`Contrat introuvable: ${contractId}`);
    }

    if (contract.status === 'SIGNED') {
      throw new Error(`Le contrat ${contractId} est déjà signé et immuable.`);
    }

    if (contract.status === 'REVOKED') {
      throw new Error(`Le contrat ${contractId} a été révoqué.`);
    }

    if (!submission.consentConfirmed) {
      throw new Error('Le consentement formel aux CGU/CGV et au DPA RGPD est obligatoire pour signer.');
    }

    if (!submission.signatureCanvasBase64 || submission.signatureCanvasBase64.trim().length === 0) {
      throw new Error('Le tracé manuscrit de signature est requis.');
    }

    const now = Date.now();
    const signedAtIso = new Date(now).toISOString();

    // 1. Calcul des empreintes cryptographiques SHA-256
    const contractSha256 = await CryptoService.generateHash(contract.document.fullTextContent);
    const signatureVectorSha256 = await CryptoService.generateHash(submission.signatureCanvasBase64);

    // 2. Calcul du Master Seal eIDAS
    const sealPayload = `${contractSha256}:${signatureVectorSha256}:${now}:${submission.signerEmail}:${submission.ipAddress}`;
    const masterSealSha256 = await CryptoService.generateHash(sealPayload);

    const certificateId = `CERT-EIDAS-${contractId.replace('CTR-', '')}-${Math.random().toString(36).substring(4).toUpperCase()}`;

    const proofCertificate: ProofCertificate = {
      certificateId,
      contractId,
      signerName: submission.signerName,
      signerRole: submission.signerRole,
      signerEmail: submission.signerEmail,
      signedAtIso,
      signedAtUtc: now,
      ipAddress: submission.ipAddress,
      userAgent: submission.userAgent,
      contractSha256,
      signatureVectorSha256,
      masterSealSha256,
      eidasStandard: 'ADVANCED_ELECTRONIC_SIGNATURE_AES',
      verificationUrl: `https://app.restaurant-empire.fr/legal/verify/${certificateId}`,
    };

    const updated: ContractRecord = {
      ...contract,
      status: 'SIGNED',
      proofCertificate,
      signedVia: 'SOVEREIGN_CANVAS',
    };

    // 3. Sauvegarde scellée
    await Nexus.adapter.set(contractPath, updated);

    const mccIndex = (await Nexus.adapter.get<Record<string, ContractRecord>>('mcc_contracts_index')) || {};
    mccIndex[contractId] = updated;
    await Nexus.adapter.set('mcc_contracts_index', mccIndex);

    // 4. Émission sur le bus d'orchestration
    await NexusEventBus.emit('finance.refund_issued', {
      tenantId,
      referenceId: contractId,
      amountInMicrounits: 0,
      reason: `CONTRACT_ACTIVATED_SIGNED_${submission.signerName}`,
    });

    empireAudit.log({
      module: 'legal',
      action: 'CONTRACT_ELECTRONICALLY_SIGNED',
      details: {
        contractId,
        certificateId,
        signer: submission.signerName,
        email: submission.signerEmail,
        ip: submission.ipAddress,
        masterSeal: masterSealSha256,
      },
      severity: 'high',
      timestamp: new Date(now),
    });

    logger.info(`[Legal] ✍️ Contrat ${contractId} signé avec succès par ${submission.signerName} (Certificat: ${certificateId})`);
    return updated;
  }

  /**
   * Traite un webhook de signature DocuSeal (`submission.completed`) et scelle le contrat correspondant.
   */
  static async handleDocuSealWebhook(payload: DocuSealWebhookPayload): Promise<ContractRecord | null> {
    const mccIndex = (await Nexus.adapter.get<Record<string, ContractRecord>>('mcc_contracts_index')) || {};
    
    // Recherche par docusealSubmissionId ou slug
    const submissionId = String(payload.data.id);
    const contract = Object.values(mccIndex).find(
      (c) => String(c.docusealSubmissionId) === submissionId || c.docusealSlug === payload.data.slug
    );

    if (!contract) {
      logger.warn(`[DocuSeal Webhook] Aucun contrat associé à la soumission DocuSeal ${submissionId}`);
      return null;
    }

    if (payload.event_type === 'submission.opened') {
      return this.markContractViewed(contract.tenantId, contract.id);
    }

    if (payload.event_type === 'submission.completed') {
      const submitter = payload.data.submitters[0];
      const now = Date.now();
      const signedAtIso = submitter?.signed_at || new Date(now).toISOString();

      const contractSha256 = await CryptoService.generateHash(contract.document.fullTextContent);
      const signatureVectorSha256 = await CryptoService.generateHash(`DOCUSEAL_SUBMISSION_${submissionId}`);
      const sealIp = 'DOCUSEAL_VERIFIED_IP';
      const sealEmail = submitter?.email || contract.client.email;
      const sealPayload = `${contractSha256}:${signatureVectorSha256}:${now}:${sealEmail}:${sealIp}`;
      const masterSealSha256 = await CryptoService.generateHash(sealPayload);

      const certificateId = `CERT-DOCUSEAL-${contract.id.replace('CTR-', '')}-${Math.random().toString(36).substring(4).toUpperCase()}`;

      const proofCertificate: ProofCertificate = {
        certificateId,
        contractId: contract.id,
        signerName: contract.client.representativeName,
        signerRole: contract.client.representativeRole,
        signerEmail: sealEmail,
        signedAtIso,
        signedAtUtc: now,
        ipAddress: sealIp,
        userAgent: 'DocuSeal Electronic Signature Agent',
        contractSha256,
        signatureVectorSha256,
        masterSealSha256,
        eidasStandard: 'ADVANCED_ELECTRONIC_SIGNATURE_AES',
        verificationUrl: `https://app.restaurant-empire.fr/legal/verify/${certificateId}`,
      };

      const docUrl = payload.data.documents?.[0]?.url;
      const updated: ContractRecord = {
        ...contract,
        status: 'SIGNED',
        proofCertificate,
        signedVia: 'DOCUSEAL_WEBHOOK',
        docusealSignedPdfUrl: docUrl,
        docusealAuditLogUrl: payload.data.audit_log_url,
      };

      await Nexus.adapter.set(`tenants/${contract.tenantId}/contracts/${contract.id}`, updated);
      mccIndex[contract.id] = updated;
      await Nexus.adapter.set('mcc_contracts_index', mccIndex);

      empireAudit.log({
        module: 'legal',
        action: 'DOCUSEAL_CONTRACT_COMPLETED',
        details: {
          contractId: contract.id,
          submissionId,
          certificateId,
          docUrl,
        },
        severity: 'high',
        timestamp: new Date(),
      });

      logger.info(`[DocuSeal Webhook] ✍️ Contrat ${contract.id} complété et certifié via DocuSeal`);
      return updated;
    }

    return contract;
  }

  /**
   * Vérifie mathématiquement l'intégrité et la non-altération d'un contrat signé (Norme eIDAS).
   */
  static async verifyContractIntegrity(contract: ContractRecord): Promise<{
    isValid: boolean;
    recalculatedContractHash: string;
    recalculatedMasterSeal: string;
    errors: string[];
  }> {
    const errors: string[] = [];

    if (!contract.proofCertificate) {
      return {
        isValid: false,
        recalculatedContractHash: '',
        recalculatedMasterSeal: '',
        errors: ['Aucun certificat de preuve attaché au contrat.'],
      };
    }

    const { proofCertificate } = contract;

    const recalculatedContractHash = await CryptoService.generateHash(contract.document.fullTextContent);
    if (recalculatedContractHash !== proofCertificate.contractSha256) {
      errors.push('Altération du texte contractuel détectée : le hash du document ne correspond pas au certificat.');
    }

    const sealPayload = `${proofCertificate.contractSha256}:${proofCertificate.signatureVectorSha256}:${proofCertificate.signedAtUtc}:${proofCertificate.signerEmail}:${proofCertificate.ipAddress}`;
    const recalculatedMasterSeal = await CryptoService.generateHash(sealPayload);

    if (recalculatedMasterSeal !== proofCertificate.masterSealSha256) {
      errors.push('Altération du sceau maître détectée : le Master Seal SHA-256 est invalide.');
    }

    return {
      isValid: errors.length === 0,
      recalculatedContractHash,
      recalculatedMasterSeal,
      errors,
    };
  }

  /**
   * Liste tous les contrats d'un établissement client.
   */
  static async getTenantContracts(tenantId: string): Promise<ContractRecord[]> {
    const contractsMap = (await Nexus.adapter.get<Record<string, ContractRecord>>(`tenants/${tenantId}/contracts`)) || {};
    return Object.values(contractsMap).filter(Boolean);
  }

  /**
   * Liste tous les contrats de la flotte pour le tableau de bord MCC.
   */
  static async getAllFleetContracts(): Promise<ContractRecord[]> {
    const mccIndex = (await Nexus.adapter.get<Record<string, ContractRecord>>('mcc_contracts_index')) || {};
    return Object.values(mccIndex).filter(Boolean);
  }
}
