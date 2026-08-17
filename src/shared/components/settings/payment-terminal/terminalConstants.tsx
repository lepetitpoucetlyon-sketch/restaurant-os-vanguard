import type { TerminalAdapterType, TerminalConnectionType } from "@/modules/ops/service/pos/infrastructure/payment-terminal/types";
import { Bluetooth, Wifi, Cloud, Usb, Zap } from "lucide-react";

export const ADAPTER_LABELS: Record<TerminalAdapterType, string> = {
    simulator: "Simulateur (dev)",
    manual:    "Confirmation manuelle",
    stripe:    "Stripe Terminal (M2 / WisePOS E)",
    sumup:     "SumUp (Air BLE / Solo 3G)",
    worldline: "Worldline / Ingenico (banque FR — LAN)",
    adyen:     "Adyen Terminal (V400m / S1F2 / UX300)",
    ingenico:  "Ingenico Direct / PAYONE",
    zettle:    "PayPal Zettle (Reader 2 / Terminal)",
    verifone:  "Verifone Cloud (Carbon 10 / P400)",
    square:    "Square Terminal / Reader",
    sunday:    "Sunday (QR table — paiement mobile)",
    lyfpay:    "Lyf Pay / BNP Paribas (QR)",
    paygreen:  "PayGreen (CB + Titres-Restaurant)",
    conecs:    "CONECS (Edenred / Swile / Sodexo / Natixis)",
};

export const CONNECTION_LABELS: Record<TerminalConnectionType, string> = {
    bluetooth: "Bluetooth",
    lan:       "Réseau local (LAN)",
    cloud:     "Cloud",
    usb:       "USB",
    qr_link:   "QR / Lien de paiement",
};

export const CONN_ICON: Record<TerminalConnectionType, React.ReactNode> = {
    bluetooth: <Bluetooth className="w-4 h-4" />,
    lan:       <Wifi className="w-4 h-4" />,
    cloud:     <Cloud className="w-4 h-4" />,
    usb:       <Usb className="w-4 h-4" />,
    qr_link:   <Zap className="w-4 h-4" />,
};

export type FormData = {
    name: string;
    adapter: TerminalAdapterType;
    connection: TerminalConnectionType;
    address: string;
    merchantRef: string;
    isDefault: boolean;
    enabled: boolean;
};

export type WizardStep = "adapter" | "connection" | "configure";
export type TestStatus = "idle" | "testing" | "ok" | "error";

export const DEFAULT_FORM: FormData = {
    name: "",
    adapter: "manual",
    connection: "lan",
    address: "",
    merchantRef: "",
    isDefault: false,
    enabled: true,
};

export const adapterNeedsAddress = (a: TerminalAdapterType) => ["stripe", "worldline"].includes(a);
export const adapterNeedsMerchantRef = (a: TerminalAdapterType) => ["worldline", "sumup"].includes(a);
