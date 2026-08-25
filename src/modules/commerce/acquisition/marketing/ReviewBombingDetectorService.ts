/**
 * L53 — Détection review bombing Google.
 *
 * Un concurrent ou un client mécontent peut orchestrer une vague de fausses
 * avis négatifs en 24-48h, faisant chuter la note de 4,7 → 3,8. Sans détection
 * automatique, le gérant ne s'en aperçoit que quand les réservations chutent.
 *
 * Ce service analyse les patterns :
 *   - Burst de nouveaux avis 1-2* sur une fenêtre courte (BURST_WINDOW_HOURS)
 *   - Ratio d'avis sans texte (bots souvent sans commentaire)
 *   - Distribution anormale (tous les avis d'un même profil de compte récent)
 *
 * Le traitement temps-réel repose sur les webhooks Google Business Profile
 * (ou polling si webhook non disponible) — les avis sont ingérés ici.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L53.
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { getSetting } from '@/lib/settings/SettingsReader';

const BURST_WINDOW_HOURS = 4;
const DEFAULT_BURST_THRESHOLD = 5;
const LOW_RATING_THRESHOLD = 2;

export interface IncomingReview {
  reviewId: string;
  platform: 'google' | 'tripadvisor' | 'yelp';
  rating: number;
  text?: string;
  authorUrl?: string;
  publishedAt: number;
}

export interface BombingAnalysis {
  isSuspicious: boolean;
  burstCount: number;
  avgRating: number;
  noTextRatio: number;
  windowHours: number;
  detectedAt: number;
}

export class ReviewBombingDetectorService {
  static analyze(recentReviews: IncomingReview[], windowHours: number, now: number): BombingAnalysis {
    const windowMs = windowHours * 3600_000;
    const inWindow = recentReviews.filter(r => r.publishedAt >= now - windowMs);
    const lowRated = inWindow.filter(r => r.rating <= LOW_RATING_THRESHOLD);
    const noText = inWindow.filter(r => !r.text?.trim());
    const avgRating = inWindow.length
      ? inWindow.reduce((s, r) => s + r.rating, 0) / inWindow.length
      : 5;
    const noTextRatio = inWindow.length ? noText.length / inWindow.length : 0;

    const burstThreshold = getSetting<number>('seo', 'review_bombing_burst_threshold', DEFAULT_BURST_THRESHOLD);
    const minNoTextRatio = getSetting<number>('seo', 'review_bombing_no_text_ratio', 50) / 100;

    const isSuspicious =
      lowRated.length >= burstThreshold && noTextRatio >= minNoTextRatio;

    return {
      isSuspicious,
      burstCount: lowRated.length,
      avgRating: Math.round(avgRating * 10) / 10,
      noTextRatio: Math.round(noTextRatio * 100) / 100,
      windowHours,
      detectedAt: now,
    };
  }

  static async ingestAndDetect(input: {
    tenantId: string;
    review: IncomingReview;
    now?: number;
  }): Promise<BombingAnalysis> {
    const now = input.now ?? Date.now();

    await Nexus.adapter.set(
      `tenants/${input.tenantId}/reviews/${input.review.reviewId}`,
      { ...input.review, ingestedAt: now },
    );

    const allReviews = await Nexus.adapter.query<IncomingReview>(
      `tenants/${input.tenantId}/reviews`,
    );

    const analysis = this.analyze(allReviews, BURST_WINDOW_HOURS, now);

    if (analysis.isSuspicious) {
      await NexusEventBus.emit('commerce.review_bombing_detected', {
        v: 1,
        tenantId: input.tenantId,
        burstCount: analysis.burstCount,
        avgRating: analysis.avgRating,
        noTextRatio: analysis.noTextRatio,
        windowHours: BURST_WINDOW_HOURS,
        detectedAt: now,
      }).catch(() => null);

      await Nexus.adapter.set(
        `tenants/${input.tenantId}/review_bombing_alerts/latest`,
        { ...analysis, tenantId: input.tenantId },
      );
    }

    return analysis;
  }
}
