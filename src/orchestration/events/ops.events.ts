/* eslint-disable no-restricted-imports -- tolerated structural inversion */
import type { CartItem } from '@nexus/contracts';

export interface OPSEvents {
  'order.placed': {
    v: 1;
    isSimulation?: boolean;
    orderId: string;
    tableId: string | null;
    tenantId: string;
    operatorId: string;
    items: CartItem[];
  };

  'order.paid': {
    v: 1;
    isSimulation?: boolean;
    orderId: string;
    tableId: string | null;
    tenantId: string;
    operatorId: string;
    customerId?: string;
    items: CartItem[];
    totalInMicrounits: number;
    paymentMode: string;
    splits?: { amount: number; mode: string }[];
  };

  'order.comp': {
    v: 1;
    isSimulation?: boolean;
    orderId: string;
    tableId?: string | null;
    tenantId: string;
    operatorId: string;
    items: CartItem[];
    totalValueInMicrounits: number;
    reason: string;
  };

  'order.cancelled': {
    v: 1;
    isSimulation?: boolean;
    orderId: string;
    tenantId: string;
    operatorId: string;
    reason?: string;
  };

  'order.split': {
    v: 1;
    isSimulation?: boolean;
    orderId: string;
    tableId: string | null;
    tenantId: string;
    operatorId: string;
    totalInMicrounits: number;
    payments: Array<{ amount: number; guest: number; method: string }>;
  };

  'order.refunded': {
    v: 1;
    isSimulation?: boolean;
    orderId: string;
    tenantId: string;
    operatorId: string;
    amountInMicrounits: number;
    originalPaymentMode: string;
  };

