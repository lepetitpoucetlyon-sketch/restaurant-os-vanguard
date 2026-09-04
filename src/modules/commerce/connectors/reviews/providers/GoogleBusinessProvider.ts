import type { IReviewProvider, Review } from '../types';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";
import { fetchWithTimeout } from '@/lib/http/resilientFetch';

/**
 * Google Business Profile — My Business API v4.
 * Variables requises : GOOGLE_BUSINESS_CLIENT_ID, GOOGLE_BUSINESS_CLIENT_SECRET
 * OAuth par tenant : token stocké dans tenants/{id}/connectors/reviews/google_token
 *
 * Doc : https://developers.google.com/my-business/reference/rest/v4
 */
export class GoogleBusinessProvider implements IReviewProvider {
    readonly id = 'google';

    private async getAccessToken(tenantId: string): Promise<string> {
        const { Nexus } = await import('@/lib/nexus/NexusAdapter');
        const stored = await Nexus.adapter.get(`tenants/${tenantId}/connectors/reviews/google_token`) as { access_token: string; refresh_token: string; expires_at: number } | null;
        if (!stored) throw new Error('Google Business non connecté pour ce tenant — OAuth requis');

        // Refresh si expiré
        if (Date.now() > (stored.expires_at ?? 0)) {
            const clientId     = process.env.GOOGLE_BUSINESS_CLIENT_ID;
            const clientSecret = process.env.GOOGLE_BUSINESS_CLIENT_SECRET;
            const res = await fetchWithTimeout('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type:    'refresh_token',
                    client_id:     clientId ?? '',
                    client_secret: clientSecret ?? '',
                    refresh_token: stored.refresh_token,
                }),
            });
            if (!res.ok) throw new Error(`Google token refresh → ${res.status}`);
            const refreshed = await res.json() as { access_token: string; expires_in: number };
            await Nexus.adapter.set(`tenants/${tenantId}/connectors/reviews/google_token`, {
                ...stored,
                access_token: refreshed.access_token,
                expires_at: Date.now() + (refreshed.expires_in - 60) * 1000,
            });
            return refreshed.access_token;
        }

        return stored.access_token;
    }

    async fetchRecent(tenantId: string, since: Date): Promise<Review[]> {
        try {
            const token   = await this.getAccessToken(tenantId);
            const account = process.env.GOOGLE_BUSINESS_ACCOUNT_ID ?? '';
            const location = process.env.GOOGLE_BUSINESS_LOCATION_ID ?? '';
            const res = await fetchWithTimeout(
                `https://mybusiness.googleapis.com/v4/accounts/${account}/locations/${location}/reviews`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error(`Google reviews → ${res.status}`);
            const data = await res.json() as { reviews?: unknown[] };
            return (data.reviews ?? [])
                .map(r => this.normalize(tenantId, r))
                .filter(r => new Date(r.date) >= since);
        } catch (err) {
            logger.error('[GoogleBusinessProvider] fetchRecent error', toError(err).message);
            return [];
        }
    }

    async postReply(reviewId: string, text: string): Promise<void> {
        logger.info('[GoogleBusinessProvider] postReply', reviewId, text.slice(0, 50));
        // PUT .../reviews/{reviewId}/reply avec { comment: text }
    }

    async getAverageScore(tenantId: string): Promise<number> {
        const reviews = await this.fetchRecent(tenantId, new Date(Date.now() - 90 * 86400 * 1000));
        if (!reviews.length) return 0;
        return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    }

    private normalize(tenantId: string, raw: unknown): Review {
        const r = raw as Record<string, unknown>;
        return {
            id:          `google_${r['reviewId']}`,
            tenantId,
            source:      'google',
            externalId:  String(r['reviewId'] ?? ''),
            authorName:  String((r['reviewer'] as Record<string, unknown>)?.['displayName'] ?? 'Anonyme'),
            rating:      ({ ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 } as Record<string, number>)[String(r['starRating'])] ?? 0,
            text:        r['comment'] ? String(r['comment']) : undefined,
            date:        String(r['createTime'] ?? new Date().toISOString()),
            replyText:   r['reviewReply'] ? String((r['reviewReply'] as Record<string, unknown>)?.['comment'] ?? '') : undefined,
            url:         `https://www.google.com/maps/reviews/${r['reviewId']}`,
        };
    }
}
