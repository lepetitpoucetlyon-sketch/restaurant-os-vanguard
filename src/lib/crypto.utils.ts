/**
 * 🔐 Crypto Utils - Restaurant OS
 * Pure cryptographic functions for NF525 compliance and master signatures.
 * Optimized for low-end mobile (Phase 5: IRM Surgery).
 */

export const ALGORITHM = 'SHA-256';

const HEX_LOOKUP: string[] = [];
for (let i = 0; i < 256; i++) {
  HEX_LOOKUP[i] = i.toString(16).padStart(2, '0');
}

/**
 * High-performance hexadecimal conversion using a lookup table and buffer loop.
 * Reduces GC pressure by avoiding Array.from and map().
 */
function toHexString(buffer: ArrayBuffer, uppercase: boolean = false): string {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  const len = bytes.length;
  for (let i = 0; i < len; i++) {
    hex += HEX_LOOKUP[bytes[i]];
  }
  return uppercase ? hex.toUpperCase() : hex;
}

/**
 * Deterministic JSON Stringification.
 */
export const canonicalStringify = (obj: any): string => {
  const allKeys: string[] = [];
  JSON.stringify(obj, (key, value) => {
    allKeys.push(key);
    return value;
  });
  allKeys.sort();
  return JSON.stringify(obj, allKeys);
};

/**
 * Generates a SHA-256 hash. (Optimized Hex output)
 */
export async function generateSHA256(data: string, previousHash: string = ''): Promise<string> {
  const dataToHash = data + previousHash;
  const msgUint8 = new TextEncoder().encode(dataToHash);
  const hashBuffer = await crypto.subtle.digest(ALGORITHM, msgUint8);
  return toHexString(hashBuffer);
}

/**
 * Digital Signature. (Optimized Hex output)
 */
export async function signData(hash: string, secret: string): Promise<string> {
  const signatureBase = `EMP_NF525_${secret}:${hash}`;
  const msgUint8 = new TextEncoder().encode(signatureBase);
  const signatureBuffer = await crypto.subtle.digest(ALGORITHM, msgUint8);
  return toHexString(signatureBuffer, true).substring(0, 32);
}
