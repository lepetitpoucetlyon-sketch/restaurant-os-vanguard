import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DocuSealService } from '@/modules/compliance/legal/services/DocuSealService';
import { ContractDispatcherService } from '@/modules/compliance/legal/services/ContractDispatcherService';
import { SovereignSignatureEngine, type ContractRecord } from '@/modules/compliance/legal/services/SovereignSignatureEngine';
import { Nexus } from '@/lib/nexus/NexusAdapter';

describe('Intégration E-Signature DocuSeal & Dispatch Multi-Canal (Email / SMS)', () => {
  const tenantId = 'bistro-docuseal-test';

  const mockContractInput = {
    tenantId,
    vertical: 'RESTAURANT' as const,
    client: {
      companyName: 'Le Bistrot Parisien SAS',
      legalForm: 'SAS',
      siren: '123 456 789',
      representativeName: 'Jean Dupont',
      representativeRole: 'Gérant',
      email: 'jean.dupont@bistro-paris.fr',
      phone: '+33612345678',
      address: '15 Rue de Rivoli',
      city: 'Paris',
      postalCode: '75004',
    },
    pricing: {
      planName: 'Restaurant OS Pro',
      monthlyPriceInEuros: 79,
      setupFeeInEuros: 0,
      commitmentMonths: 12,
      billingCycle: 'MONTHLY' as const,
      includedRegistersCount: 2,
      includedModules: ['POS', 'KDS', 'HACCP', 'STOCK', 'NF525'],
    },
  };

  let contract: ContractRecord;

  beforeEach(async () => {
    vi.clearAllMocks();
    await Nexus.adapter.delete(`tenants/${tenantId}/contracts`);
    contract = await SovereignSignatureEngine.createAndSendContract(mockContractInput);
  });

  it('devrait créer une soumission DocuSeal en mode sandbox lorsque aucune clé API de prod n est fournie', async () => {
    const submission = await DocuSealService.createSubmission(contract);

    expect(submission.id).toBeDefined();
    expect(submission.slug).toContain('ds_');
    expect(submission.status).toBe('pending');
    expect(submission.submitters).toHaveLength(1);
    expect(submission.submitters[0].email).toBe('jean.dupont@bistro-paris.fr');
    expect(submission.submitters[0].phone).toBe('+33612345678');
    expect(submission.submitters[0].signing_url).toContain(contract.id);
  });

  it('devrait dispatcher le contrat sur les canaux Email et SMS avec formatage du message', async () => {
    const result = await ContractDispatcherService.dispatchContract(contract, {
      sendEmail: true,
      sendSms: true,
      signerPhone: '+33612345678',
    });

    expect(result.success).toBe(true);
    expect(result.contractId).toBe(contract.id);
    expect(result.channelsDelivered).toContain('EMAIL');
    expect(result.channelsDelivered).toContain('SMS');
    expect(result.signingUrl).toBeDefined();
  });

  it('devrait sceller le contrat et générer la preuve eIDAS à la réception du webhook submission.completed de DocuSeal', async () => {
    // 1. Associer l'ID de soumission
    const submissionId = 98765;
    const slug = 'ds_test_slug_123';
    await SovereignSignatureEngine.attachDocuSealSubmission(tenantId, contract.id, submissionId, slug);

    // 2. Simuler webhook DocuSeal
    const webhookPayload = {
      event_type: 'submission.completed' as const,
      data: {
        id: submissionId,
        slug,
        status: 'completed',
        submitters: [
          {
            id: 1,
            email: 'jean.dupont@bistro-paris.fr',
            status: 'signed',
            signed_at: new Date().toISOString(),
          },
        ],
        documents: [
          {
            url: 'https://docuseal.app/signed_documents/doc_123.pdf',
            filename: 'Contrat_Signe.pdf',
          },
        ],
        audit_log_url: 'https://docuseal.app/audit_logs/audit_123.pdf',
      },
    };

    const signedContract = await SovereignSignatureEngine.handleDocuSealWebhook(webhookPayload);

    expect(signedContract).not.toBeNull();
    expect(signedContract?.status).toBe('SIGNED');
    expect(signedContract?.signedVia).toBe('DOCUSEAL_WEBHOOK');
    expect(signedContract?.docusealSignedPdfUrl).toBe('https://docuseal.app/signed_documents/doc_123.pdf');
    expect(signedContract?.proofCertificate).toBeDefined();
    expect(signedContract?.proofCertificate?.eidasStandard).toBe('ADVANCED_ELECTRONIC_SIGNATURE_AES');
    expect(signedContract?.proofCertificate?.masterSealSha256).toBeDefined();

    // 3. Vérifier l'intégrité mathématique
    const verification = await SovereignSignatureEngine.verifyContractIntegrity(signedContract!);
    expect(verification.isValid).toBe(true);
    expect(verification.errors).toHaveLength(0);
  });
});
