/**
 * 🔮 MarketOracle — MCC Global Intelligence Engine
 * Grade X Intelligence Layer
 *
 * Aggregates Sanitized Pulses from all Vassals into a cross-fleet
 * Knowledge Graph for market intelligence and data monetization.
 *
 * Enforces k-Anonymity (k ≥ 5) — no insight is published if it
 * can be traced back to fewer than 5 distinct sources.
 *
 * This module runs ONLY at the MCC (Suzerain) level.
 * Vassals never have access to this code in production.
 *
 * Copyright © 2026 Mohammed-ali Boudjaadar. Tous droits réservés.
 */

import { logger } from '@/lib/logger';

import type {
    SanitizedPulse,
    PulseCategory,
    MarketInsight,
    MonetizationTier,
} from '../../knowledge/rag/types';

import { K_ANONYMITY_THRESHOLD } from '../../knowledge/rag/types';

// ============================================
// MARKET ORACLE
// ============================================

export class MarketOracle {
    /** All received pulses, keyed by category */
    private pulseStore: Map<PulseCategory, SanitizedPulse[]> = new Map();

    /** Generated insights */
    private insights: MarketInsight[] = [];

    /** Distinct source hashes (for k-anonymity tracking) */
    private knownSources: Set<string> = new Set();

    constructor() {
        logger.info('[MarketOracle] Initialized — Awaiting Sanitized Pulses from Fleet');
    }

    // ============================================
    // PULSE INGESTION
    // ============================================

    /**
     * 📡 Receives a Sanitized Pulse from a Vassal via the Nexus Bridge.
     */
    ingestPulse(pulse: SanitizedPulse): { accepted: boolean; reason?: string } {
        // 1. Validate integrity
        if (!pulse.pulseId || !pulse.sourceHash || !pulse.category) {
            return { accepted: false, reason: 'MALFORMED_PULSE: Missing required fields' };
        }

        // 2. Deduplication — reject duplicate pulseIds
        const existing = this.pulseStore.get(pulse.category) ?? [];
        if (existing.some(p => p.pulseId === pulse.pulseId)) {
            return { accepted: false, reason: 'DUPLICATE_PULSE: Already ingested' };
        }

        // 3. Store
        this.pulseStore.set(pulse.category, [...existing, pulse]);
        this.knownSources.add(pulse.sourceHash);

        logger.info(
            `[MarketOracle] Pulse ingested: ${pulse.pulseId} [${pulse.category}] ` +
            `(Fleet size: ${this.knownSources.size})`
        );

        return { accepted: true };
    }

    // ============================================
    // INSIGHT GENERATION
    // ============================================

    /**
     * 🧠 Generates market insights from the accumulated pulses.
     * Respects k-Anonymity at every step.
     */
    generateInsights(): MarketInsight[] {
        this.insights = [];

        // Generate insights per category
        this.generatePriceInsights();
        this.generatePerformanceInsights();
        this.generateLaborInsights();
        this.generateWasteInsights();
        this.generateRevenueInsights();

        // Filter by k-Anonymity
        const publishable = this.insights.filter(i => i.isPublishable);

        logger.info(
            `[MarketOracle] Generated ${this.insights.length} insights, ` +
            `${publishable.length} publishable (k ≥ ${K_ANONYMITY_THRESHOLD})`
        );

        return publishable;
    }

    /**
     * 📊 Returns insights filtered by tier access.
     */
    getInsightsByTier(tier: MonetizationTier): MarketInsight[] {
        const tierOrder: Record<MonetizationTier, number> = {
            TIER_1: 1,
            TIER_2: 2,
            TIER_3: 3,
        };

        const tierNum = tierOrder[tier];

        return this.insights.filter(i => {
            if (!i.isPublishable) return false;
            const insightTierNum = tierOrder[i.availableTier === 'INTERNAL_ONLY' ? 'TIER_3' : i.availableTier];
            return insightTierNum <= tierNum;
        });
    }

    // ============================================
    // FLEET STATISTICS
    // ============================================

    getFleetSize(): number {
        return this.knownSources.size;
    }

    getPulseCount(category?: PulseCategory): number {
        if (category) {
            return this.pulseStore.get(category)?.length ?? 0;
        }
        let total = 0;
        for (const pulses of this.pulseStore.values()) {
            total += pulses.length;
        }
        return total;
    }

