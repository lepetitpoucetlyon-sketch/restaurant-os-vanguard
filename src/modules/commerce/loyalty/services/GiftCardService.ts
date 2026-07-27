import { Nexus } from '@/lib/nexus/NexusAdapter';
import { GiftCardSchema, GiftCardTransactionSchema, type GiftCard, type GiftCardTransaction } from '@/domain/schemas/giftcard';
import { toMicrounits, type Microunits } from '@/domain/schemas/primitives';

function generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    for (let i = 0; i < 16; i++) {
        code += chars[arr[i] % chars.length];
        if (i === 3 || i === 7 || i === 11) code += '-';
    }
    return code;
}

export const GiftCardService = {
    async issue(
        tenantId: string,
        amountInMicrounits: Microunits,
        operatorId: string,
        opts?: { recipientName?: string; recipientEmail?: string; expiresAt?: string }
    ): Promise<GiftCard> {
        const id = Nexus.adapter.generateId(`tenants/${tenantId}/giftCards`);
        const code = generateCode();

        const card: GiftCard = {
            id,
            tenantId,
            code,
            balanceInMicrounits: amountInMicrounits,
            initialAmountInMicrounits: amountInMicrounits,
            status: 'active',
            recipientName: opts?.recipientName,
            recipientEmail: opts?.recipientEmail,
            issuedAt: Date.now(),
            expiresAt: opts?.expiresAt,
        };

        GiftCardSchema.parse(card);

        await Nexus.adapter.set(
            `tenants/${tenantId}/giftCards/${id}`,
            card as unknown as import('@/shared/nexus-contract').SovereignData
        );

        await this._logTransaction(tenantId, {
            giftCardId: id,
            type: 'issue',
            amountInMicrounits,
            balanceAfterInMicrounits: amountInMicrounits,
            operatorId,
        });

        return card;
    },

    async redeem(
        tenantId: string,
        code: string,
        amountInMicrounits: Microunits,
        operatorId: string,
        orderId?: string
    ): Promise<{ card: GiftCard; redeemed: Microunits }> {
        const cards = await Nexus.adapter.query<GiftCard>(
            `tenants/${tenantId}/giftCards`,
            { where: [{ field: 'code', operator: '==', value: code }] }
        );

        const card = cards[0];
        if (!card) throw new Error('Carte cadeau introuvable');
        if (card.status !== 'active') throw new Error(`Carte ${card.status}`);
        if (card.expiresAt && new Date(card.expiresAt) < new Date()) throw new Error('Carte expirée');

        const redeemed = toMicrounits(Math.min(amountInMicrounits, card.balanceInMicrounits));
        const newBalance = toMicrounits(card.balanceInMicrounits - redeemed);
        const newStatus = newBalance === 0 ? 'depleted' : 'active';

        await Nexus.adapter.update(
            `tenants/${tenantId}/giftCards/${card.id}`,
            {
                balanceInMicrounits: newBalance,
                status: newStatus,
                lastUsedAt: new Date().toISOString(),
            }
        );

        await this._logTransaction(tenantId, {
            giftCardId: card.id,
            type: 'redeem',
            amountInMicrounits: redeemed,
            balanceAfterInMicrounits: newBalance,
            operatorId,
            orderId,
        });

        return { card: { ...card, balanceInMicrounits: newBalance, status: newStatus as GiftCard['status'] }, redeemed };
    },

    async getByCode(tenantId: string, code: string): Promise<GiftCard | null> {
        const cards = await Nexus.adapter.query<GiftCard>(
            `tenants/${tenantId}/giftCards`,
            { where: [{ field: 'code', operator: '==', value: code }] }
        );
        return cards[0] ?? null;
    },

    async _logTransaction(
        tenantId: string,
        data: Omit<GiftCardTransaction, 'id' | 'tenantId' | 'timestamp'>
    ): Promise<void> {
        const id = Nexus.adapter.generateId(`tenants/${tenantId}/giftCardTransactions`);
        const tx: GiftCardTransaction = {
            id,
            tenantId,
            ...data,
            timestamp: Date.now(),
        };
        GiftCardTransactionSchema.parse(tx);
        await Nexus.adapter.set(
            `tenants/${tenantId}/giftCardTransactions/${id}`,
            tx as unknown as import('@/shared/nexus-contract').SovereignData
        );
    },
};
