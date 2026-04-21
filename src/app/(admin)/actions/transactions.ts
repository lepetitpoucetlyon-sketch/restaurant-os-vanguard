"use server";

import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { Order, Recipe, StockItem } from '@/types';
import { FiscalEngine } from '@/domain/services/FiscalEngine';

import { TransactionService } from '@/domain/services/TransactionService';

/**
 * 🚀 Transaction Actions - Restaurant OS
 * Production-grade server actions for secure data mutations.
 * Weaver Refactor: Decanted business logic to TransactionService.
 */

export async function processPaymentAction(tenantId: string, orderData: Partial<Order>) {
    if (!orderData.id) throw new Error("Order ID is required");

    logger.info(`[ServerAction] Delegating Payment Processing for Order: ${orderData.id} to TransactionService`);

    try {
        const result = await TransactionService.processPayment(tenantId, orderData.id);
        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Transaction failed. System integrity preserved.";
        logger.error(`[ServerAction] Transaction delegation failed!`, { error, orderId: orderData.id });
        throw new Error(errorMessage);
    }
}

