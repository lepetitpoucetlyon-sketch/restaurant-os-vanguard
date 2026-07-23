import { Nexus } from '@/lib/nexus/NexusAdapter';
import { CustomerAccountSchema, AccountChargeSchema, type CustomerAccount, type AccountCharge } from '@/domain/schemas/customerAccount';
import type { Microunits } from '@/domain/schemas/primitives';

export const CustomerAccountService = {
    async getBySubject(tenantId: string, subjectId: string): Promise<CustomerAccount | null> {
        const results = await Nexus.adapter.query<CustomerAccount>(
            `tenants/${tenantId}/customerAccounts`,
            { where: [{ field: 'subjectId', operator: '==', value: subjectId }] }
        );
        return results[0] ?? null;
    },

    async chargeToAccount(
        tenantId: string,
        subjectId: string,
        amountInMicrounits: Microunits,
        operatorId: string,
        orderId?: string
    ): Promise<AccountCharge> {
        const account = await this.getBySubject(tenantId, subjectId);
        if (!account) throw new Error('Compte client introuvable');
        if (account.status !== 'active') throw new Error('Compte suspendu');

        const newBalance = account.balanceInMicrounits + amountInMicrounits;
        if (newBalance > account.creditLimitInMicrounits) {
            throw new Error('Plafond de crédit dépassé');
        }

        await Nexus.adapter.update(
            `tenants/${tenantId}/customerAccounts/${account.id}`,
            { balanceInMicrounits: newBalance, lastChargeAt: new Date().toISOString() }
        );

        const chargeId = Nexus.adapter.generateId(`tenants/${tenantId}/accountCharges`);
        const charge: AccountCharge = {
            id: chargeId,
            tenantId,
            accountId: account.id,
            type: 'charge',
            amountInMicrounits,
            balanceAfterInMicrounits: newBalance,
            orderId,
            operatorId,
            timestamp: Date.now(),
        };
        AccountChargeSchema.parse(charge);

        await Nexus.adapter.set(
            `tenants/${tenantId}/accountCharges/${chargeId}`,
            charge as unknown as import('@/shared/nexus-contract').SovereignData
        );

        return charge;
    },

    async recordPayment(
        tenantId: string,
        subjectId: string,
        amountInMicrounits: Microunits,
        operatorId: string
    ): Promise<AccountCharge> {
        const account = await this.getBySubject(tenantId, subjectId);
        if (!account) throw new Error('Compte client introuvable');

        const newBalance = account.balanceInMicrounits - amountInMicrounits;

        await Nexus.adapter.update(
            `tenants/${tenantId}/customerAccounts/${account.id}`,
            { balanceInMicrounits: newBalance }
        );

        const chargeId = Nexus.adapter.generateId(`tenants/${tenantId}/accountCharges`);
        const charge: AccountCharge = {
            id: chargeId,
            tenantId,
            accountId: account.id,
            type: 'payment',
            amountInMicrounits: -amountInMicrounits,
            balanceAfterInMicrounits: newBalance,
            operatorId,
            timestamp: Date.now(),
        };
        AccountChargeSchema.parse(charge);

        await Nexus.adapter.set(
            `tenants/${tenantId}/accountCharges/${chargeId}`,
            charge as unknown as import('@/shared/nexus-contract').SovereignData
        );

        return charge;
    },

    async getStatement(tenantId: string, accountId: string): Promise<AccountCharge[]> {
        return Nexus.adapter.query<AccountCharge>(
            `tenants/${tenantId}/accountCharges`,
            {
                where: [{ field: 'accountId', operator: '==', value: accountId }],
                orderBy: { field: 'timestamp', direction: 'desc' },
            }
        );
    },
};
