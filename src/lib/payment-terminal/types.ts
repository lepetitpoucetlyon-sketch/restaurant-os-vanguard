// ── Payment Terminal — Types ─────────────────────────────────────────────────
// PCI DSS: card data NEVER passes through these types.
// Only the terminal SDK handles PAN/CVV. We receive transaction IDs only.

export type TerminalAdapterType =
  | 'simulator'
  | 'manual'
  // ── Physical TPE ─────────────────────────────────────────────────────────────
  | 'stripe'       // Stripe Terminal (M2, WisePOS E)
  | 'sumup'        // SumUp Air BLE / Solo 3G
  | 'worldline'    // Worldline/Ingenico via banque française (TPAEXT LAN)
  | 'adyen'        // Adyen Terminal API (cloud NEXO)
  | 'ingenico'     // Ingenico direct / PAYONE (hors banque, cloud NEXO)
  | 'zettle'       // PayPal Zettle (lecteur mobile)
  | 'verifone'     // Verifone Carbon / P400 (Cloud Connect)
  | 'square'       // Square Terminal API
  // ── QR / Lien de paiement ────────────────────────────────────────────────────
  | 'sunday'       // Sunday (QR table → client paie sur son tél)
  | 'lyfpay'       // Lyf Pay / BNP Paribas (QR contactless)
  | 'paygreen'     // PayGreen (CB + titres-restaurant + éco-contribution)
  // ── Titres-restaurant ────────────────────────────────────────────────────────
  | 'conecs';      // CONECS (interop Edenred / Swile / Sodexo / Natixis)

export type TerminalConnectionType = 'bluetooth' | 'lan' | 'cloud' | 'usb' | 'qr_link';

/** Catégorie pour regrouper dans l'UI Settings */
export type TerminalCategory = 'physical' | 'qr_link' | 'voucher' | 'dev';
export type TerminalStatus = 'connected' | 'disconnected' | 'pairing' | 'busy' | 'error';
export type PaymentResultStatus = 'approved' | 'declined' | 'cancelled' | 'error' | 'timeout';
export type RefundResultStatus = 'approved' | 'declined' | 'error';

export type PaymentMethod = 'card' | 'contactless' | 'meal_voucher_edenred' | 'meal_voucher_sodexo' | 'meal_voucher_swile';

export interface TerminalDevice {
  id: string;
  name: string;
  adapter: TerminalAdapterType;
  connection: TerminalConnectionType;
  /** LAN: '192.168.1.x:4242', BLE: device.id, Cloud: terminal serial */
  address?: string;
  /** Stripe: location ID, SumUp: affiliate key, Worldline: merchant ID */
  merchantRef?: string;
  isDefault: boolean;
  enabled: boolean;
}

export interface PaymentRequest {
  amountInMicrounits: number;
  currency?: string;               // 'EUR' default
  tipInMicrounits?: number;        // pre-tip from POS (Stripe allows tip on terminal instead)
  tipOnTerminal?: boolean;         // show tip screen on terminal
  orderId: string;
  description?: string;
  allowedMethods?: PaymentMethod[];
}

export interface PaymentResult {
  status: PaymentResultStatus;
  terminalTransactionId?: string;  // for NF525 JournalEntry linkage
  method?: PaymentMethod;
  amountInMicrounits?: number;
  tipInMicrounits?: number;
  receiptData?: {
    cardBrand?: string;            // 'VISA', 'MASTERCARD', 'AMEX' — last 4 only
    cardLast4?: string;
    authCode?: string;
    merchantName?: string;
  };
  error?: string;
}

export interface RefundRequest {
  originalTransactionId: string;
  amountInMicrounits: number;
  reason?: string;
}

export interface RefundResult {
  status: RefundResultStatus;
  refundTransactionId?: string;
  error?: string;
}

export interface IPaymentTerminalAdapter {
  type: TerminalAdapterType;
  connect(device: TerminalDevice): Promise<void>;
  disconnect(): Promise<void>;
  getStatus(): TerminalStatus;
  charge(request: PaymentRequest): Promise<PaymentResult>;
  refund(request: RefundRequest): Promise<RefundResult>;
  cancelCurrent(): Promise<void>;
  /** Returns a human-readable label for settings UI */
  label: string;
  /** Whether this adapter requires credentials (API keys etc) */
  requiresConfig: boolean;
}
