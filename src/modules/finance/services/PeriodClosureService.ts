import { Nexus } from '@/lib/nexus/NexusAdapter';
import { CryptoService } from '@/lib/CryptoService';
import { SharedKernel } from '@/lib/shared-kernel';
import type { PeriodClosure, PeriodType } from '@/modules/finance/domain/schemas/periodClosure';
import type { JournalEntry } from '@nexus/contracts';
import type { Microunits } from '@/shared/schemas/primitives';
import { toMicrounits } from '@/shared/schemas/primitives';
import { JsonObject } from "@/shared/types/json";

const GENESIS_HASH = '0'.repeat(64);

export class PeriodClosureService {
    async close(
        tenantId: string,
        periodType: PeriodType,
        periodKey: string,
        startDate: string,
        endDate: string,
        closedBy: string,
    ): Promise<PeriodClosure> {
        const existing = await Nexus.adapter.get<PeriodClosure>(
            `tenants/${tenantId}/periodClosures/${periodKey}`
        );
        if (existing) {
            throw new Error(`Clôture ${periodKey} déjà effectuée`);
        }

        const entries = await Nexus.adapter.query<JournalEntry>(
            `tenants/${tenantId}/journalEntries`,
            {
                where: [
                    { field: 'date', operator: '>=', value: startDate },
                    { field: 'date', operator: '<=', value: endDate },
                ],
            }
        );

        let totalRevenue = 0;
        let totalExpense = 0;
        const tvaMap: Record<string, number> = {};

        for (const entry of entries) {
            const amount = (entry as unknown as { totalInMicrounits?: number }).totalInMicrounits
                ?? (entry.amountInCents ?? 0) * 10_000;

            if (entry.type === 'revenue') totalRevenue += amount;
            else if (entry.type === 'expense') totalExpense += amount;

            const lines = (entry as unknown as { lines?: Array<{ taxRate?: string; totalInMicrounits?: number }> }).lines;
            if (lines) {
                for (const line of lines) {
                    if (line.taxRate && line.totalInMicrounits) {
                        const rate = parseFloat(line.taxRate);
                        const tva = Math.round(line.totalInMicrounits * rate / (1 + rate));
                        tvaMap[line.taxRate] = (tvaMap[line.taxRate] ?? 0) + tva;
                    }
                }
            }
        }

        const previousHash = await this.getLastHash(tenantId, periodType);

        const closureId = SharedKernel.generateId('PC');
        const now = new Date().toISOString();

        const tvaCollected = Object.fromEntries(
            Object.entries(tvaMap).map(([k, v]) => [k, toMicrounits(v) as unknown as number])
        ) as Record<string, Microunits>;

        const dataSnapshot = CryptoService.canonicalStringify({
            id: closureId,
            periodKey,
            totalRevenue,
            totalExpense,
            tvaCollected,
            transactionCount: entries.length,
        } as import("@/shared/nexus-contract").SovereignData);

        const hash = await CryptoService.generateHash(dataSnapshot, previousHash);

        const closure: PeriodClosure = {
            id: closureId,
            tenantId,
            periodType,
            periodKey,
            startDate,
            endDate,
            totalRevenueInMicrounits: toMicrounits(totalRevenue),
            totalExpenseInMicrounits: toMicrounits(totalExpense),
            tvaCollected,
            transactionCount: entries.length,
            grandTotalInMicrounits: toMicrounits(totalRevenue - totalExpense),
            hash,
            previousHash,
            closedAt: now,
            closedBy,
        };

        await Nexus.adapter.set(
            `tenants/${tenantId}/periodClosures/${periodKey}`,
            closure
        );

        return closure;
    }

    async getGrandTotal(tenantId: string): Promise<number> {
        const closures = await Nexus.adapter.query<PeriodClosure>(
            `tenants/${tenantId}/periodClosures`,
            { where: [{ field: 'periodType', operator: '==', value: 'monthly' }] }
        );
        return closures.reduce((sum, c) => sum + c.grandTotalInMicrounits, 0);
    }

    private async getLastHash(tenantId: string, periodType: PeriodType): Promise<string> {
        const closures = await Nexus.adapter.query<PeriodClosure>(
            `tenants/${tenantId}/periodClosures`,
            {
                where: [{ field: 'periodType', operator: '==', value: periodType }],
                orderBy: { field: 'closedAt', direction: 'desc' },
                limit: 1,
            }
        );
        return closures[0]?.hash ?? GENESIS_HASH;
    }
}

export const periodClosureService = new PeriodClosureService();
