import type { FECEntry, FECImportResult } from "@/modules/finance";

export type PanelState =
  | { phase: "idle" }
  | { phase: "ready"; file: File; preview: FECEntry[]; warnings: string[]; isValid: boolean }
  | { phase: "importing"; progress: number }
  | { phase: "done"; result: FECImportResult; fileName: string; exercice: string }
  | { phase: "error"; message: string };

export const CURRENT_YEAR = new Date().getFullYear();

export function formatMicrounits(mu: number): string {
  return `${(mu / 1_000_000).toFixed(2)} €`;
}

export function formatFECDate(raw: string): string {
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(6, 8)}/${raw.slice(4, 6)}/${raw.slice(0, 4)}`;
  }
  return raw;
}