    isKAnonymityMet(): boolean {
        return this.knownSources.size >= K_ANONYMITY_THRESHOLD;
    }

    // ============================================
    // PRIVATE — Insight Generators
    // ============================================

    private generatePriceInsights(): void {
        const pulses = this.pulseStore.get('MARKET_PRICE') ?? [];
        if (pulses.length === 0) return;

        // Group by region
        const byRegion = this.groupByRegion(pulses);

        for (const [region, regionPulses] of byRegion.entries()) {
            const distinctSources = new Set(regionPulses.map(p => p.sourceHash));
            const sourceCount = distinctSources.size;

            // Extract price trends
            const allTrends = regionPulses.flatMap(p =>
                Object.entries(p.payload.trends).map(([key, trend]) => ({
                    product: key,
                    ...trend,
                }))
            );

            // Aggregate trend direction
            const avgMagnitude = allTrends.length > 0
                ? allTrends.reduce((s, t) => s + t.magnitudePercent, 0) / allTrends.length
                : 0;

            const direction = avgMagnitude > 2 ? 'hausse' : avgMagnitude < -2 ? 'baisse' : 'stable';

            this.insights.push({
                id: `price_${region}_${Date.now()}`,
                type: 'price_trend',
                title: `Tendance prix fournisseurs — ${region}`,
                description:
                    `Les prix fournisseurs en ${region} sont en ${direction} ` +
                    `(${avgMagnitude > 0 ? '+' : ''}${avgMagnitude.toFixed(1)}% en moyenne).`,
                sourceCount,
                isPublishable: sourceCount >= K_ANONYMITY_THRESHOLD,
                confidence: Math.min(0.95, 0.5 + (sourceCount * 0.05)),
                regions: [region],
                businessTypes: [...new Set(regionPulses.map(p => p.context.businessType))],
                availableTier: sourceCount >= 10 ? 'TIER_3' : 'TIER_2',
                generatedAt: new Date().toISOString(),
            });
        }
    }

    private generatePerformanceInsights(): void {
        const pulses = this.pulseStore.get('CATALOG_PERFORMANCE') ?? [];
        if (pulses.length === 0) return;

        const byCuisine = this.groupByBusinessType(pulses);

        for (const [cuisine, cuisinePulses] of byCuisine.entries()) {
            const distinctSources = new Set(cuisinePulses.map(p => p.sourceHash));
            const sourceCount = distinctSources.size;

            // Aggregate performance metrics
            const avgMetrics: Record<string, number> = {};
            let _metricCount = 0;

            for (const pulse of cuisinePulses) {
                for (const [key, value] of Object.entries(pulse.payload.metrics)) {
                    avgMetrics[key] = (avgMetrics[key] ?? 0) + value;
                    _metricCount++;
                }
            }

            // Average out
            for (const key of Object.keys(avgMetrics)) {
                avgMetrics[key] = avgMetrics[key] / cuisinePulses.length;
            }

            this.insights.push({
                id: `perf_${cuisine}_${Date.now()}`,
                type: 'benchmark',
                title: `Benchmark performance — ${cuisine}`,
                description:
                    `Performance moyenne des établissements ${cuisine}: ` +
                    `${Object.entries(avgMetrics).slice(0, 3).map(([k, v]) => `${k}: ${v.toFixed(1)}`).join(', ')}`,
                sourceCount,
                isPublishable: sourceCount >= K_ANONYMITY_THRESHOLD,
                confidence: Math.min(0.90, 0.4 + (sourceCount * 0.05)),
                regions: [...new Set(cuisinePulses.map(p => p.context.region))],
                businessTypes: [cuisine],
                availableTier: 'TIER_2',
                generatedAt: new Date().toISOString(),
            });
        }
    }

