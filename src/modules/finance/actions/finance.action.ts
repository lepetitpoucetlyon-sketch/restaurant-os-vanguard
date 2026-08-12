"use server";

import { NexusEventBus } from '@orchestration/NexusEventBus';
import { toError } from '@/lib/toError';

import { createSafeAction } from "@/lib/server/actionWrapper";
import { z } from "zod";

export const dispatchPaymentAction = createSafeAction(
    z.tuple([z.string(), z.array(z.string()), z.number()]),
    { page: "finance", action: "mark_paid" },
    async (tenantId, batchId: string, invoiceIds: string[], totalAmount: number) => {
        try {
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
);
