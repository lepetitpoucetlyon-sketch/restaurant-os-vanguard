"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { EpsonPrinter } from "@/lib/printing/EpsonPrinter";
import type { ReceiptTicket } from "@/lib/printing/EpsonPrinter";
import { tenantScopedKey } from "@/lib/storage/tenantScopedKey";
import type { CartItem } from "@modules/ops/engine/types";

export function usePrintReceipt(cartItems: CartItem[], cartTotal: number) {
    return useCallback(async () => {
        if (cartItems.length === 0) return;

        const STORAGE_KEY = tenantScopedKey("printer_config");
        let _ip = "192.168.1.100";
        let _port = 8008;
        try {
            const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
            if (raw) {
                const parsed = JSON.parse(raw) as unknown;
                if (
                    typeof parsed === "object" && parsed !== null &&
                    "ip" in parsed && typeof (parsed as { ip: unknown }).ip === "string"
                ) {
                    _ip = (parsed as { ip: string }).ip;
                }
                if (
                    typeof parsed === "object" && parsed !== null &&
                    "port" in parsed && typeof (parsed as { port: unknown }).port === "number"
                ) {
                    _port = (parsed as { port: number }).port;
                }
            }
        } catch { /* fallback to defaults */ }

        const ticket: ReceiptTicket = {
            restaurantName: "RESTAURANT OS CORE",
            ticketNumber: `T-${Date.now()}`,
            tvaRatePercent: 10,
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
    }, [cartItems, cartTotal]);
}
