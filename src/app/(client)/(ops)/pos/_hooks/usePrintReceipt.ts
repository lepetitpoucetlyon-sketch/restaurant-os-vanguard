"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { EpsonPrinter } from "@/modules/ops/service/printers/hardware/EpsonPrinter";
import type { ReceiptTicket } from "@/modules/ops/service/printers/hardware/EpsonPrinter";
import { tenantScopedKey } from "@/lib/storage/tenantScopedKey";
import { useTenant } from "@/shared/providers/NexusCoreProvider";
import type { CartItem } from "@/modules/ops/workflow/engine/types";
import { JsonObject } from "@/shared/types/json";

export interface ReceiptPrintMeta {
    ticketNumber?: string;
    nf525Hash?: string;
    certifiedAt?: string;
    paymentMethod?: string;
    cashGiven?: number;
    changeGiven?: number;
    siret?: string;
    footerNote?: string;
}

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

/**
 * 🖨️ usePrintReceipt — Ticket caisse avec mentions légales et fiscales NF525 (V3-NF525-02)
 */
export function usePrintReceipt(
    cartItems: CartItem[],
    cartTotal: number,
    receiptMeta?: ReceiptPrintMeta
) {
    const { activeTenantConfig } = useTenant();

    return useCallback(async (runtimeMeta?: ReceiptPrintMeta) => {
        if (cartItems.length === 0) return;

        const { ip: _ip, port: _port } = parsePrinterConfig();
        const meta = runtimeMeta || receiptMeta;

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

        const tenantCfg = activeTenantConfig as { name?: string; siret?: string; taxId?: string } | null;
        const siret = meta?.siret || tenantCfg?.siret || tenantCfg?.taxId;

        const ticket: ReceiptTicket = {
            businessName: tenantCfg?.name ?? "Restaurant",
            ticketNumber: meta?.ticketNumber ?? `T-${Date.now()}`,
            tvaRatePercent: effectiveTvaPercent,
            totalInMicrounits: Math.round(cartTotal),
            items: cartItems.map((item) => ({
                name: item.name,
                qty: item.quantity,
                priceInMicrounits: item.unitPriceInMicrounits,
            })),
            paymentMethod: meta?.paymentMethod,
            cashGiven: meta?.cashGiven,
            changeGiven: meta?.changeGiven,
            footerNote: meta?.footerNote,
            // Champs de conformité légale NF525
            siret: siret || undefined,
            nf525Hash: meta?.nf525Hash,
            certifiedAt: meta?.certifiedAt ?? new Date().toISOString(),
        };

        try {
            await EpsonPrinter.printReceipt(ticket);
            toast.success(`Impression envoyée — ${_ip}:${_port}`);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Erreur impression";
            toast.error(`Impression échouée : ${msg}`);
        }
    }, [cartItems, cartTotal, receiptMeta, activeTenantConfig]);
}
