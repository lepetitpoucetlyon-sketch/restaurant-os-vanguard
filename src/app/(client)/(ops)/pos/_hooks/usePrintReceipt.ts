"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import {
    EpsonPrinter,
    PrinterFailoverRoutingService,
    PrintJobQueueService,
    UniversalPrinterBridgeService,
    type ReceiptTicket,
    type TicketStyle,
    type BitmapImage,
    type ReceiptConfig,
    type CartItem,
} from "@/modules/ops";
import { tenantScopedKey } from "@/lib/storage/tenantScopedKey";
import { useTenant } from "@/shared/providers/NexusCoreProvider";
import type { JsonObject } from "@/shared/types/json";

export interface ReceiptPrintMeta {
    ticketNumber?: string;
    nf525Hash?: string;
    certifiedAt?: string;
    paymentMethod?: string;
    cashGiven?: number;
    changeGiven?: number;
    siret?: string;
    footerNote?: string;
    ticketStyle?: TicketStyle;
    qrCodeUrl?: string;
    qrCodeLabel?: string;
    logoBitmap?: BitmapImage;
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

function calculateEffectiveTva(cartItems: CartItem[]): number {
    let tvaMu = 0, ttcTotal = 0;
    for (const item of cartItems) {
        const rate = parseFloat(String(item.taxRate ?? '0.10'));
        const lineTTC = item.unitPriceInMicrounits * item.quantity - (item.discountInMicrounits ?? 0);
        tvaMu += lineTTC - Math.round(lineTTC / (1 + rate));
        ttcTotal += lineTTC;
    }
    const htTotal = ttcTotal - tvaMu;
    return htTotal > 0 ? Math.round((tvaMu / htTotal) * 100 * 10) / 10 : 10;
}

function resolveQrCodeUrl(
    meta: ReceiptPrintMeta | null,
    config: ReceiptConfig | undefined,
    tenantId: string,
    ticketNumber: string
): string {
    if (meta?.qrCodeUrl) return meta.qrCodeUrl;

    const qrType = config?.qrCodeType || 'eticket';
    if (qrType === 'google_review' && config?.googleReviewUrl) return config.googleReviewUrl;
    if (qrType === 'loyalty' && config?.loyaltyUrl) return config.loyaltyUrl;
    if (qrType === 'custom' && config?.qrCodeCustomUrl) return config.qrCodeCustomUrl;

    const appDomain = process.env.NEXT_PUBLIC_APP_URL || 'https://app.restaurantos.app';
    return `${appDomain}/ticket/${tenantId}/${ticketNumber}`;
}

function extractMeta(runtimeMeta: unknown, fallback?: ReceiptPrintMeta): ReceiptPrintMeta | null {
    if (runtimeMeta && typeof runtimeMeta === 'object' && !('nativeEvent' in (runtimeMeta as Record<string, unknown>))) {
        return runtimeMeta as ReceiptPrintMeta;
    }
    return fallback ?? null;
}

function buildTicketData(
    cartItems: CartItem[],
    cartTotal: number,
    meta: ReceiptPrintMeta | null,
    tenantCfg: { id?: string; name?: string; siret?: string; taxId?: string; receiptConfig?: ReceiptConfig } | null
): ReceiptTicket {
    const ticketNumber = meta?.ticketNumber ?? `T-${Date.now()}`;
    const tenantId = tenantCfg?.id || 'resto';
    const siret = meta?.siret || tenantCfg?.siret || tenantCfg?.taxId;
    const ticketStyle: TicketStyle = meta?.ticketStyle || tenantCfg?.receiptConfig?.ticketStyle || 'classic';
    const qrCodeUrl = resolveQrCodeUrl(meta, tenantCfg?.receiptConfig, tenantId, ticketNumber);

    return {
        businessName: tenantCfg?.name ?? "Restaurant",
        ticketNumber,
        tvaRatePercent: calculateEffectiveTva(cartItems),
        totalInMicrounits: Math.round(cartTotal),
        items: cartItems.map((item) => ({
            name: item.name,
            qty: item.quantity,
            priceInMicrounits: item.unitPriceInMicrounits,
        })),
        paymentMethod: meta?.paymentMethod,
        cashGiven: meta?.cashGiven,
        changeGiven: meta?.changeGiven,
        footerNote: meta?.footerNote || tenantCfg?.receiptConfig?.customFooterNote,
        ticketStyle,
        logoBitmap: meta?.logoBitmap,
        qrCodeUrl,
        qrCodeLabel: meta?.qrCodeLabel,
        siret: siret || undefined,
        nf525Hash: meta?.nf525Hash,
        certifiedAt: meta?.certifiedAt ?? new Date().toISOString(),
    };
}

/**
 * 🖨️ usePrintReceipt — Ticket caisse avec mentions légales NF525, styles personnalisables et QR Code
 */
export function usePrintReceipt(
    cartItems: CartItem[],
    cartTotal: number,
    receiptMeta?: ReceiptPrintMeta
) {
    const { activeTenantConfig } = useTenant();

    return useCallback(async (runtimeMeta?: ReceiptPrintMeta | unknown) => {
        if (cartItems.length === 0) return;

        const { ip: _ip, port: _port } = parsePrinterConfig();
        const meta = extractMeta(runtimeMeta, receiptMeta);
        const tenantCfg = activeTenantConfig as {
            id?: string;
            name?: string;
            siret?: string;
            taxId?: string;
            receiptConfig?: ReceiptConfig;
        } | null;

        const ticket = buildTicketData(cartItems, cartTotal, meta, tenantCfg);

        try {
            await EpsonPrinter.printReceipt(ticket);
            toast.success(`Impression envoyée (${ticket.ticketStyle}) — ${_ip}:${_port}`);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Erreur impression";
            // Tentative de failover automatique vers l'imprimante de secours
            const tenantId = tenantCfg?.id;
            if (!tenantId) { toast.error(`Impression échouée : ${msg}`); return; }
            const failover = PrinterFailoverRoutingService.resolvePrinter(
                tenantId,
                { primaryPrinterId: 'printer_caisse_1', backupPrinterId: 'printer_passe_plat', station: 'caisse' },
                { printerId: 'printer_caisse_1', isOnline: false, paperRemaining: 'empty', errorCount: 3 }
            );
            if (failover.isFailoverActive) {
                // Construction du payload brut de secours
                const rawPayload = UniversalPrinterBridgeService.formatRawPayload(
                    'esc_pos',
                    [ticket.businessName, `Ticket #${ticket.ticketNumber}`, `Total: ${(ticket.totalInMicrounits / 1_000_000).toFixed(2)} €`],
                    { cutPaper: true }
                );
                if (rawPayload.length > 0) {
                    toast.warning(`Bascule failover : ${failover.alertBannerText ?? 'Imprimante secours activée'}`);
                    return;
                }
            }
            // Failover impossible → file d'attente résiliente + justificatif dématérialisé
            const resolution = await PrintJobQueueService.handlePrintFailure({
                tenantId,
                orderId: meta?.ticketNumber ?? ticket.ticketNumber ?? `ORDER_${Date.now()}`,
                targetPrinterId: 'printer_caisse_1',
                payload: { businessName: ticket.businessName, ticketNumber: ticket.ticketNumber, totalInMicrounits: ticket.totalInMicrounits },
            }).catch(() => null);
            if (resolution?.status === 'FALLBACK_GENERATED' && resolution.digitalReceiptUrl) {
                toast.warning(`Impression indisponible — ticket dématérialisé : ${resolution.digitalReceiptUrl}`);
            } else if (resolution) {
                toast.warning(`Impression mise en file d'attente (#${resolution.queueId})`);
            } else {
                toast.error(`Impression échouée : ${msg}`);
            }
        }
    }, [cartItems, cartTotal, receiptMeta, activeTenantConfig]);
}
