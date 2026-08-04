export type SplitMode = 'equal' | 'by-item' | 'custom';
export type PaymentMethod = 'card' | 'cash' | 'mobile';

export interface ConvivePayment {
    paid: boolean;
    amount: number;
    method?: PaymentMethod;
}
