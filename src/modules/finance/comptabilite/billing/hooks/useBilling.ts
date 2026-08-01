"use client";

import { useEffect, useCallback } from 'react';
        // FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
        // eslint-disable-next-line vanguard/no-inter-module-imports
import { useOrders } from '@/modules/ops/providers';
import type { Order } from '@modules/ops/workflow/engine/types';
import type { JournalEntry } from '@modules/finance/types';
import { InvoiceEngine } from '../domain/InvoiceEngine';
import { useAtomValue, useStore } from 'jotai';
import { fiscalLedgerNodeAtom } from '@/store/pillars/compliance';
import { tenantIdAtom } from '@/store/pillars/sovereign';

import { Nexus } from '@/lib/nexus/NexusAdapter';
import { OperationalIdentity } from '@/shared/nexus-contract';
import { DomainRegistry } from '@shared/nexus/engines/DomainRegistry';
import { logger } from '@/lib/logger';

/**
 * 🧾 useBilling - Fiscal Suture Hook
 * Orchestrates the real-time link between POS [OPS] and Billing [FINANCE].
 */
export function useBilling(options?: { enabled?: boolean }) {
    const enabled = options?.enabled ?? true;
    const { data: orders, isLoading } = useOrders();
    const fiscalLedgerNode = useAtomValue(fiscalLedgerNodeAtom);
    const tenantId = useAtomValue(tenantIdAtom);
    const _store = useStore();

    /**
     * Fiscal Suture: Process a single order into a LegalInvoice and seal it.
     */
    const billOrder = useCallback(async (order: Order) => {
        try {
            // 1. Transform SovereignOrder -> LegalInvoice
            const invoice = InvoiceEngine.transform(order);
            
            // 2. Map to JournalEntry for the Ledger
            const journalEntry = InvoiceEngine.toJournalEntry(invoice, tenantId as string);

            // 3. Save Invoice to Finance Domain
            const invoicePath = `tenants/${tenantId as string}/finance/billing`;
            await Nexus.adapter.create(invoicePath, invoice);

            // 4. Seal to Fiscal Ledger (STX_LAMBDA)
            const ledgerPath = `tenants/${tenantId as string}/${DomainRegistry.resolve(OperationalIdentity.COMPLIANCE)}`;
            await Nexus.adapter.create(ledgerPath, journalEntry);

            logger.info(`[Billing] Order ${order.id} billed and sealed successfully as ${invoice.invoiceNumber}`);
            return invoice;
        } catch (error) {
            logger.error(`[Billing] Failed to bill order ${order.id}`, error);
            throw error;
        }
    }, [tenantId]);

    /**
     * Orchestrator: Watch for completed orders that haven't been billed.
     */
    useEffect(() => {
        if (!enabled || isLoading || !orders) return;

        const processOrders = async () => {
            const completedOrders = (orders as Order[]).filter((o: Order) => o.status === 'paid' || (o as { status?: string }).status === 'served');
            const ledgerData = (fiscalLedgerNode.data || []) as unknown as JournalEntry[];

            for (const order of completedOrders) {
                const isAlreadyBilled = ledgerData.some((entry: JournalEntry) => (entry as { metadata?: { orderId?: string } }).metadata?.orderId === order.id);

                if (!isAlreadyBilled) {
                    await billOrder(order);
                }
            }
        };

        processOrders();
    }, [enabled, orders, isLoading, fiscalLedgerNode.data, billOrder]);

    return {
        billOrder,
        isLoadingOrders: isLoading
    };
}

