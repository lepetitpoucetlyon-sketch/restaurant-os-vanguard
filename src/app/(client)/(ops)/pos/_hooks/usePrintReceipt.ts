"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { EpsonPrinter } from "@/infrastructure/hardware/printers/EpsonPrinter";
import type { ReceiptTicket } from "@/infrastructure/hardware/printers/EpsonPrinter";
import { tenantScopedKey } from "@/infrastructure/services/storage/tenantScopedKey";
import { useTenant } from "@/shared/providers/NexusCoreProvider";
import type { CartItem } from "@modules/ops/engine/types";

export function usePrintReceipt(cartItems: CartItem[], cartTotal: number) {
    const { activeTenantConfig } = useTenant();

    return useCallback(async () => {
        if (cartItems.length === 0) return;

        const STORAGE_KEY = tenantScopedKey("printer_config");
        let _ip = "192.168.1.100";
        let _port = 8008;
        try {
            const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
            if (raw) {
                const parsed = JSON.parse(raw) as unknown;
                if (typeof parsed === "object" && parsed !== null && "ip" in parsed && typeof (parsed as { ip: unknown }).ip === "string") {
                    _ip = (parsed as { ip: string }).ip;
                }
                if (typeof parsed === "object" && parsed !== null && "port" in parsed && typeof (parsed as { port: unknown }).port === "number") {
                    _port = (parsed as { port: number }).port;
                }
            }
        } catch { /* fallback to defaults */ }

        // Taux TVA effectif : moyenne pondérée multi-taux (10/5.5/20%)
        let tvaMu = 0, ttcTotal = 0;
        for (const item of cartItems) {
            const rate = parseFloat(String(item.taxRate ?? '0.10'));
            const lineTTC = item.unitPriceInMicrounits * item.quantity - (item.discountInMicrounits ?? 0);
            tvaMu += lineTTC - Math.round(lineTTC / (1 + rate));
            ttcTotal += lineTTC;
        }
        const htTotal = ttcTotal - tvaMu;
        const effectiveTvaPercent = htTotal > 0 ? Math.round((tvaMu / htTotal) * 100 * 10) / 10 : 10;

        const ticket: ReceiptTicket = {
            restaurantName: (activeTenantConfig as { name?: string } | null)?.name ?? "Restaurant",
            ticketNumber: `T-${Date.now()}`,
            tvaRatePercent: effectiveTvaPercent,
            totalInMicrounits: Math.round(cartTotal),
            items: cartItems.map((item) => ({
                name: item.name,
                qty: item.quantity,
                priceInMicrounits: item.unitPriceInMicrounits,
            })),
        };

        try {
            await EpsonPrinter.printReceipt(ticket);
            toast.success(`Impression envoyée — ${_ip}:${_port}`);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Erreur impression";
            toast.error(`Impression échouée : ${msg}`);
        }
    }, [cartItems, cartTotal, activeTenantConfig]);
}
