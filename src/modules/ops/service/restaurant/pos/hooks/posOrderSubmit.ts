/**
 * posOrderSubmit — Orchestration async du POS.
 * Fonctions qui touchent Nexus, NexusEventBus ou FinancialNexusBridge.
 * Pas de React ici.
 */
import { NexusEventBus } from "@/shared/eventBus/NexusEventBus";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { Table, OrderItem } from "@nexus/contracts";
import { CartItem, CourseType, ConsumptionMode } from "../../../../workflow/engine/types";
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
    partialPayments?: { amountInMicrounits: number; guest: number; method?: string }[];
}

export async function processPayment(ctx: PaymentContext): Promise<void> {
    const { FinancialNexusBridge } = await import('@/modules/finance');
    await FinancialNexusBridge.processOrder({
        cartItems: ctx.cartItems,
        operatorId: ctx.operatorId,
        tableId: ctx.tableId,
        tenantId: ctx.tenantId,
        consumptionMode: ctx.consumptionMode,
        partialPayments: ctx.partialPayments,
    });
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
    } catch {
        showToast("Erreur lors de l'envoi du cours", "error");
    }
}