  'stock.low': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    itemId: string;
    itemName: string;
    currentQuantity: number;
    threshold: number;
  };

  'stock.received': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    deliveryId: string;
    purchaseOrderId?: string;
    items: Array<{ itemId: string; quantity: number; unitPrice?: number }>;
  };

  'inventory.stock_adjusted': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    itemId: string;
    oldQuantity: number;
    newQuantity: number;
    reason: string;
    adjustedBy: string;
  };

  'cash_drawer.opened_unauthorized': {
    v: 1;
    isSimulation?: boolean;
    drawerId: string;
    operatorId: string;
    detectedAt: number;
    tenantId: string;
  };

  'inventory.quarantine_activated': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    productIds: string[];
    reason: string;
  };

  'recipe.updated': {
    v: 1;
    tenantId: string;
    recipeId: string;
    productId: string;
  };

  'stock.zero': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    itemId: string;
    itemName: string;
  };

  'stock.transfer': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    fromLocationId: string;
    toLocationId: string;
    itemId: string;
    quantity: number;
    operatorId: string;
  };

  'inventory.physical': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    inventoryId: string;
    items: Array<{ itemId: string; theoreticalQty: number; physicalQty: number }>;
    operatorId: string;
  };

  'kds.ticket_received': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    orderId: string;
    stationId?: string;
    items: Array<{ id: string; productId: string; name: string; quantity: number; course: number }>;
  };

  'kds.course_fired': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    orderId: string;
    course: number;
  };

  'kds.item_started': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    orderId: string;
    itemId: string;
    operatorId?: string;
  };

  'kds.item_done': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    orderId: string;
    itemId: string;
    operatorId?: string;
  };

  'kds.ticket_done': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    orderId: string;
  };

  'kds.bumped': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    orderId: string;
    stationId?: string;
  };

  'kds.rush_alert': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    orderId: string;
    itemId?: string;
    exceededByMinutes: number;
  };

  'kds.printer_failed': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    orderId: string;
    printerId: string;
    errorReason: string;
  };

  'kds.ticket_delayed': {
    v: 1;
    tenantId: string;
    orderId: string;
    delayInMinutes: number;
  };

  'inventory.waste_logged': {
    v: 1;
    tenantId: string;
    wasteId: string;
    items: Array<{ productId: string; quantity: number }>;
  };

  // ── Déduction stock post-commande ─────────────────────────────────────────
  'inventory.deducted': { tenantId: string; orderId: string; lines: { stockItemId: string; quantity: number }[] };

  // ── Notifications ops ─────────────────────────────────────────────────────
  'ops.order_notification': { tenantId: string; orderId: string; tableId?: string; totalInMicrounits: number };

  // ── KDS enrichi ───────────────────────────────────────────────────────────
  'kds.course_passed': { tenantId: string; orderId: string; courseId: string };

  // ── Cadençage KDS (fire next course + rebound) ────────────────────────────
  'kds.fire_next_course': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    orderId: string;
    course: number;
    stationId?: string;
    firedBy: string;
    firedAt: number;
  };

  'kds.dish_rebound': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    orderId: string;
    itemId: string;
    productName: string;
    reason: 'client_refusal' | 'quality' | 'allergen' | 'other';
    operatorId: string;
    reboundAt: number;
  };

  // ── Tables — lock / transfert ─────────────────────────────────────────────
  'table.locked': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    tableId: string;
    lockedBy: string;
    reason: string;
    lockedAt: number;
  };

  'table.transferred': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    fromTableId: string;
    toTableId: string;
    orderId: string;
    operatorId: string;
    transferredAt: number;
  };

  // ── Hardware — imprimante mappée ──────────────────────────────────────────
  'hardware.printer_mapped': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    printerId: string;
    stationId: string;
    name: string;
    printerType: 'receipt' | 'kitchen' | 'bar';
    mappedAt: number;
  };

  // ── POS — login terminal ──────────────────────────────────────────────────
  'pos.terminal_login': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    terminalId: string;
    operatorId: string;
    loggedAt: number;
  };

  // ── Proforma ──────────────────────────────────────────────────────────────
  'order.proforma_printed': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    orderId: string;
    tableId?: string;
    operatorId: string;
    totalInMicrounits: number;
    printedAt: number;
  };
  'floor.node.updated': { tenantId: string; id?: string; nodeId?: string; data: any };
  'floor.node.created': { tenantId: string; id?: string; nodeId?: string; data: any };
  'floor.node.deleted': { tenantId: string; id?: string; nodeId?: string };
  'floor.zone.updated': { tenantId: string; id?: string; zoneId?: string; data: any };
  'floor.zone.created': { tenantId: string; id?: string; zoneId?: string; data: any };
  'floor.zone.deleted': { tenantId: string; id?: string; zoneId?: string };
  'kitchen.order.updated': { tenantId: string; id?: string; orderId?: string; data: any };
  'kitchen.recipe.updated': { tenantId: string; id?: string; recipeId?: string; data: any };
  'kitchen.preptask.toggled': { tenantId: string; id?: string; taskId?: string; completed?: boolean; status?: string };
  'kitchen.order.created': { tenantId: string; id?: string; orderId?: string; data: any };
  'ops.prepTask.completed': { tenantId: string; id?: string; taskId?: string; dateIso?: string; data?: any };

  // §8.1 ServiceTicket — cycle de vie générique (toutes verticales)
  'ops.service_ticket_opened':   { v: 1; tenantId: string; ticketId: string; resourceId: string | null };
  'ops.service_ticket_working':  { v: 1; tenantId: string; ticketId: string };
  'ops.service_ticket_closed':   { v: 1; tenantId: string; ticketId: string; resourceId: string | null; journalEntryId: string; totalTTCInMicrounits: number };
  'ops.service_ticket_cancelled': { v: 1; tenantId: string; ticketId: string; reason: string };

  // §8.6 Appointments — booking générique (salon, clinic, hôtel, restaurant)
  'appointments.appointment_created':   { tenantId: string; appointmentId: string; kind: string; clientEmail: string; startAt: string };
  'appointments.appointment_confirmed': { tenantId: string; appointmentId: string };
  'appointments.appointment_cancelled': { tenantId: string; appointmentId: string };
  'appointments.appointment_completed': { tenantId: string; appointmentId: string };
  'appointments.appointment_no_show':   { tenantId: string; appointmentId: string };

  // §8.6 Consultation — clinic, legal, accounting
  'ops.consultation_scheduled': { tenantId: string; consultationId: string; clientEmail: string; startAt: string };
  'ops.consultation_completed': { tenantId: string; consultationId: string };

  // §8.6 FrontDesk — hôtel, co-working, clinic
  'ops.guest_checked_in':  { tenantId: string; guestId: string; guestName: string; unitName?: string };
  'ops.guest_checked_out': { tenantId: string; guestId: string };
}
