import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface CleaningRinseCheck {
  zoneId: string;
  surfaceName: string; // ex: 'Planche découpe poisson', 'Trancheuse jambon'
  chemicalProductUsed: 'javel' | 'degraissant_alcalin' | 'acide_detartrant';
  rinseWaterTempCelsius: number;
  residualPh: number; // pH de surface mesuré par bandelette (doit être neutre: 6.5 - 7.5)
}

export interface RinseValidationReport {
  zoneId: string;
  isRinseComplete: boolean;
  residualChemicalHazard: boolean;
  status: 'conforme' | 'non_conforme_rincage_insuffisant';
  actionRequired?: string;
}

/**
 * CleaningRinseValidationService — Angle mort T29.
 * Contrôle sanitaire du rinçage post-désinfection : validation de l'absence de résidus chimiques toxiques (javel/détergents) en contact alimentaire via pH de surface.
 */
export class CleaningRinseValidationService {
  static validateRinse(tenantId: string, check: CleaningRinseCheck): RinseValidationReport {
    // Normal neutral rinse surface pH range: 6.0 - 8.0
    const isPhNeutral = check.residualPh >= 6.0 && check.residualPh <= 8.0;
    const isRinseComplete = isPhNeutral;

    if (!isRinseComplete) {
      NexusEventBus.emit('compliance.cleaning_rinse_validated', {
        v: 1,
        tenantId,
        zoneId: check.zoneId,
        residualPh: check.residualPh,
        isRinseComplete: false,
        validatedAt: Date.now(),
      });

      return {
        zoneId: check.zoneId,
        isRinseComplete: false,
        residualChemicalHazard: true,
        status: 'non_conforme_rincage_insuffisant',
        actionRequired: `DANGER RÉSIDU CHIMIQUE (pH ${check.residualPh}) : Rincer abondamment à l'eau claire à 60°C avant utilisation alimentaire.`,
      };
    }

    NexusEventBus.emit('compliance.cleaning_rinse_validated', {
      v: 1,
      tenantId,
      zoneId: check.zoneId,
      residualPh: check.residualPh,
      isRinseComplete: true,
      validatedAt: Date.now(),
    });

    return {
      zoneId: check.zoneId,
      isRinseComplete: true,
      residualChemicalHazard: false,
      status: 'conforme',
    };
  }
}
