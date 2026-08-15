export type WeatherCondition = 'SUNNY' | 'CLOUDY' | 'RAINY' | 'STORM' | 'HEATWAVE';

export interface WeatherData {
  condition: WeatherCondition;
  temperatureCelsius: number;
  precipitationProbability: number; // 0.0 à 1.0
}

export interface CustomerBookingStats {
  totalBookings: number;
  noShowCount: number;
  cancellationCount: number;
  vipStatus?: boolean;
}

export interface ReservationRiskInput {
  partySize: number;
  hasDeposit: boolean;
  leadTimeHours: number; // Temps entre la réservation et le service
  isNocturnal: boolean;
}

export interface NoShowPrediction {
  probability: number; // 0.0 à 1.0
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  topRiskFactors: string[];
  recommendedAction: 'NORMAL' | 'SEND_SMS_CONFIRMATION' | 'REQUIRE_DEPOSIT' | 'ENABLE_OVERBOOKING';
}

export interface ServiceAttendanceForecast {
  bookedCovers: number;
  forecastedNoShowCovers: number;
  forecastedWalkInCovers: number;
  forecastedTotalCovers: number;
  terraceOpen: boolean;
  staffingRecommendation: {
    serversNeeded: number;
    cooksNeeded: number;
    advice: string;
  };
}

/**
 * 🔮 NoShowAndWeatherForecaster — Moteur Prédictif IA / ML
 * Scoring du risque de désistement client et prévision d'affluence conditionnée par la météo.
 */
export class NoShowAndWeatherForecaster {
  /**
   * Évalue le risque de No-Show d'une réservation.
   */
  static predictNoShowRisk(
    reservation: ReservationRiskInput,
    weather: WeatherData,
    customerStats?: CustomerBookingStats
  ): NoShowPrediction {
    let score = 0.10; // Risque de base standard restaurant (10%)
    const factors: string[] = [];

    // 1. Facteur Historique Client
    if (customerStats && customerStats.totalBookings > 0) {
      const historicalNoShowRate = customerStats.noShowCount / customerStats.totalBookings;
      if (historicalNoShowRate > 0.3) {
        score += 0.35;
        factors.push(`Historique client défavorable (${customerStats.noShowCount} No-Show passés)`);
      } else if (customerStats.vipStatus || historicalNoShowRate === 0) {
        score -= 0.08;
      }
    } else {
      score += 0.05;
      factors.push('Nouveau client sans historique');
    }

    // 2. Facteur Caution / Acompte (Facteur Réducteur Majeur)
    if (reservation.hasDeposit) {
      score -= 0.25;
    } else if (reservation.partySize >= 6) {
      score += 0.20;
      factors.push(`Grand groupe (${reservation.partySize}p) sans empreinte bancaire`);
    }

    // 3. Facteur Météo
    if (weather.condition === 'STORM' || (weather.condition === 'RAINY' && weather.precipitationProbability > 0.7)) {
      score += 0.18;
      factors.push(`Intempéries sévères (${weather.condition}, pluie ${(weather.precipitationProbability * 100).toFixed(0)}%)`);
    }

    // 4. Délai de réservation
    if (reservation.leadTimeHours > 72 && !reservation.hasDeposit) {
      score += 0.10;
      factors.push(`Réservation lointaine (${Math.round(reservation.leadTimeHours / 24)}j à l'avance)`);
    }

    // Clamp score entre 0.01 et 0.99
    const probability = Number(Math.max(0.01, Math.min(0.99, score)).toFixed(2));

    let riskLevel: NoShowPrediction['riskLevel'];
    let recommendedAction: NoShowPrediction['recommendedAction'];

    if (probability >= 0.60) {
      riskLevel = 'CRITICAL';
      recommendedAction = 'REQUIRE_DEPOSIT';
    } else if (probability >= 0.35) {
      riskLevel = 'HIGH';
      recommendedAction = 'SEND_SMS_CONFIRMATION';
    } else if (probability >= 0.20) {
      riskLevel = 'MEDIUM';
      recommendedAction = 'SEND_SMS_CONFIRMATION';
    } else {
      riskLevel = 'LOW';
      recommendedAction = 'NORMAL';
    }

    return {
      probability,
      riskLevel,
      topRiskFactors: factors,
      recommendedAction,
    };
  }

  /**
   * Prédit l'affluence globale d'un service (Couverts réservés - NoShow + Walk-in de passage)
   * et dimensionne le personnel en salle et en cuisine.
   */
  static forecastServiceAttendance(
    bookedCovers: number,
    weather: WeatherData,
    hasTerrace: boolean = true
  ): ServiceAttendanceForecast {
    const terraceOpen = hasTerrace && weather.condition !== 'RAINY' && weather.condition !== 'STORM' && weather.temperatureCelsius >= 18;

    // Facteur d'attraction des clients sans réservation (Walk-in) selon la météo
    let walkInMultiplier = 1.0;
    if (weather.condition === 'SUNNY' && terraceOpen) {
      walkInMultiplier = 1.6; // Boost terrasse ensoleillée
    } else if (weather.condition === 'RAINY' || weather.condition === 'STORM') {
      walkInMultiplier = 0.4; // Chute des passages spontanés
    }

    const baseWalkIn = Math.round(bookedCovers * 0.35);
    const forecastedWalkInCovers = Math.round(baseWalkIn * walkInMultiplier);

    // Taux moyen d'annulation / no-show global estimé
    const noShowRate = weather.condition === 'RAINY' ? 0.20 : 0.08;
    const forecastedNoShowCovers = Math.round(bookedCovers * noShowRate);

    const forecastedTotalCovers = Math.max(0, bookedCovers - forecastedNoShowCovers + forecastedWalkInCovers);

    // Ratio staff standard : 1 serveur pour 25 couverts, 1 cuisinier pour 30 couverts
    const serversNeeded = Math.max(1, Math.ceil(forecastedTotalCovers / 25));
    const cooksNeeded = Math.max(1, Math.ceil(forecastedTotalCovers / 30));

    let advice = 'Affluence nominale.';
    if (terraceOpen && weather.condition === 'SUNNY') {
      advice = 'Forte affluence terrasse prévue : prévoir 1 serveur d appoint extérieur.';
    } else if (weather.condition === 'RAINY') {
      advice = 'Pluie prévue : terrasse fermée, staff optimisé pour salle intérieure uniquement.';
    }

    return {
      bookedCovers,
      forecastedNoShowCovers,
      forecastedWalkInCovers,
      forecastedTotalCovers,
      terraceOpen,
      staffingRecommendation: {
        serversNeeded,
        cooksNeeded,
        advice,
      },
    };
  }
}
