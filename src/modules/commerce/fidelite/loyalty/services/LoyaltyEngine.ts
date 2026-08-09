import { Nexus } from '@/lib/nexus/NexusAdapter';
import {
    LoyaltyAccountSchema,
    LoyaltyTransactionSchema,
    TIER_THRESHOLDS,
    type LoyaltyAccount,
    type LoyaltyTransaction,
    type LoyaltyTier,
} from '@/modules/commerce/domain/schemas/loyalty';
import type { Microunits } from '@/shared/schemas/primitives';

function resolveTier(lifetimePoints: number): LoyaltyTier {
    if (lifetimePoints >= TIER_THRESHOLDS.platinum) return 'platinum';
    if (lifetimePoints >= TIER_THRESHOLDS.gold) return 'gold';
    if (lifetimePoints >= TIER_THRESHOLDS.silver) return 'silver';
    return 'bronze';
}

const POINTS_PER_EURO = 1;

export const LoyaltyEngine = {
    async getOrCreate(tenantId: string, subjectId: string): Promise<LoyaltyAccount> {
        const existing = await Nexus.adapter.query<LoyaltyAccount>(
            `tenants/${tenantId}/loyaltyAccounts`,
            { where: [{ field: 'subjectId', operator: '==', value: subjectId }] }
        );
        if (existing[0]) return existing[0];

        const id = Nexus.adapter.generateId(`tenants/${tenantId}/loyaltyAccounts`);
        const account: LoyaltyAccount = {
            id,
            tenantId,
            subjectId,
            points: 0,
            lifetimePoints: 0,
            tier: 'bronze',
            createdAt: Date.now(),
        };
        LoyaltyAccountSchema.parse(account);
        await Nexus.adapter.set(
            `tenants/${tenantId}/loyaltyAccounts/${id}`,
            account
        );
        return account;
    },

    async earn(
        tenantId: string,
        subjectId: string,
        totalInMicrounits: Microunits,
        orderId?: string
    ): Promise<{ pointsEarned: number; newBalance: number; tier: LoyaltyTier }> {
        const account = await this.getOrCreate(tenantId, subjectId);
        const euros = totalInMicrounits / 1_000_000;
        const pointsEarned = Math.floor(euros * POINTS_PER_EURO);

        if (pointsEarned <= 0) return { pointsEarned: 0, newBalance: account.points, tier: account.tier };

        const newBalance = account.points + pointsEarned;
        const newLifetime = account.lifetimePoints + pointsEarned;
        const tier = resolveTier(newLifetime);

        await Nexus.adapter.update(
            `tenants/${tenantId}/loyaltyAccounts/${account.id}`,
            { points: newBalance, lifetimePoints: newLifetime, tier, lastEarnedAt: new Date().toISOString() }
        );

        await this._logTx(tenantId, {
            subjectId,
            type: 'earn',
            points: pointsEarned,
            balanceAfter: newBalance,
            orderId,
        });

        return { pointsEarned, newBalance, tier };
    },

    async redeem(
        tenantId: string,
        subjectId: string,
        points: number,
        operatorId: string,
        orderId?: string
    ): Promise<{ redeemed: number; newBalance: number }> {
        const account = await this.getOrCreate(tenantId, subjectId);
        if (account.points < points) throw new Error('Solde de points insuffisant');

        const newBalance = account.points - points;
        await Nexus.adapter.update(
            `tenants/${tenantId}/loyaltyAccounts/${account.id}`,
            { points: newBalance, lastRedeemedAt: new Date().toISOString() }
        );

        await this._logTx(tenantId, {
            subjectId,
            type: 'redeem',
            points: -points,
            balanceAfter: newBalance,
            orderId,
            operatorId,
        });

        return { redeemed: points, newBalance };
    },

    async _logTx(
        tenantId: string,
        data: Omit<LoyaltyTransaction, 'id' | 'tenantId' | 'timestamp'>
    ): Promise<void> {
        const id = Nexus.adapter.generateId(`tenants/${tenantId}/loyaltyTransactions`);
        const tx: LoyaltyTransaction = { id, tenantId, ...data, timestamp: Date.now() };
        LoyaltyTransactionSchema.parse(tx);
        await Nexus.adapter.set(
            `tenants/${tenantId}/loyaltyTransactions/${id}`,
            tx
        );
    },
};
