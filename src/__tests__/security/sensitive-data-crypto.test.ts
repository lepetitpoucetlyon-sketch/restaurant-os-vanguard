import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SensitiveDataCryptoService } from '@/shared/security/SensitiveDataCryptoService';
import { Nexus } from '@/lib/nexus/NexusAdapter';

describe('RGPD Art. 9 & Art. 17 : Chiffrement AES-256-GCM & Crypto-Shredding', () => {
  const tenantId = 'brasserie-paris';
  const customerId = 'cust-sophie-123';

  beforeEach(async () => {
    vi.clearAllMocks();
    await Nexus.adapter.delete(`tenants/${tenantId}/customerKeys/${customerId}`);
  });

  it('devrait chiffrer et déchiffrer avec intégrité les données de santé / allergies', async () => {
    const sensitiveData = 'Allergie sévère aux arachides, asthme d effort, intolérance au lactose';

    // 1. Chiffrement
    const encrypted = await SensitiveDataCryptoService.encryptSensitiveField(
      sensitiveData,
      tenantId,
      customerId
    );

    expect(encrypted.algorithm).toBe('AES-256-GCM');
    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.ciphertext).not.toBe(sensitiveData);
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.tag).toBeDefined();

    // 2. Déchiffrement
    const decrypted = await SensitiveDataCryptoService.decryptSensitiveField(
      encrypted,
      tenantId,
      customerId
    );

    expect(decrypted).toBe(sensitiveData);
  });

  it('devrait rendre les données irrévocablement illisibles après Crypto-Shredding (Droit à l oubli)', async () => {
    const sensitiveData = 'Historique médical confidentiel : traitement en cours';

    const encrypted = await SensitiveDataCryptoService.encryptSensitiveField(
      sensitiveData,
      tenantId,
      customerId
    );

    // Vérification initiale : accessible
    const beforeShred = await SensitiveDataCryptoService.decryptSensitiveField(
      encrypted,
      tenantId,
      customerId
    );
    expect(beforeShred).toBe(sensitiveData);

    // 💥 Action RGPD : Crypto-shredding de la clé client
    await SensitiveDataCryptoService.cryptoShredCustomer(
      tenantId,
      customerId,
      'dpo-rgpd-compliance'
    );

    // Tentative de déchiffrement après shredding : doit échouer
    await expect(
      SensitiveDataCryptoService.decryptSensitiveField(encrypted, tenantId, customerId)
    ).rejects.toThrow(/CRYPTO_KEY_SHREDDED/);
  });
});
