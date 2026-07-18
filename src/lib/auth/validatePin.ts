/**
 * Central PIN validation utility.
 * All PIN entry points (TenantSeeder, MigrationService, staffImporter, UI forms)
 * must go through this function.
 */

/** PINs that are trivially guessable and must never be accepted. */
const BLACKLISTED = new Set([
  '0000', '1234', '1111', '0001', '9999', '1212',
  '1122', '2222', '3333', '4444', '5555', '6666',
  '7777', '8888', '1000', '0123',
]);

export interface PinValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validates a 4-digit PIN.
 * Returns `{ valid: true }` on success, `{ valid: false, reason }` on failure.
 */
export function validatePin(pin: string): PinValidationResult {
  if (!/^\d{4}$/.test(pin)) {
    return { valid: false, reason: 'PIN doit être exactement 4 chiffres' };
  }
  if (BLACKLISTED.has(pin)) {
    return { valid: false, reason: 'PIN trop simple — choisissez un code moins prévisible' };
  }
  return { valid: true };
}
