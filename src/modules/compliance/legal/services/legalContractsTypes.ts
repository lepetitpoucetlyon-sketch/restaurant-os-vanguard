import type {
  GeneratedContractDocument,
  ContractPartyInfo,
  ContractPricingPlan,
  VerticalType,
} from './LegalContractGenerator';

export type ContractSignatureState = 'DRAFT' | 'SENT' | 'VIEWED' | 'SIGNED' | 'REVOKED';

export interface SignatureSubmissionInput {
  signerName: string;
  signerRole: string;
  signerEmail: string;
  signatureCanvasBase64: string;
  ipAddress: string;
  userAgent: string;
  consentConfirmed: boolean;
}

export interface ProofCertificate {
  certificateId: string;
  contractId: string;
  signerName: string;
  signerRole: string;
  signerEmail: string;
  signedAtIso: string;
  signedAtUtc: number;
  ipAddress: string;
  userAgent: string;
  contractSha256: string;
  signatureVectorSha256: string;
  masterSealSha256: string;
  eidasStandard: 'ADVANCED_ELECTRONIC_SIGNATURE_AES';
  verificationUrl: string;
}

export interface ContractRecord {
  id: string;
  tenantId: string;
  vertical: VerticalType;
  status: ContractSignatureState;
  document: GeneratedContractDocument;
  client: ContractPartyInfo;
  pricing: ContractPricingPlan;
  signingToken: string;
  createdAt: number;
  sentAt?: number;
  viewedAt?: number;
  proofCertificate?: ProofCertificate;
  // Métadonnées DocuSeal
  docusealSubmissionId?: number | string;
  docusealSlug?: string;
  docusealSignedPdfUrl?: string;
  docusealAuditLogUrl?: string;
  signedVia?: 'SOVEREIGN_CANVAS' | 'DOCUSEAL_WEBHOOK' | 'DIRECT_EIDAS';
}

export interface DocuSealSubmitter {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  fields?: Array<{
    name: string;
    default_value?: string;
    readonly?: boolean;
  }>;
}

export interface DocuSealSubmissionResponse {
  id: number | string;
  slug: string;
  status: 'draft' | 'pending' | 'completed' | 'expired';
  submitters: Array<{
    id: number | string;
    slug: string;
    email: string;
    phone?: string;
    status: 'pending' | 'opened' | 'signed';
    embed_url: string;
    signing_url: string;
    signed_at?: string;
  }>;
  documents?: Array<{
    name: string;
    url: string;
  }>;
}

export interface DocuSealWebhookPayload {
  event_type: 'submission.created' | 'submission.opened' | 'submission.completed';
  timestamp?: string;
  data: {
    id: number | string;
    slug: string;
    status: string;
    template_id?: number | string;
    submitters: Array<{
      id: number | string;
      email: string;
      phone?: string;
      status: string;
      signed_at?: string;
      metadata?: Record<string, unknown>;
    }>;
    documents?: Array<{
      url: string;
      filename: string;
    }>;
    audit_log_url?: string;
  };
}
