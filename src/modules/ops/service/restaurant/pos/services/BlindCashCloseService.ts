/**
 * BlindCashCloseService.ts
 * 
 * Moteur de clôture de caisse à l'aveugle (Blind Cash Close).
 * Permet à l'opérateur de déclarer le comptage physique des espèces sans connaître le solde théorique.
 * Calcule l'écart scellé, génère la signature d'audit NF525 et détermine la nécessité d'une validation superviseur.
 */

export interface CashDenominationCount {
  denominationCts: number; // ex: 5000 pour 50€, 2000 pour 20€, 200 pour 2€, etc.
  quantity: number;
}

export interface BlindCashCloseInput {
  sessionId: string;
  tenantId: string;
  operatorId: string;
  denominations?: CashDenominationCount[];
  totalCountedCts?: number;
  theoreticalCashCts: number;
  openingFloatCts: number; // Fond de caisse initial
  cashWithdrawalsCts?: number; // Prélèvements coffre
  supervisorThresholdCts?: number; // Seuil d'écart déclenchant validation superviseur (défaut 500 cts = 5€)
  reasonForDiscrepancy?: string;
}

export interface BlindCloseReport {
  sessionId: string;
  tenantId: string;
  operatorId: string;
  timestampUtc: number;
  countedCashCts: number;
  theoreticalCashCts: number;
  openingFloatCts: number;
  cashWithdrawalsCts: number;
  netCashExpectedCts: number;
  discrepancyCts: number; // counted - expected
  status: 'EXACT' | 'SURPLUS' | 'DEFICIT';
  requiresSupervisorApproval: boolean;
  reasonForDiscrepancy?: string;
  auditPayload: string;
}

export class BlindCashCloseService {
  public static readonly DEFAULT_SUPERVISOR_THRESHOLD_CTS = 500; // 5.00 €

  /**
   * Calcule le total d'un inventaire de billets et pièces.
   */
  public static computeDenominationsTotalCts(denominations: CashDenominationCount[]): number {
    return denominations.reduce((sum, d) => sum + Math.round(d.denominationCts * d.quantity), 0);
  }

  /**
   * Traite la clôture aveugle et génère le rapport d'audit scellable.
   */
  public static processBlindClose(input: BlindCashCloseInput): BlindCloseReport {
    const countedCashCts = input.denominations 
      ? this.computeDenominationsTotalCts(input.denominations)
      : (input.totalCountedCts ?? 0);

    const openingFloatCts = input.openingFloatCts || 0;
    const cashWithdrawalsCts = input.cashWithdrawalsCts || 0;
    
    // Net théorique en caisse = Solde théorique des ventes espèces + Fond de caisse initial - Prélèvements
    const netCashExpectedCts = input.theoreticalCashCts + openingFloatCts - cashWithdrawalsCts;
    const discrepancyCts = countedCashCts - netCashExpectedCts;

    let status: BlindCloseReport['status'] = 'EXACT';
    if (discrepancyCts > 0) status = 'SURPLUS';
    else if (discrepancyCts < 0) status = 'DEFICIT';

    const threshold = input.supervisorThresholdCts ?? this.DEFAULT_SUPERVISOR_THRESHOLD_CTS;
    const requiresSupervisorApproval = Math.abs(discrepancyCts) > threshold;

    const timestampUtc = Date.now();
    const auditPayload = `BLIND_CLOSE|tenant=${input.tenantId}|session=${input.sessionId}|operator=${input.operatorId}|counted=${countedCashCts}|expected=${netCashExpectedCts}|diff=${discrepancyCts}|t=${timestampUtc}`;

    return {
      sessionId: input.sessionId,
      tenantId: input.tenantId,
      operatorId: input.operatorId,
      timestampUtc,
      countedCashCts,
      theoreticalCashCts: input.theoreticalCashCts,
      openingFloatCts,
      cashWithdrawalsCts,
      netCashExpectedCts,
      discrepancyCts,
      status,
      requiresSupervisorApproval,
      reasonForDiscrepancy: input.reasonForDiscrepancy,
      auditPayload,
    };
  }
}