    private generateLaborInsights(): void {
        const pulses = this.pulseStore.get('LABOR_PATTERN') ?? [];
        if (pulses.length === 0) return;

        const byRegion = this.groupByRegion(pulses);

        for (const [region, regionPulses] of byRegion.entries()) {
            const distinctSources = new Set(regionPulses.map(p => p.sourceHash));
            const sourceCount = distinctSources.size;

            this.insights.push({
                id: `labor_${region}_${Date.now()}`,
                type: 'benchmark',
                title: `Index staffing — ${region}`,
                description:
                    `Analyse des patterns de staffing sur ${sourceCount} établissements en ${region}.`,
                sourceCount,
                isPublishable: sourceCount >= K_ANONYMITY_THRESHOLD,
                confidence: Math.min(0.85, 0.3 + (sourceCount * 0.05)),
                regions: [region],
                businessTypes: [...new Set(regionPulses.map(p => p.context.businessType))],
                availableTier: 'TIER_2',
                generatedAt: new Date().toISOString(),
            });
        }
    }

    private generateWasteInsights(): void {
        const pulses = this.pulseStore.get('WASTE_TREND') ?? [];
        if (pulses.length === 0) return;

        const distinctSources = new Set(pulses.map(p => p.sourceHash));
        const sourceCount = distinctSources.size;

        // Aggregate waste trends
        const trendSummary = pulses.flatMap(p =>
            Object.entries(p.payload.trends).map(([category, trend]) => ({
                category,
                direction: trend.direction,
                magnitude: trend.magnitudePercent,
            }))
        );

        const avgWaste = trendSummary.length > 0
            ? trendSummary.reduce((s, t) => s + t.magnitude, 0) / trendSummary.length
            : 0;

        this.insights.push({
            id: `waste_global_${Date.now()}`,
            type: avgWaste > 5 ? 'risk' : 'benchmark',
            title: 'Tendance gaspillage — Flotte globale',
            description:
                `Le gaspillage moyen ${avgWaste > 0 ? 'augmente' : 'diminue'} de ${Math.abs(avgWaste).toFixed(1)}% ` +
                `sur l'ensemble de la flotte (${sourceCount} établissements).`,
            sourceCount,
            isPublishable: sourceCount >= K_ANONYMITY_THRESHOLD,
            confidence: Math.min(0.80, 0.3 + (sourceCount * 0.04)),
            regions: [...new Set(pulses.map(p => p.context.region))],
            businessTypes: [...new Set(pulses.map(p => p.context.businessType))],
            availableTier: 'TIER_3',
            generatedAt: new Date().toISOString(),
        });
    }

    private generateRevenueInsights(): void {
        const pulses = this.pulseStore.get('REVENUE_BAND') ?? [];
        if (pulses.length === 0) return;

        const bySize = new Map<string, SanitizedPulse[]>();
        for (const p of pulses) {
            const band = p.context.sizeBand;
            bySize.set(band, [...(bySize.get(band) ?? []), p]);
        }

        for (const [sizeBand, bandPulses] of bySize.entries()) {
            const distinctSources = new Set(bandPulses.map(p => p.sourceHash));
            const sourceCount = distinctSources.size;

            this.insights.push({
                id: `revenue_${sizeBand}_${Date.now()}`,
                type: 'benchmark',
                title: `Benchmark CA — Établissements ${sizeBand}`,
                description:
                    `Benchmarking du chiffre d'affaires pour les établissements de taille "${sizeBand}" ` +
                    `basé sur ${sourceCount} sources anonymes.`,
                sourceCount,
                isPublishable: sourceCount >= K_ANONYMITY_THRESHOLD,
                confidence: Math.min(0.85, 0.4 + (sourceCount * 0.05)),
                regions: [...new Set(bandPulses.map(p => p.context.region))],
                businessTypes: [...new Set(bandPulses.map(p => p.context.businessType))],
                availableTier: 'TIER_2',
                generatedAt: new Date().toISOString(),
            });
        }
    }

    // ============================================
    // PRIVATE — Grouping Helpers
    // ============================================

    private groupByRegion(pulses: SanitizedPulse[]): Map<string, SanitizedPulse[]> {
        const map = new Map<string, SanitizedPulse[]>();
        for (const p of pulses) {
            const region = p.context.region;
            map.set(region, [...(map.get(region) ?? []), p]);
        }
        return map;
    }

    private groupByBusinessType(pulses: SanitizedPulse[]): Map<string, SanitizedPulse[]> {
        const map = new Map<string, SanitizedPulse[]>();
        for (const p of pulses) {
            const cuisine = p.context.businessType;
            map.set(cuisine, [...(map.get(cuisine) ?? []), p]);
        }
        return map;
    }
}
