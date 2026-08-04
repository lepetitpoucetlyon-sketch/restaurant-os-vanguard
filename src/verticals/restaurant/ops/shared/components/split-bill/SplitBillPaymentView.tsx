import { Loader2, AlertCircle, User, CreditCard, Banknote, Smartphone, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { formatCurrency } from "@/lib/formatters";
import { SovereignMath } from "@/shared/services/SovereignMath";
import { PaymentMethod } from "./SplitBillTypes";

interface SplitBillPaymentViewProps {
    payingConvive: number;
    getConviveTotal: (conviveIndex: number) => number;
    selectedPaymentMethod: PaymentMethod | null;
    setSelectedPaymentMethod: (method: PaymentMethod) => void;
    terminalState: 'idle' | 'pending' | 'manual_wait' | 'error';
    terminalError: string | null;
    isProcessing: boolean;
    handleConfirmPayment: () => void;
    setPayingConvive: (c: number | null) => void;
    setTerminalState: (state: 'idle') => void;
}

export function SplitBillPaymentView({
    payingConvive,
    getConviveTotal,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    terminalState,
    terminalError,
    isProcessing,
    handleConfirmPayment,
    setPayingConvive,
    setTerminalState
}: SplitBillPaymentViewProps) {
    const { t } = useLanguage();

    return (
        <div className="flex-1 p-16 flex flex-col items-center justify-center space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10">
            <div className="text-center space-y-8">
                <div className="w-24 h-24 rounded-[32px] bg-accent-gold/10 flex items-center justify-center mx-auto mb-8 shadow-premium border border-accent-gold/20">
                    <User className="w-12 h-12 text-accent-gold" strokeWidth={1} />
                </div>
                <h2 className="text-3xl font-serif font-black text-text-primary italic tracking-tighter">{t('pos.split.convive_signature_title')}<br />{t('pos.split.convive')} {payingConvive + 1}</h2>
                <div className="relative">
                    <p className="text-7xl font-serif font-black text-accent-gold italic drop-shadow-glow">{formatCurrency(SovereignMath.toCents(BigInt(getConviveTotal(payingConvive))))}</p>
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-1 bg-accent-gold/20 rounded-full blur-sm" />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6 w-full max-w-2xl">
                {[
                    { id: 'card', name: t('pos.split.methods.card'), icon: CreditCard },
                    { id: 'cash', name: t('pos.split.methods.cash'), icon: Banknote },
                    { id: 'mobile', name: t('pos.split.methods.mobile'), icon: Smartphone }
                ].map((method) => (
                    <button
                        key={method.id}
                        onClick={() => setSelectedPaymentMethod(method.id as PaymentMethod)}
                        className={cn(
                            "flex flex-col items-center gap-6 p-8 rounded-[40px] border transition-all duration-500 group",
                            selectedPaymentMethod === method.id
                                ? "border-accent-gold bg-accent-gold/10 shadow-glow translate-y-[-8px]"
                                : "border-white/5 bg-surface-card/[0.02] hover:border-accent-gold/30 hover:bg-surface-card/[0.05]"
                        )}
                    >
                        <div className={cn(
                            "w-16 h-16 rounded-[22px] flex items-center justify-center transition-all duration-700 shadow-sm",
                            selectedPaymentMethod === method.id ? "bg-accent-gold text-primary rotate-6" : "bg-surface-sidebar/40 text-accent-gold border border-accent-gold/20 group-hover:scale-110"
                        )}>
                            <method.icon className="w-7 h-7" strokeWidth={1.5} />
                        </div>
                        <span className={cn("text-[10px] font-black uppercase tracking-[0.3em] transition-colors", selectedPaymentMethod === method.id ? "text-text-primary" : "text-text-primary/20 group-hover:text-text-primary/40")}>
                            {method.name}
                        </span>
                    </button>
                ))}
            </div>

            <div className="flex flex-col items-center gap-6 w-full max-w-2xl pb-10">
                {terminalState !== 'idle' && (
                    <div className="w-full p-6 rounded-3xl border border-accent-gold/20 bg-accent-gold/5 flex flex-col items-center gap-4 animate-in zoom-in duration-500">
                        {terminalState === 'pending' || terminalState === 'manual_wait' ? (
                            <>
                                <div className="w-12 h-12 rounded-full bg-accent-gold/20 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-accent-gold animate-spin" />
                                </div>
                                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-accent-gold">
                                    {terminalState === 'manual_wait' ? "Veuillez valider sur le TPE physique" : "Connexion au TPE en cours..."}
                                </p>
                            </>
                        ) : terminalState === 'error' ? (
                            <>
                                <div className="w-12 h-12 rounded-full bg-status-error/20 flex items-center justify-center">
                                    <AlertCircle className="w-6 h-6 text-status-error" />
                                </div>
                                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-status-error text-center">
                                    Erreur de paiement<br/>
                                    <span className="text-[9px] opacity-70">{terminalError}</span>
                                </p>
                                <button onClick={() => setTerminalState('idle')} className="px-6 py-2 rounded-full bg-surface-card border border-white/10 text-text-primary/50 text-[10px] font-bold uppercase hover:bg-white/10 transition-colors mt-2">Réessayer</button>
                            </>
                        ) : null}
                    </div>
                )}

                <div className="flex gap-6 w-full">
                    <button
                        onClick={() => { setPayingConvive(null); setTerminalState('idle'); }}
                        disabled={isProcessing}
                        className="flex-1 h-16 rounded-[28px] bg-surface-card/5 text-text-primary/40 font-black text-[11px] uppercase tracking-[0.4em] hover:bg-surface-card/10 hover:text-text-primary transition-all duration-500 border border-subtle disabled:opacity-20"
                    >
                        {t('pos.split.back')}
                    </button>
                    <button
                        onClick={handleConfirmPayment}
                        disabled={!selectedPaymentMethod || isProcessing}
                        className="flex-[2] h-16 rounded-[28px] bg-accent-gold text-primary font-black text-[12px] uppercase tracking-[0.5em] shadow-glow transition-all duration-500 disabled:opacity-20 disabled:grayscale group relative overflow-hidden flex items-center justify-center"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-4">
                            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                            {isProcessing ? "Encaissement..." : t('pos.split.seal_transaction')}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
