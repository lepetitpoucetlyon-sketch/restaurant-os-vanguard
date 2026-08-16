export interface CashDrawerSession {
  id: string;
  openedAt: string;
  openingInMicrounits: number;
  closedAt?: string;
  closingInMicrounits?: number;
  collectedInMicrounits: number;
  changeGivenInMicrounits: number;
  userId: string;
}

export function parseEuros(raw: string): number {
  const normalized = raw.replace(",", ".").trim();
  const val = parseFloat(normalized);
  return isNaN(val) ? 0 : Math.max(0, val);
}

export function eurosToMicrounits(euros: number): number {
  return Math.round(euros * 1_000_000);
}

export function microunitsToEuros(mu: number): string {
  return (mu / 1_000_000).toFixed(2);
}
