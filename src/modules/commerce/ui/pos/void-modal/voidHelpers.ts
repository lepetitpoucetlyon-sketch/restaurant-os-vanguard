export type VoidMode = "void" | "refund";

export function parseEurosToMicrounits(raw: string): number {
    const val = parseFloat(raw.replace(",", ".").trim());
    return isNaN(val) ? 0 : Math.round(Math.max(0, val) * 1_000_000);
}
