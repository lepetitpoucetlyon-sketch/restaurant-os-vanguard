import { Banknote, CreditCard, Receipt, Wallet, Smartphone } from "lucide-react";

export const PAYMENT_METHODS = [
    { id: 'cash', name: 'Fiat (Espèces)', icon: Banknote, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { id: 'card', name: 'Terminal (CB)', icon: CreditCard, color: 'text-brand', bg: 'bg-action-primary/10', border: 'border-focus/20' },
    { id: 'amex', name: 'Platinum (Amex)', icon: CreditCard, color: 'text-brand', bg: 'bg-action-primary/10', border: 'border-focus/20' },
    { id: 'meal_voucher', name: 'Meal Vouchers', icon: Receipt, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { id: 'check', name: 'Legacy (Chèque)', icon: Wallet, color: 'text-brand', bg: 'bg-action-primary/10', border: 'border-focus/20' },
    { id: 'digital', name: 'NFC Matrix', icon: Smartphone, color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
];
