export interface POSSettings {
    currency: string;
    priceFormat: 'with_cents' | 'rounded';
    displayMode: 'ht' | 'ttc';
    roundingRule: 'none' | 'nearest_5' | 'nearest_10';
    serviceMode: 'table' | 'counter' | 'delivery' | 'mixed';
    buttonSize: 'small' | 'medium' | 'large';
    showImages: boolean;
    theme: 'light' | 'dark';
    notificationSound: boolean;
    autoPrintReceipt: boolean;
    receiptCopies: number;
    tipsEnabled: boolean;
    tipSuggestions: number[];
}

export interface PaymentMethod {
    id: string;
    name: string;
    type: 'cash' | 'card' | 'amex' | 'meal_voucher' | 'check' | 'transfer' | 'account' | 'digital' | 'voucher';
    enabled: boolean;
    icon?: string;
    order: number;
}

export interface ReceiptTemplate {
    logo?: string;
    restaurantName: string;
    address: string;
    siret: string;
    vatNumber: string;
    welcomeMessage?: string;
    thankYouMessage?: string;
    footer?: string;
    showDetailedTax: boolean;
    qrCodeUrl?: string;
    format: '80mm' | '58mm';
}
