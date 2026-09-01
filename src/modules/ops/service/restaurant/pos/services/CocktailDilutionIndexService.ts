export type IceType = 'clear_ice_sphere' | 'clear_ice_block' | 'cube_standard' | 'crushed_ice';
export type CocktailTechnique = 'shaken' | 'stirred' | 'built_on_ice' | 'thrown';

export interface CocktailRecipeSpec {
  recipeName: string;
  liquidVolumeCl: number;
  alcoholVolumePct: number;
  iceType: IceType;
  technique: CocktailTechnique;
  durationSeconds: number;
}

export interface DilutionAnalysisResult {
  recipeName: string;
  initialVolumeCl: number;
  dilutionPct: number;
  waterAddedCl: number;
  finalServingVolumeCl: number;
  finalAbvPct: number;
  servingTemperatureCelsius: number;
}

/**
 * CocktailDilutionIndexService — Angle mort L20.
 * Calcule l'indice de dilution hydro-thermique et la chute d'ABV selon le type de glace et la technique de mixologie.
 */
export class CocktailDilutionIndexService {
  /**
   * Facteur de fonte en % par seconde selon le type de glace et la technique.
   */
  static computeDilution(spec: CocktailRecipeSpec): DilutionAnalysisResult {
    let baseRatePerSecond = 0.8; // standard shaken cube

    if (spec.iceType === 'clear_ice_block' || spec.iceType === 'clear_ice_sphere') {
      baseRatePerSecond *= 0.45; // Clear ice melts ~55% slower
    } else if (spec.iceType === 'crushed_ice') {
      baseRatePerSecond *= 1.8; // Crushed ice melts rapidly
    }

    if (spec.technique === 'stirred') {
      baseRatePerSecond *= 0.7;
    } else if (spec.technique === 'built_on_ice') {
      baseRatePerSecond *= 0.3;
    }

    const dilutionPct = Math.min(45, Math.round(baseRatePerSecond * spec.durationSeconds * 10) / 10);
    const waterAddedCl = Math.round((spec.liquidVolumeCl * (dilutionPct / 100)) * 100) / 100;
    const finalServingVolumeCl = Math.round((spec.liquidVolumeCl + waterAddedCl) * 100) / 100;

    // Final ABV = Initial ABV * (Initial Vol / Final Vol)
    const finalAbvPct = Math.round((spec.alcoholVolumePct * (spec.liquidVolumeCl / finalServingVolumeCl)) * 10) / 10;
    const servingTemperatureCelsius = spec.technique === 'shaken' ? -2.5 : spec.technique === 'stirred' ? 1.0 : 4.0;

    return {
      recipeName: spec.recipeName,
      initialVolumeCl: spec.liquidVolumeCl,
      dilutionPct,
      waterAddedCl,
      finalServingVolumeCl,
      finalAbvPct,
      servingTemperatureCelsius,
    };
  }
}
