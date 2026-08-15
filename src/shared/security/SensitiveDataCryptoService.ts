import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

export interface EncryptedPayload {
  ciphertext: string; // Base64
  iv: string;         // Base64
  tag: string;        // Base64 (Auth Tag)
  algorithm: 'AES-256-GCM';
  customerId: string;
  encryptedAt: number;
}

export interface CustomerKeyRecord {
  customerId: string;
  tenantId: string;
  rawKeyBase64: string;
  createdAt: number;
  status: 'ACTIVE' | 'SHREDDED';
}

/**
 * 🔒 SensitiveDataCryptoService — RGPD Article 9 & Droit à l'Oubli (Art. 17)
 *
 * Chiffre au repos les données hautement sensibles (allergies alimentaires, pathologies, fiches santé).
 * Permet l'effacement immédiat et irréversible par destruction de clé (Crypto-Shredding).
 */
export class SensitiveDataCryptoService {
  /**
   * Récupère ou génère la clé de chiffrement dédiée d'un client (DEK: Data Encryption Key).
   */
  private static async getOrCreateCustomerKey(tenantId: string, customerId: string): Promise<string> {
    const keyPath = `tenants/${tenantId}/customerKeys/${customerId}`;
    const existing = await Nexus.adapter.get<CustomerKeyRecord>(keyPath);

    if (existing) {
      if (existing.status === 'SHREDDED') {
        throw new Error(`CRYPTO_KEY_SHREDDED: La clé de déchiffrement pour le client ${customerId} a été détruite (RGPD Art. 17).`);
      }
      return existing.rawKeyBase64;
    }

    // Génération d'une nouvelle clé 256 bits (32 octets)
    const newKeyBuffer = crypto.randomBytes(32);
    const rawKeyBase64 = newKeyBuffer.toString('base64');

    const record: CustomerKeyRecord = {
      customerId,
      tenantId,
      rawKeyBase64,
      createdAt: Date.now(),
      status: 'ACTIVE',
    };

    await Nexus.adapter.set(keyPath, record);
    return rawKeyBase64;
  }

  /**
   * Chiffre un champ sensible avec AES-256-GCM.
   */
  static async encryptSensitiveField(
    plaintext: string,
    tenantId: string,
    customerId: string
  ): Promise<EncryptedPayload> {
    const rawKeyBase64 = await this.getOrCreateCustomerKey(tenantId, customerId);
    const keyBuffer = Buffer.from(rawKeyBase64, 'base64');

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);

    let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
    ciphertext += cipher.final('base64');

    const tag = cipher.getAuthTag().toString('base64');

    return {
      ciphertext,
      iv: iv.toString('base64'),
      tag,
      algorithm: 'AES-256-GCM',
      customerId,
      encryptedAt: Date.now(),
    };
  }

  /**
   * Déchiffre un champ sensible après validation d'intégrité (GCM Auth Tag).
   */
  static async decryptSensitiveField(
    payload: EncryptedPayload,
    tenantId: string,
    customerId: string
  ): Promise<string> {
    const keyPath = `tenants/${tenantId}/customerKeys/${customerId}`;
    const keyRecord = await Nexus.adapter.get<CustomerKeyRecord>(keyPath);

    if (!keyRecord || keyRecord.status === 'SHREDDED') {
      throw new Error(`CRYPTO_KEY_SHREDDED: Données inaccessibles. La clé a été définitivement purgée.`);
    }

    const keyBuffer = Buffer.from(keyRecord.rawKeyBase64, 'base64');
    const iv = Buffer.from(payload.iv, 'base64');
    const tag = Buffer.from(payload.tag, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(payload.ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * 💥 Crypto-Shredding (RGPD Art. 17 — Droit à l'effacement)
   * Détruit irrévocablement la clé de chiffrement du client.
   * Rapproche le coût d'oubli à zéro en rendant toutes les copies passées illisibles.
   */
  static async cryptoShredCustomer(tenantId: string, customerId: string, requestedBy: string): Promise<void> {
    const keyPath = `tenants/${tenantId}/customerKeys/${customerId}`;

    // Écraser la clé avec des zéros avant suppression
    await Nexus.adapter.set(keyPath, {
      customerId,
      tenantId,
      rawKeyBase64: 'PURGED_ZERO_KEY',
      status: 'SHREDDED',
      shreddedAt: Date.now(),
      shreddedBy: requestedBy,
    });

    empireAudit.log({
      module: 'compliance',
      action: 'CUSTOMER_DATA_CRYPTO_SHREDDED',
      details: { tenantId, customerId, requestedBy },
      severity: 'high',
      timestamp: new Date(),
    });

    logger.info(`[CryptoShredding] Clé client ${customerId} détruite irrévocablement pour le tenant ${tenantId}`);
  }
}
