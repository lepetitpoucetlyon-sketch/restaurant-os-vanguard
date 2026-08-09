/**
 * ZeltyImporter — minimal importer for Zelty POS CSV exports.
 *
 * Zelty ALWAYS exports prices in centimes (e.g. 1290 = 12,90 €).
 * This module provides a canonical price parser and a thin import helper.
 */

import { toMicrounits } from '@/shared/schemas/primitives';

/** Raw row from a Zelty CSV export. */
export interface ZeltyRow {
  /** Product name */
  name?: string;
  product_name?: string;
  /** Price in centimes (e.g. 1290 = 12,90 €) */
  price_cents?: string | number;
  price?: string | number;
  /** Category / family */
  category?: string;
  category_id?: string;
  [key: string]: string | number | undefined;
}

/**
 * Parses a Zelty price field (always centimes) and converts to microunits.
 *
 * Conversion chain: centimes → euros → microunits
 *   centimes × 10 000 = microunits
 *   (because 1 € = 1 000 000 µ and 1 centime = 0,01 € = 10 000 µ)
 *
 * @param raw - raw string or number value from the CSV (e.g. "1290", 1290)
 * @returns price in microunits (integer)
 */
export function parseZeltyPrice(raw: string | number | undefined): number {
  if (raw === undefined || raw === null || raw === '') return 0;
  const cleaned = String(raw)
    .replace(/\s/g, '')
    .replace(',', '.')
    .replace(/[^0-9.]/g, '');
  const centimes = parseFloat(cleaned) || 0;
  // centimes → microunits: multiply by 10 000
  return toMicrounits(Math.round(centimes * 10_000));
}

/** Finds the price field from a Zelty row (prefers explicit price_cents). */
function resolvePriceField(row: ZeltyRow): string | number | undefined {
  return row.price_cents ?? row.price;
}

/** Normalizes a raw Zelty row into a structured product record (in microunits). */
export function normalizeZeltyRow(row: ZeltyRow): {
  name: string;
  categoryId: string;
  priceInMicrounits: number;
} {
  return {
    name: String(row.product_name ?? row.name ?? '').trim(),
    categoryId: String(row.category_id ?? row.category ?? 'uncategorized').trim(),
    priceInMicrounits: parseZeltyPrice(resolvePriceField(row)),
  };
}
