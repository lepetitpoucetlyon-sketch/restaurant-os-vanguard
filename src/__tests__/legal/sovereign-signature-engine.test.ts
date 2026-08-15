import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LegalContractGenerator, type ContractDraftInput } from '@/modules/legal/services/LegalContractGenerator';
import { SovereignSignatureEngine, type SignatureSubmissionInput } from '@/modules/legal/services/SovereignSignatureEngine';
import { Nexus } from '@/lib/nexus/NexusAdapter';

describe('Système Contractuel B2B & Moteur d E-Signature Souverain (DocuSign Equiv)', () => {
  const tenantId = 'bistro-vendome-paris';

  const mockInput: ContractDraftInput = {
    tenantId,
    vertical: 'RESTAURANT',
    client: {
      companyName: 'Brasserie Vendôme SAS',
      legalForm: 'SAS',
      siren: '883 992 110',
      representativeName: 'Alexandre Dumas',
      representativeRole: 'Président',
      email: 'alexandre@vendome.fr',
      address: '1 Place Vendôme',
      city: 'Paris',
      postalCode: '75001',
    },
    pricing: {
      planName: 'Empire Enterprise',
      monthlyPriceInEuros: 199,
      setupFeeInEuros: 490,
      commitmentMonths: 12,
      billingCycle: 'MONTHLY',
      includedRegistersCount: 3,
      includedModules: ['POS', 'KDS', 'INVENTORY', 'HACCP', 'DELIVERY_BRIDGE'],
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await Nexus.adapter.delete(`tenants/${tenantId}/contracts`);
  });

  it('devrait générer un contrat B2B complet avec CGU/CGV, DPA RGPD Art. 28 et Addendum sectoriel', () => {
    const doc = LegalContractGenerator.generateContract(mockInput);

    expect(doc.contractId).toBeDefined();
    expect(doc.title).toContain('Brasserie Vendôme SAS');
    expect(doc.fullTextContent).toContain('ARTICLE 4 — NIVEAU DE SERVICE (SLA) & DISPONIBILITÉ (99.9%)');
    expect(doc.fullTextContent).toContain('ANNEXE RGPD — ACCORD SUR LE TRAITEMENT DES DONNÉES PERSONNELLES');
    expect(doc.fullTextContent).toContain('Stripe Payments Europe Ltd');
    expect(doc.fullTextContent).toContain('Google Cloud Vertex AI (Gemini)');
    expect(doc.fullTextContent).toContain('Conformité Fiscale NF525');
    expect(doc.fullTextContent).toContain('Règlement UE 1169/2011');
  });

  it('devrait adapter les clauses légales spécifiques pour la verticale SALON et GARAGE', () => {
    const salonDoc = LegalContractGenerator.generateContract({
      ...mockInput,
      vertical: 'SALON',
    });
    expect(salonDoc.verticalAddendumContent).toContain('Données de Santé & Sensibilité Cutanée (RGPD Art. 9)');
    expect(salonDoc.verticalAddendumContent).toContain('AES-256-GCM');

    const garageDoc = LegalContractGenerator.generateContract({
      ...mockInput,
      vertical: 'GARAGE',
    });
    expect(garageDoc.verticalAddendumContent).toContain('Ordre de Réparation (OR)');
    expect(garageDoc.verticalAddendumContent).toContain('Pièces Issues de l\'Économie Circulaire (PIEC)');
  });

  it('devrait émettre le contrat, gérer la visualisation et exécuter la signature électronique eIDAS', async () => {
    // 1. Émission depuis le MCC
    const contract = await SovereignSignatureEngine.createAndSendContract(mockInput);
    expect(contract.status).toBe('SENT');
    expect(contract.signingToken).toBeDefined();

    // 2. Visualisation par le client
    const viewed = await SovereignSignatureEngine.markContractViewed(tenantId, contract.id, {
      ip: '194.55.22.10',
      userAgent: 'Mozilla/5.0 iPad',
    });
    expect(viewed.status).toBe('VIEWED');
    expect(viewed.viewedAt).toBeDefined();

    // 3. Tentative de signature sans consentement -> doit échouer
    const invalidSubmission: SignatureSubmissionInput = {
      signerName: 'Alexandre Dumas',
      signerRole: 'Président',
      signerEmail: 'alexandre@vendome.fr',
      signatureCanvasBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      ipAddress: '194.55.22.10',
      userAgent: 'Mozilla/5.0 iPad',
      consentConfirmed: false, // Refus consentement
    };

    await expect(
      SovereignSignatureEngine.signContract(tenantId, contract.id, invalidSubmission)
    ).rejects.toThrow('Le consentement formel aux CGU/CGV et au DPA RGPD est obligatoire');

    // 4. Signature valide avec consentement et tracé manuscrit
    const validSubmission: SignatureSubmissionInput = {
      ...invalidSubmission,
      consentConfirmed: true,
    };

    const signedContract = await SovereignSignatureEngine.signContract(
      tenantId,
      contract.id,
      validSubmission
    );

    expect(signedContract.status).toBe('SIGNED');
    expect(signedContract.proofCertificate).toBeDefined();
    expect(signedContract.proofCertificate?.contractSha256).toBeDefined();
    expect(signedContract.proofCertificate?.masterSealSha256).toBeDefined();
    expect(signedContract.proofCertificate?.eidasStandard).toBe('ADVANCED_ELECTRONIC_SIGNATURE_AES');

    // 5. Vérification d'intégrité eIDAS (Non-altération mathématique)
    const verification = await SovereignSignatureEngine.verifyContractIntegrity(signedContract);
    expect(verification.isValid).toBe(true);
    expect(verification.errors.length).toBe(0);

    // 6. Test d'altération frauduleuse post-signature (Attaque Man-in-the-Middle)
    const tamperedContract = JSON.parse(JSON.stringify(signedContract));
    tamperedContract.document.fullTextContent += '\n[CLAUSE FORGÉE PAR UN TIERS]';

    const tamperedVerification = await SovereignSignatureEngine.verifyContractIntegrity(tamperedContract);
    expect(tamperedVerification.isValid).toBe(false);
    expect(tamperedVerification.errors[0]).toContain('Altération du texte contractuel détectée');
  });
});
