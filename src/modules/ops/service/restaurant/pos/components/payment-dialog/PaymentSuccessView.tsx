"use client";

import { CheckCircle, Sparkles, Receipt } from "lucide-react";
import { useLanguage } from "@/shared/hooks";

interface PaymentSuccessViewProps {
    certifiedHash: string | null;
}

export function PaymentSuccessView({ certifiedHash }: PaymentSuccessViewProps) {
    const { t } = useLanguage();

    return (
        <div className="flex flex-col items-center justify-center p-16 md:p-24 space-y-10 animate-in fade-in slide-in-from-bottom-12 duration-1000 flex-1">
            <div className="relative">
                <div className="w-32 h-32 bg-accent-gold/10 rounded-full flex items-center justify-center text-accent-gold shadow-premium border border-accent-gold/20">
                    <CheckCircle className="w-16 h-16" strokeWidth={1} />
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-accent-gold rounded-2xl flex items-center justify-center text-text-primary shadow-premium animate-bounce">
                    <Sparkles className="w-5 h-5" />
                </div>
            </div>
            <div className="text-center space-y-4">
                <h2 className="text-4xl font-serif font-black text-text-primary tracking-tighter italic">{t('pos.payment.transaction_success')}</h2>
                <p className="text-nano font-black text-text-muted uppercase tracking-[0.4em]">{t('pos.payment.archive_updated')}</p>
                <div className="mt-6 p-4 bg-surface-glass rounded-2xl border border-accent-gold/20 backdrop-blur-md">
                    <p className="text-nano font-black text-accent-gold/60 uppercase tracking-widest mb-1">NF525 Certified Seal</p>
                    <p className="text-nano font-mono text-accent-gold break-all font-bold">
                        SHA256: {certifiedHash?.substring(0, 32) || 'NOT_AVAILABLE'}...CERTIFIED
                    </p>
                </div>
            </div>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            <div className="flex items-center gap-4 text-nano font-black uppercase text-accent-gold tracking-[0.3em] bg-accent-gold/5 px-6 py-3 rounded-full border border-accent-gold/10">
                <Receipt className="w-4 h-4 ml-[-4px]" />
                {t('pos.payment.generating_receipt')}
            </div>
        </div>
    );
}
