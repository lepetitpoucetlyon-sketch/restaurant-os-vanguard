/**
 * Universal Type-Safe API Client — Restaurant OS (Grade X)
 *
 * Fournit une interface fortement typée pour toutes les routes API v1 et système.
 * Source de vérité : schémas Zod et spécification OpenAPI v1.
 */

import { z } from 'zod';
import { CreateOrderInputSchema } from '@/shared/schemas';

export interface ApiClientConfig {
    baseUrl?: string;
    getAuthToken?: () => Promise<string | null> | string | null;
}

export class ApiClient {
    private baseUrl: string;
    private getAuthToken?: () => Promise<string | null> | string | null;

    constructor(config: ApiClientConfig = {}) {
        this.baseUrl = config.baseUrl ?? (typeof window !== 'undefined' ? '' : 'http://localhost:3000');
        this.getAuthToken = config.getAuthToken;
    }

    private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        const headers = new Headers(options.headers || {});
        headers.set('Content-Type', 'application/json');

        if (this.getAuthToken) {
            const token = await this.getAuthToken();
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
        }

        const res = await fetch(`${this.baseUrl}${path}`, {
            ...options,
            headers,
        });

        if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`API Error ${res.status} on ${path}: ${errorBody}`);
        }

        return res.json() as Promise<T>;
    }

    // ─── API V1 Endpoints ───────────────────────────────────────────────────
    readonly v1 = {
        menu: {
            get: (tenantId: string) => 
                this.request<{ tenantId: string; currency: string; categories: unknown[]; count: number }>(
                    `/api/v1/menu?tenantId=${encodeURIComponent(tenantId)}`
                ),
        },
        tables: {
            get: (tenantId: string) => 
                this.request<{ tenantId: string; totalTables: number; occupiedCount: number; tables: unknown[] }>(
                    `/api/v1/tables?tenantId=${encodeURIComponent(tenantId)}`
                ),
        },
        orders: {
            create: (tenantId: string, input: z.input<typeof CreateOrderInputSchema>) => {
                const validated = CreateOrderInputSchema.parse(input);
                return this.request<{ success: boolean; orderId: string; totalMu: number; status: string; estimatedMinutes: number }>(
                    `/api/v1/orders?tenantId=${encodeURIComponent(tenantId)}`,
                    {
                        method: 'POST',
                        body: JSON.stringify(validated),
                    }
                );
            },
            get: (tenantId: string, orderId: string) => 
                this.request<{ id: string; tenantId: string; status: string; totalMu: number; itemsCount: number; tableNumber?: string }>(
                    `/api/v1/orders/${encodeURIComponent(orderId)}?tenantId=${encodeURIComponent(tenantId)}`
                ),
        },
    };

    // ─── Cron & Fleet Endpoints ─────────────────────────────────────────────
    readonly cron = {
        dailyBackup: (secret?: string) => 
            this.request<{ totalTenants: number; succeeded: number; failed: number }>(
                `/api/cron/daily-backup${secret ? `?secret=${encodeURIComponent(secret)}` : ''}`
            ),
    };

    readonly fleet = {
        healthScore: (tenantId?: string) => 
            this.request<unknown>(
                `/api/admin/fleet/health-score${tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : ''}`
            ),
    };
}

export const apiClient = new ApiClient();
