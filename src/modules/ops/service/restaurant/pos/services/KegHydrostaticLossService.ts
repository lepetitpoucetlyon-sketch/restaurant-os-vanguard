export interface KegLossCalculationRequest {
  kegCapacityLiters: number; // ex: 30L ou 50L
  lossCoefficientPct?: number; // Défaut: 9.5% (mousse au changement de fût, résidu fond de fût, purge ligne)
  glassVolumeCl: 25 | 33 | 50; // Demi 25cl, Galopin 33cl, Pinte 50cl
}

export interface KegLossCalculationResult {
  nominalVolumeLiters: number;
  usableVolumeLiters: number;
  lossVolumeLiters: number;
  lossCoefficientPct: number;
  theoreticalGlassesCount: number;
  usableGlassesCount: number;
  lossGlassesCount: number;
}

/**
 * KegHydrostaticLossService — Angle mort L17.
 * Calcule la freinte hydrostatique réelle des fûts de bière (8 à 12%) pour calibrer le rendement réel et éviter les fausses suspicions de vol.
 */
export class KegHydrostaticLossService {
  public static readonly DEFAULT_LOSS_COEFFICIENT_PCT = 9.5;

  static computeKegYield(req: KegLossCalculationRequest): KegLossCalculationResult {
    const coeffPct = req.lossCoefficientPct ?? this.DEFAULT_LOSS_COEFFICIENT_PCT;
    if (coeffPct < 0 || coeffPct > 30) {
      throw new Error('[KEG-LOSS] Loss coefficient must be between 0% and 30%');
    }

    const lossVolumeLiters = Math.round((req.kegCapacityLiters * (coeffPct / 100)) * 100) / 100;
    const usableVolumeLiters = Math.round((req.kegCapacityLiters - lossVolumeLiters) * 100) / 100;

    const glassLiters = req.glassVolumeCl / 100;
    const theoreticalGlassesCount = Math.floor(req.kegCapacityLiters / glassLiters);
    const usableGlassesCount = Math.floor(usableVolumeLiters / glassLiters);
    const lossGlassesCount = theoreticalGlassesCount - usableGlassesCount;

    return {
      nominalVolumeLiters: req.kegCapacityLiters,
      usableVolumeLiters,
      lossVolumeLiters,
      lossCoefficientPct: coeffPct,
      theoreticalGlassesCount,
      usableGlassesCount,
      lossGlassesCount,
    };
  }
}
