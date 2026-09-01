import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface FermentationBatchLog {
  tenantId: string;
  batchId: string;
  recipeName: string;
  type: 'kombucha' | 'kefir' | 'house_syrup' | 'shrub';
  startedAt: number;
  currentBrix: number;
  targetBrix: number;
  currentPh: number;
  minSafePh: number; // ex: 2.5
  maxSafePh: number; // ex: 4.2
  hoursSinceLastDegas: number;
  maxDegasIntervalHours: number; // ex: 24h
}

export interface FermentationStatusReport {
  batchId: string;
  isBrixTargetReached: boolean;
  isPhSafe: boolean;
  isDegasRequired: boolean;
  isCriticalOverpressure: boolean;
  recommendation: string;
  recordedAt: number;
}

/**
 * FermentationMonitorService — Angle mort L19.
 * Contrôle la fermentation bar (kombucha, kéfir, shrubs, sirops) : suivi °Brix, acidité pH et alerte de surpression/dégazage.
 */
export class FermentationMonitorService {
  static evaluateBatch(batch: FermentationBatchLog): FermentationStatusReport {
    const isBrixTargetReached = Math.abs(batch.currentBrix - batch.targetBrix) <= 0.5;
    const isPhSafe = batch.currentPh >= batch.minSafePh && batch.currentPh <= batch.maxSafePh;
    const isDegasRequired = batch.hoursSinceLastDegas >= batch.maxDegasIntervalHours;
    const isCriticalOverpressure = batch.hoursSinceLastDegas >= batch.maxDegasIntervalHours * 1.5;

    let recommendation = 'Fermentation normale en cours.';
    let pressureStatus: 'normal' | 'degas_required' | 'critical_overpressure' = 'normal';

    if (isCriticalOverpressure) {
      recommendation = 'DANGER SURPRESSION : Dégazer immédiatement le bocal/fût.';
      pressureStatus = 'critical_overpressure';
    } else if (isDegasRequired) {
      recommendation = 'Dégazage programmé nécessaire.';
      pressureStatus = 'degas_required';
    } else if (isBrixTargetReached) {
      recommendation = 'Taux de sucre cible atteint : Pasteuriser ou stocker à +2°C.';
    }

    if (pressureStatus !== 'normal') {
      NexusEventBus.emit('bar.fermentation_alert', {
        v: 1,
        tenantId: batch.tenantId,
        batchId: batch.batchId,
        recipeName: batch.recipeName,
        brixLevel: batch.currentBrix,
        pressureStatus,
        alertedAt: Date.now(),
      });
    }

    return {
      batchId: batch.batchId,
      isBrixTargetReached,
      isPhSafe,
      isDegasRequired,
      isCriticalOverpressure,
      recommendation,
      recordedAt: Date.now(),
    };
  }
}
