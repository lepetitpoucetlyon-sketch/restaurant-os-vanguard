import type { IDeliveryProvider, DeliveryOrder, DeliveryMenuItem, DeliveryStatus } from '../types';
import { logger } from '@/lib/logger';

/**
 * Uber Eats — Restaurant Manager API.
 * Accès sur demande : https://developer.uber.com/docs/eats/introduction
 * Variables requises : UBEREATS_CLIENT_ID, UBEREATS_CLIENT_SECRET, UBEREATS_STORE_ID
 */
export class UberEatsProvider implements IDeliveryProvider {
    readonly id = 'ubereats';

    private get storeId(): string {
        const id = process.env.UBEREATS_STORE_ID;
        if (!id) throw new Error('UBEREATS_STORE_ID manquant');
        return id;
    }

    private async getAccessToken(): Promise<string> {
        const clientId     = process.env.UBEREATS_CLIENT_ID;
        const clientSecret = process.env.UBEREATS_CLIENT_SECRET;
        if (!clientId || !clientSecret) throw new Error('UBEREATS_CLIENT_ID / UBEREATS_CLIENT_SECRET manquants');
        const res = await fetch('https://login.uber.com/oauth/v2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type:    'client_credentials',
                client_id:     clientId,
                client_secret: clientSecret,
                scope:         'eats.order eats.store.status.write',
            }),
        });
        if (!res.ok) throw new Error(`UberEats OAuth → ${res.status}`);
        const data = await res.json() as { access_token: string };
        return data.access_token;
    }

    private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
        const token = await this.getAccessToken();
        const res = await fetch(`https://api.uber.com/v1/eats${path}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });
        if (!res.ok) throw new Error(`UberEats ${path} → ${res.status} ${res.statusText}`);
        return res.json() as Promise<T>;
    }

    async listPendingOrders(_tenantId: string): Promise<DeliveryOrder[]> {
        const data = await this.fetch<{ orders: unknown[] }>(`/stores/${this.storeId}/orders?status=ACTIVE`);
        return data.orders.map(o => this.normalizeOrder(o));
    }

    async acknowledgeOrder(orderId: string): Promise<void> {
        await this.fetch(`/orders/${orderId}/accept_pos_order`, { method: 'POST' });
        logger.info('[UberEatsProvider] acknowledged', orderId);
    }

    async updateStatus(orderId: string, status: DeliveryStatus): Promise<void> {
        const uberStatus = status === 'ready' ? 'READY_FOR_PICKUP' : status.toUpperCase();
        await this.fetch(`/orders/${orderId}/update_status`, {
            method: 'POST',
            body: JSON.stringify({ status: uberStatus }),
        });
    }

    onWebhook(payload: unknown): DeliveryOrder {
        const p = payload as { order: unknown };
        return this.normalizeOrder(p.order);
    }

    async verifySignature(rawBody: string, headers: Headers): Promise<boolean> {
        const secret = process.env.UBEREATS_WEBHOOK_SECRET;
        if (!secret) return false;
        const header = headers.get('x-uber-signature') ?? '';
        // Uber envoie "sha256=<hex>" — on strip le préfixe avant comparaison
        const incoming = header.startsWith('sha256=') ? header.slice(7) : header;
        const { computeHmacHex, timingSafeCompareHex } = await import('@/lib/server/webhookVerify');
        const expected = computeHmacHex(secret, rawBody);
        return timingSafeCompareHex(incoming, expected);
    }

    async getMenu(_tenantId: string): Promise<DeliveryMenuItem[]> {
        const data = await this.fetch<{ items: unknown[] }>(`/stores/${this.storeId}/menus`);
        return (data.items ?? []).map(i => this.normalizeMenuItem(i));
    }

    async pushMenu(_tenantId: string, _menu: DeliveryMenuItem[]): Promise<void> {
        logger.warn('[UberEatsProvider] pushMenu non implémenté');
    }

    private normalizeOrder(raw: unknown): DeliveryOrder {
        const o      = raw as Record<string, unknown>;
        const price  = o['price'] as Record<string, unknown> | undefined;
        const cust   = o['customer'] as Record<string, unknown> | undefined;
        return {
            id:                `ubereats_${o['id']}`,
            tenantId:          String(o['store_id'] ?? ''),
            externalId:        String(o['id'] ?? ''),
            source:            'ubereats',
            status:            'new',
            items:             [],
            customer:          { name: String(cust?.['first_name'] ?? 'Client Uber') },
            totalInMicrounits: Math.round(Number(price?.['total_price'] ?? 0) * 1_000_000),
            placedAt:          String(o['created_at'] ?? new Date().toISOString()),
        };
    }

    private normalizeMenuItem(raw: unknown): DeliveryMenuItem {
        const item  = raw as Record<string, unknown>;
        const price = item['price'] as Record<string, unknown> | undefined;
        return {
            externalId:        String(item['id'] ?? ''),
            name:              String(item['title'] ?? ''),
            description:       item['description'] ? String(item['description']) : undefined,
            priceInMicrounits: Math.round(Number(price?.['base_unit_price'] ?? 0) * 1_000_000),
            available:         item['status'] !== 'UNAVAILABLE',
        };
    }
}
