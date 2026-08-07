import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm' as const;
const SALT = 'nexus-connector-v1';

function getKey(): Buffer {
  const raw = process.env.CONNECTOR_ENCRYPTION_KEY;
  if (!raw) throw new Error('[CredentialCipher] CONNECTOR_ENCRYPTION_KEY non défini dans les variables d\'environnement');
  return scryptSync(raw, SALT, 32);
}

/**
 * Chiffre un objet credentials en AES-256-GCM.
 * Format de sortie : "<iv_hex>:<tag_hex>:<ciphertext_hex>"
 * Rien de sensible n'est stocké en clair dans Nexus.
 */
export function encryptCredentials(plain: Record<string, string>): string {
  const iv = randomBytes(16);
  const key = getKey();
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const text = JSON.stringify(plain);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Déchiffre une chaîne produite par encryptCredentials.
 * Lance si la clé est mauvaise ou les données corrompues (fail-closed).
 */
export function decryptCredentials(encryptedStr: string): Record<string, string> {
  const parts = encryptedStr.split(':');
  if (parts.length !== 3) throw new Error('[CredentialCipher] Format invalide');
  const [ivHex, tagHex, dataHex] = parts;
  const key = getKey();
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  return JSON.parse(plain) as Record<string, string>;
}

/** Vérifie que tous les champs requis d'un manifest sont présents dans les credentials fournis. */
export function validateCredentialFields(
  credentials: Record<string, string>,
  requiredFields: { key: string; optional?: boolean }[],
): { valid: boolean; missing: string[] } {
  const missing = requiredFields
    .filter(f => !f.optional && !credentials[f.key])
    .map(f => f.key);
  return { valid: missing.length === 0, missing };
}
