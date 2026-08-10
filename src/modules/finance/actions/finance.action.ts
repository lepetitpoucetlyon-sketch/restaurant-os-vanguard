"use server";

import { verifySession } from '@/lib/server/verifySession';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { toError } from '@/lib/toError';

export async function dispatchPaymentAction(tenantId: string, batchId: string, invoiceIds: string[], totalAmount: number) {
    try {
        await verifySession(tenantId);
        await NexusEventBus.emitDurable('finance.payment_dispatched', {
            v: 1,
            tenantId,
            paymentBatchId: batchId,
            invoiceIds,
            totalAmountInMicrounits: totalAmount,
            dispatchedBy: "treasury-ui",
        });
        return { success: true };
    } catch (err) {
        return { success: false, error: toError(err).message };
    }
}
