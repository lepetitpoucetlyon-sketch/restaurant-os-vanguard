"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { printerService } from "@/modules/ops/service/printers/hardware/PrintingService";
import type { ReceiptTicket } from "@/modules/ops/service/printers/hardware/EpsonPrinter";
import { tenantScopedKey } from "@/lib/storage/tenantScopedKey";
import { useTenant } from "@/kernel/providers/NexusCoreProvider";
import type { CartItem } from "@/modules/ops/workflow/engine/types";
import { JsonObject } from "@/lib/types/json";

function parsePrinterConfig(): { ip: string; port: number } {
    const defaults = { ip: "192.168.1.100", port: 8008 };
    try {
        const raw = typeof window !== "undefined" ? localStorage.getItem(tenantScopedKey("printer_config")) : null;
        if (!raw) return defaults;
        const obj = JSON.parse(raw) as JsonObject;
        return {
            ip: typeof obj.ip === "string" ? obj.ip : defaults.ip,
            port: typeof obj.port === "number" ? obj.port : defaults.port,
        };
    } catch {
        return defaults;
    }
}

export function usePrintReceipt(cartItems: CartItem[], cartTotal: number) {
    const { activeTenantConfig } = useTenant();

    return useCallback(async () => {
        if (cartItems.length === 0) return;

        const { ip: _ip, port: _port } = parsePrinterConfig();

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
            await printerService.printReceipt(ticket);
            toast.success(`Impression envoyée — ${_ip}:${_port}`);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Erreur impression";
            toast.error(`Impression échouée : ${msg}`);
        }
    }, [cartItems, cartTotal, activeTenantConfig]);
}
