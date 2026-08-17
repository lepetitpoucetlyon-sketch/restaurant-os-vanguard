"use client";

import type { TerminalAdapterType, TerminalConnectionType } from "@/modules/ops/service/pos/infrastructure/payment-terminal/types";
import {
    ADAPTER_LABELS, CONNECTION_LABELS, CONN_ICON,
    adapterNeedsAddress, adapterNeedsMerchantRef,
    type FormData, type WizardStep,
} from "./terminalConstants";

interface TpeAddWizardProps {
    step: WizardStep;
    setStep: (s: WizardStep) => void;
    form: FormData;
    setForm: React.Dispatch<React.SetStateAction<FormData>>;
    onSave: () => void;
    onCancel: () => void;
}

export function TpeAddWizard({ step, setStep, form, setForm, onSave, onCancel }: TpeAddWizardProps) {
    return (
        <div className="rounded-2xl border border-accent-gold/20 bg-accent-gold/5 p-6 space-y-5">
            <div className="flex items-center justify-between">
                <p className="text-[11px] font-black uppercase tracking-widest text-accent-gold">
                    {step === "adapter" ? "1 · Type de terminal" : step === "connection" ? "2 · Connexion" : "3 · Configuration"}
                </p>
                <button
                    onClick={onCancel}
                    className="text-[10px] text-text-muted hover:text-text-primary uppercase tracking-wider font-black"
                >
                    Annuler
                </button>
            </div>

            {step === "adapter" && (
                <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(ADAPTER_LABELS) as TerminalAdapterType[]).map(a => (
                        <button
                            key={a}
                            onClick={() => { setForm(f => ({ ...f, adapter: a })); setStep("connection"); }}
                            className="h-14 rounded-2xl border border-border bg-surface-card text-left px-4 hover:border-accent-gold/40 transition-colors"
                        >
                            <p className="text-[11px] font-black text-text-primary">{ADAPTER_LABELS[a]}</p>
                            {a === "manual" && <p className="text-[9px] text-text-muted">Fallback — pas de TPE physique</p>}
                            {a === "simulator" && <p className="text-[9px] text-text-muted">Tests en développement</p>}
                            {a === "stripe" && <p className="text-[9px] text-text-muted">M2, WisePOS E — BLE / LAN</p>}
                            {a === "sumup" && <p className="text-[9px] text-text-muted">Air (BLE) ou Solo (3G)</p>}
                            {a === "worldline" && <p className="text-[9px] text-text-muted">Ingenico — banques françaises</p>}
                            {a === "adyen" && <p className="text-[9px] text-text-muted">Cloud — bientôt disponible</p>}
                        </button>
                    ))}
                </div>
            )}

            {step === "connection" && (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        {(Object.keys(CONNECTION_LABELS) as TerminalConnectionType[]).map(c => (
                            <button
                                key={c}
                                onClick={() => { setForm(f => ({ ...f, connection: c })); setStep("configure"); }}
                                className="h-12 rounded-2xl border border-border bg-surface-card px-4 flex items-center gap-2 hover:border-accent-gold/40 transition-colors"
                            >
                                <span className="text-text-muted">{CONN_ICON[c]}</span>
                                <span className="text-[11px] font-black text-text-primary">{CONNECTION_LABELS[c]}</span>
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setStep("adapter")} className="text-[10px] text-text-muted hover:text-text-primary uppercase tracking-wider font-black">
                        ← Retour
                    </button>
                </div>
            )}

            {step === "configure" && (
                <div className="space-y-4">
                    <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5">Nom du terminal</label>
                        <input
                            autoFocus
                            type="text"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder={`Ex : Caisse principale (${ADAPTER_LABELS[form.adapter]})`}
                            className="w-full h-11 rounded-2xl border border-border bg-bg-primary px-4 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-gold/50 transition-colors"
                        />
                    </div>
                    {adapterNeedsAddress(form.adapter) && (
                        <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5">
                                {form.adapter === "worldline" ? "IP du terminal (LAN)" : "Reader ID (Stripe)"}
                            </label>
                            <input
                                type="text"
                                value={form.address ?? ""}
                                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                placeholder={form.adapter === "worldline" ? "192.168.1.50" : "tmr_xxxx"}
                                className="w-full h-11 rounded-2xl border border-border bg-bg-primary px-4 text-sm font-mono text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-gold/50 transition-colors"
                            />
                        </div>
                    )}
                    {adapterNeedsMerchantRef(form.adapter) && (
                        <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5">
                                {form.adapter === "worldline" ? "Numéro commerçant (MERCHANT_ID)" : "Affiliate Key SumUp"}
                            </label>
                            <input
                                type="text"
                                value={form.merchantRef ?? ""}
                                onChange={e => setForm(f => ({ ...f, merchantRef: e.target.value }))}
                                placeholder={form.adapter === "worldline" ? "123456789" : "affiliate_xxx"}
                                className="w-full h-11 rounded-2xl border border-border bg-bg-primary px-4 text-sm font-mono text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-gold/50 transition-colors"
                            />
                        </div>
                    )}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.isDefault}
                            onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))}
                            className="rounded"
                        />
                        <span className="text-[11px] font-black uppercase tracking-wider text-text-muted">Définir comme terminal par défaut</span>
                    </label>
                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setStep("connection")} className="px-4 h-10 rounded-xl border border-border text-[11px] font-black uppercase tracking-wider text-text-muted hover:text-text-primary transition-colors">
                            ← Retour
                        </button>
                        <button
                            onClick={onSave}
                            disabled={!form.name.trim()}
                            className="flex-1 h-10 rounded-xl bg-accent-gold text-text-primary text-[11px] font-black uppercase tracking-widest hover:bg-accent-gold/90 transition-colors disabled:opacity-40"
                        >
                            Enregistrer le terminal
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
