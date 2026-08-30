/**
 * FISCAL_CONSTANTS — constantes NF525 partagées entre FiscalEngine et FiscalSealer.
 * Isolé pour rompre le cycle bidirectionnel FiscalEngine ↔ FiscalSealer.
 */
export const FISCAL_CONSTANTS = {
  GENESIS_ROOT: 'GENESIS_ROOT_0000000000000000',
  TRAINING_MODE_HASH: 'TRAINING_MODE_UNSIGNED_HASH',
  SIGNATURE_PREFIX: 'EMP_NF525_',
} as const;
