import type { CartItem } from '../../../../workflow/engine/types';

export type SplitCartItem = CartItem;

export type SplitMode = 'equal' | 'by-item' | 'custom';
export type PaymentMethod = 'card' | 'cash' | 'mobile';

export interface ConvivePayment {
    paid: boolean;
    amount: number;
    method?: PaymentMethod;
}

export interface SplitBillDialogProps {
    isOpen: boolean;
    items: CartItem[];
    total: number;
    coverCount: number;
    onClose: () => void;
    onPaySplit: (amount: number, conviveIndex: number) => void;
    /** Appelé quand toutes les parts sont réglées → scelle la vente (NF525). */
    onSplitComplete?: () => void;
}
