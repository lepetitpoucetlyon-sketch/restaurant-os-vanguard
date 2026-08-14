/**
 * posOrderSubmit — Orchestration async du POS.
 * Fonctions qui touchent Nexus, NexusEventBus ou FinancialNexusBridge.
 * Pas de React ici.
 */
import { FinancialNexusBridge } from "@/modules/finance/comptabilite/FinancialNexusBridge";
import { NexusEventBus } from "@orchestration/NexusEventBus";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { Table, OrderItem } from "@nexus/contracts";
import { CartItem, CourseType } from "../../../workflow/engine/types";
import type { ConsumptionMode } from "@/modules/ops";
import { logger } from "@/lib/logger";
import {
    COURSE_LABELS,
    getUnsentCourseItems,
    markCourseAsSent,
    buildCourseOrderItems,
    resolveServerName,
} from "./posHelpers";

// ── Payment ───────────────────────────────────────────────────────────────────

export interface PaymentContext {
    cartItems: CartItem[];
    operatorId: string;
    tableId: string | null;
    tenantId: string;
    consumptionMode: ConsumptionMode;
    partialPayments?: { amount: number; guest: number; method?: string }[];
    tipInMicrounits?: number;
    invoiceRequest?: {
        customerName: string;
        customerSiret: string;
        customerAddress?: string;
    };
}

export async function processPayment(ctx: PaymentContext): Promise<void> {
    const result = await FinancialNexusBridge.processOrder({
        cartItems: ctx.cartItems,
        operatorId: ctx.operatorId,
        tableId: ctx.tableId,
        tenantId: ctx.tenantId,
        consumptionMode: ctx.consumptionMode,
        partialPayments: ctx.partialPayments,
        tipInMicrounits: ctx.tipInMicrounits,
    });

    if (ctx.invoiceRequest) {
        const { InvoiceService } = await import(
            "@/modules/finance/comptabilite/billing/domain/InvoiceService"
        );
        await InvoiceService.generateFromTicket({
            tenantId: ctx.tenantId,
            journalEntry: result.journalEntry,
            customerName: ctx.invoiceRequest.customerName,
            customerSiret: ctx.invoiceRequest.customerSiret,
            customerAddress: ctx.invoiceRequest.customerAddress,
        });
    }
}

// ── Kitchen order submission ───────────────────────────────────────────────────

export interface SendOrderParams {
    tableId: string;
    tableNumber: string;
    serverName: string;
    items: OrderItem[];
}

export async function submitKitchenOrder(
    params: SendOrderParams,
    addOrder: (data: Record<string, unknown>) => Promise<void>,
    updateTable: (id: string, data: Record<string, unknown>) => Promise<void>,
    selectedTableId: string | null,
    tenantId: string
): Promise<void> {
    const orderId = Nexus.adapter.generateId(`tenants/${tenantId}/flows`);
    await addOrder({
        id: orderId,
        tableId: params.tableId,
        tableNumber: Number(params.tableNumber) || 0,
        serverName: params.serverName,
        items: params.items,
        status: "new",
    });
    if (selectedTableId) await updateTable(selectedTableId, { status: "ordered" });

    // Déclenchement de l'événement de commande (P1)
    await NexusEventBus.emitDurable('order.placed', {
        v: 1,
        orderId,
        tableId: params.tableId,
        tenantId,
        operatorId: params.serverName,
        items: params.items as never,
    });
}

// ── Course dispatch ────────────────────────────────────────────────────────────

export async function handleSendCourseImpl(
    course: CourseType,
    cartItems: CartItem[],
    currentTable: Table | undefined,
    currentUser: { name?: string } | null | undefined,
    addOrder: (data: Record<string, unknown>) => Promise<void>,
    updateTable: (id: string, data: Record<string, unknown>) => Promise<void>,
    selectedTableId: string | null,
    setCartItems: (updater: (prev: CartItem[]) => CartItem[]) => void,
    showToast: (msg: string, type: string) => void,
    tenantId: string
): Promise<void> {
    const courseItems = getUnsentCourseItems(cartItems, course);
    if (courseItems.length === 0 || !currentTable) return;
    try {
        await submitKitchenOrder(
            {
                tableId: currentTable.id,
                tableNumber: currentTable.number,
                serverName: resolveServerName(currentUser),
                items: buildCourseOrderItems(courseItems, course),
            },
            addOrder, updateTable, selectedTableId, tenantId
        );
        setCartItems((prev) => markCourseAsSent(prev, course, Date.now()));
        showToast(`${COURSE_LABELS[course]} envoyés en cuisine`, "success");
    } catch (err) {
        logger.error("[posOrderSubmit] Échec envoi cours cuisine", { course, tableNumber: currentTable.number, tenantId, error: err });
        showToast("Erreur lors de l'envoi du cours", "error");
    }
}
