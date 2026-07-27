/**
 * 🏷️ Branded Types - Restaurant OS
 * Ensures mathematical and fiscal integrity by preventing raw number manipulations.
 */

export type Brand<K, T> = K & { __brand: T };

/** Base Currency unit (Integer) */
export type Cents = Brand<number, 'Cents'>;

/** Weight or Volume (Float) */
export type Quantity = Brand<number, 'Quantity'>;

/** Tax or Discount rate (Float 0..1) */
export type Rate = Brand<number, 'Rate'>;

/** Stock Event Signature */
export type EventSignature = Brand<string, 'EventSignature'>;

/**
 * Type-safe conversion utilities
 */
export const toCents = (val: number): Cents => Math.round(val) as Cents;
export const toQuantity = (val: number): Quantity => val as Quantity;
export const toRate = (val: number): Rate => val as Rate;

/**
 * 🧮 Safe Math Operations for Branded Types
 */
export const SafeMath = {
  add: (a: Cents, b: Cents): Cents => (a + b) as Cents,
  sub: (a: Cents, b: Cents): Cents => (a - b) as Cents,
  multiply: (a: Cents, factor: number): Cents => Math.round(a * factor) as Cents,
  applyRate: (amount: Cents, rate: Rate): Cents => Math.round(amount * rate) as Cents
};
