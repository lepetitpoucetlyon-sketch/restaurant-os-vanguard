/**
 * posHelpers — Fonctions pures du POS (zéro React, zéro effets de bord).
 * Testables unitairement sans monter de composant.
 */
import { toMicrounits } from "@/shared/schemas/primitives";
import { CartItem, CourseType, SovereignProduct } from "../../../../workflow/engine/types";
import { OrderItem } from "@nexus/contracts";
import { IdGenerator } from "@/lib/utils/IdGenerator";

// ── Constantes ────────────────────────────────────────────────────────────────

export const COURSE_LABELS: Record<CourseType, string> = {
    entree: "Entrées",
    plat: "Plats",
    dessert: "Desserts",
};

// ── Construction ──────────────────────────────────────────────────────────────

export function buildModifiers(
    selectedOptions: Record<string, { id?: string; name: string; action?: 'add' | 'remove' | 'info'; ingredientId?: string; quantityImpact?: number }[]> | undefined
) {
    if (!selectedOptions) return [];
    return Object.values(selectedOptions).flat().map((opt) => ({
        id: opt.id || IdGenerator.generateWithPrefix('mod'),
        name: opt.name,
        action: opt.action || 'add',
        ingredientId: opt.ingredientId,
        quantityImpact: opt.quantityImpact,
    }));
}

export function buildCartItem(
    product: SovereignProduct,
    quantity: number,
    modifiers: CartItem['modifiers'],
    note?: string
): CartItem {
    return {
        cartId: `${product.id}-${Date.now()}`,
        productId: product.id,
        categoryId: product.categoryId || "other",
        name: product.name,
        unitPriceInMicrounits: product.priceInMicrounits || toMicrounits((product.priceInCents || 0) * 10000),
        discountInMicrounits: toMicrounits(0),
        taxRate: product.taxRate || "0.10",
        quantity,
        modifiers,
        notes: note || "",
    };
}

export function buildCourseOrderItems(courseItems: CartItem[], course: CourseType): OrderItem[] {
    return courseItems.map((item) => ({
        id: item.cartId,
        productId: item.productId,
        name: item.name,
        unitPriceInMicrounits: item.unitPriceInMicrounits,
        taxRate: item.taxRate,
        quantity: item.quantity,
        status: "pending" as const,
        notes: item.notes,
        modifiers: item.modifiers,
        discountInMicrounits: toMicrounits(0),
        course,
    })) as OrderItem[];
}

// ── Mutations cart ────────────────────────────────────────────────────────────

export function updateItemQuantity(items: CartItem[], cartId: string, delta: number): CartItem[] {
    return items
        .map((item) => item.cartId === cartId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item)
        .filter((item) => item.quantity > 0);
}

export function updateCartItem(items: CartItem[], cartId: string, patch: Partial<CartItem>): CartItem[] {
    return items.map((item) => item.cartId !== cartId ? item : { ...item, ...patch });
}

// ── Course helpers ────────────────────────────────────────────────────────────

export function getUnsentCourseItems(items: CartItem[], course: CourseType): CartItem[] {
    return items.filter((i) => i.course === course && !i.sentAt);
}

export function markCourseAsSent(items: CartItem[], course: CourseType, sentAt: number): CartItem[] {
    return items.map((item) =>
        item.course === course && !item.sentAt ? { ...item, sentAt } : item
    );
}

// ── Calculs ───────────────────────────────────────────────────────────────────

export function computeCartTvaInMicrounits(cartItems: CartItem[]): number {
    let tvaMu = 0;
    for (const item of cartItems) {
        const rate = parseFloat(String(item.taxRate ?? '0.10'));
        const ttcMu = item.unitPriceInMicrounits * item.quantity - (item.discountInMicrounits ?? 0);
        tvaMu += ttcMu - Math.round(ttcMu / (1 + rate));
    }
    return tvaMu;
}

// ── Guards ────────────────────────────────────────────────────────────────────

export function canCancelSentItem(
    item: CartItem | undefined,
    hasAccess: ((perm: string) => boolean) | undefined
): boolean {
    if (!item?.sentAt) return true;
    return !hasAccess || hasAccess('operations.pos.cancel_sent');
}

export function hasPermission(
    hasAccess: ((perm: string) => boolean) | undefined,
    perm: string
): boolean {
    return !hasAccess || hasAccess(perm);
}

// ── Affichage ─────────────────────────────────────────────────────────────────

export function resolveServerName(user: { name?: string } | null | undefined): string {
    return user?.name || "Serveur";
}

export interface SplitInfo {
    label: string;
    partials: { amountInMicrounits: number; guest: number; method?: string }[] | undefined;
}

export function getSplitInfo(
    opts: { split?: boolean } | undefined,
    payments: { amountInMicrounits: number; guest: number; method?: string }[]
): SplitInfo {
    return {
        label: opts?.split ? "Paiement fractionné validé" : "Paiement validé",
        partials: opts?.split ? payments : undefined,
    };
}
