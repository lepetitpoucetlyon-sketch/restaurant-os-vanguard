import { describe, it, expect } from 'vitest';
import {
  NoShowAndWeatherForecaster,
  type WeatherData,
  type CustomerBookingStats,
  type ReservationRiskInput,
} from '@/modules/intelligence/forecasting/NoShowAndWeatherForecaster';

describe('Intelligence & Forecasting : Moteur ML Prédiction No-Show & Météo', () => {

  it('devrait classer en risque CRITICAL un grand groupe sans caution avec mauvais historique par temps d orage', () => {
    const reservation: ReservationRiskInput = {
      partySize: 8,
      hasDeposit: false,
      leadTimeHours: 96,
      isNocturnal: true,
    };

    const weather: WeatherData = {
      condition: 'STORM',
      temperatureCelsius: 14,
      precipitationProbability: 0.9,
    };

    const stats: CustomerBookingStats = {
      totalBookings: 3,
      noShowCount: 2,
      cancellationCount: 0,
    };

    const prediction = NoShowAndWeatherForecaster.predictNoShowRisk(reservation, weather, stats);

    expect(prediction.probability).toBeGreaterThanOrEqual(0.60);
    expect(prediction.riskLevel).toBe('CRITICAL');
    expect(prediction.recommendedAction).toBe('REQUIRE_DEPOSIT');
    expect(prediction.topRiskFactors.length).toBeGreaterThanOrEqual(3);
  });

  it('devrait classer en risque LOW un client VIP avec caution par temps ensoleillé', () => {
    const reservation: ReservationRiskInput = {
      partySize: 4,
      hasDeposit: true,
      leadTimeHours: 24,
      isNocturnal: false,
    };

    const weather: WeatherData = {
      condition: 'SUNNY',
      temperatureCelsius: 24,
      precipitationProbability: 0.0,
    };

    const stats: CustomerBookingStats = {
      totalBookings: 15,
      noShowCount: 0,
      cancellationCount: 1,
      vipStatus: true,
    };

    const prediction = NoShowAndWeatherForecaster.predictNoShowRisk(reservation, weather, stats);

    expect(prediction.probability).toBeLessThanOrEqual(0.15);
    expect(prediction.riskLevel).toBe('LOW');
    expect(prediction.recommendedAction).toBe('NORMAL');
  });

  it('devrait calculer le dimensionnement staff et l ouverture de terrasse selon la météo', () => {
    const sunnyWeather: WeatherData = {
      condition: 'SUNNY',
      temperatureCelsius: 26,
      precipitationProbability: 0.05,
    };

    const forecast = NoShowAndWeatherForecaster.forecastServiceAttendance(80, sunnyWeather, true);

    expect(forecast.terraceOpen).toBe(true);
    expect(forecast.forecastedWalkInCovers).toBeGreaterThan(30);
    expect(forecast.staffingRecommendation.serversNeeded).toBeGreaterThanOrEqual(4);
    expect(forecast.staffingRecommendation.cooksNeeded).toBeGreaterThanOrEqual(3);
  });
});
