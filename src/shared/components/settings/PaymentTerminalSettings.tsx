"use client";

import { useState, useEffect, useCallback } from "react";
import {
    CreditCard, Plus, Trash2, Wifi, Bluetooth, Cloud, Usb,
    CheckCircle2, AlertCircle, Loader2, Star, Zap,
} from "lucide-react";
import { terminalService } from "@/infrastructure/hardware/payment-terminal/PaymentTerminalService";
import { useNotifications } from '@/shared/contexts/NotificationsContext';
import type { TerminalDevice, TerminalAdapterType, TerminalConnectionType, TerminalStatus } from "@/infrastructure/hardware/payment-terminal/types";

// ─── Meta ──────────────────────────────────────────────────────────────────────

const ADAPTER_LABELS: Record<TerminalAdapterType, string> = {
    // Dev
    simulator: "Simulateur (dev)",
    manual:    "Confirmation manuelle",
    // Physical TPE
    stripe:    "Stripe Terminal (M2 / WisePOS E)",
    sumup:     "SumUp (Air BLE / Solo 3G)",
    worldline: "Worldline / Ingenico (banque FR — LAN)",
    adyen:     "Adyen Terminal (V400m / S1F2 / UX300)",
    ingenico:  "Ingenico Direct / PAYONE",
    zettle:    "PayPal Zettle (Reader 2 / Terminal)",
    verifone:  "Verifone Cloud (Carbon 10 / P400)",
    square:    "Square Terminal / Reader",
    // QR / Lien
    sunday:    "Sunday (QR table — paiement mobile)",
    lyfpay:    "Lyf Pay / BNP Paribas (QR)",
    paygreen:  "PayGreen (CB + Titres-Restaurant)",
    // Titres-restaurant
    conecs:    "CONECS (Edenred / Swile / Sodexo / Natixis)",
};

const CONNECTION_LABELS: Record<TerminalConnectionType, string> = {
    bluetooth: "Bluetooth",
    lan:       "Réseau local (LAN)",
    cloud:     "Cloud",
    usb:       "USB",
    qr_link:   "QR / Lien de paiement",
};

const CONN_ICON: Record<TerminalConnectionType, React.ReactNode> = {
    bluetooth: <Bluetooth className="w-4 h-4" />,
    lan:       <Wifi className="w-4 h-4" />,
    cloud:     <Cloud className="w-4 h-4" />,
    usb:       <Usb className="w-4 h-4" />,
    qr_link:   <Zap className="w-4 h-4" />,
};

type FormData = Omit<TerminalDevice, "id">;
type WizardStep = "adapter" | "connection" | "configure";
type TestStatus = "idle" | "testing" | "ok" | "error";

const DEFAULT_FORM: FormData = {
    name: "",
    adapter: "manual",
    connection: "lan",
    address: "",
    merchantRef: "",
    isDefault: false,
    enabled: true,
};

// ─── Main component ────────────────────────────────────────────────────────────

export default function PaymentTerminalSettings() {
    const [devices, setDevices] = useState<TerminalDevice[]>([]);
    const [adding, setAdding] = useState(false);
    const [step, setStep] = useState<WizardStep>("adapter");
    const [form, setForm] = useState<FormData>(DEFAULT_FORM);
    const [statuses, setStatuses] = useState<Record<string, TerminalStatus>>({});
    const [testStatus, setTestStatus] = useState<TestStatus>("idle");
    const { addNotification } = useNotifications();

    const refresh = useCallback(() => {
        setDevices(terminalService.getAll());
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const refreshStatuses = useCallback(() => {
        const s: Record<string, TerminalStatus> = {};
        for (const d of devices) s[d.id] = terminalService.getStatus(d.id);
        setStatuses(s);
    }, [devices]);

    useEffect(() => {
        refreshStatuses();
    }, [refreshStatuses]);

    const handleAdd = () => {
        setForm(DEFAULT_FORM);
        setStep("adapter");
        setAdding(true);
        setTestStatus("idle");
    };

    const handleSave = () => {
        if (!form.name.trim()) return;
        terminalService.add({ ...form, name: form.name.trim() });
        refresh();
        setAdding(false);
    };

    const handleRemove = (id: string) => {
        terminalService.remove(id);
        refresh();
    };

    const handleSetDefault = (id: string) => {
        terminalService.setDefault(id);
        refresh();
    };

    const handleConnect = async (id: string) => {
        try {
            await terminalService.connect(id);
        } catch (err) {
            console.error(err);
            addNotification({ type: 'critical', title: 'Connexion échouée', message: 'Impossible de connecter le terminal de paiement.' });
        } finally {
            refreshStatuses();
        }
    };

    const handleTestCharge = async () => {
        setTestStatus("testing");
        try {
            const result = await terminalService.charge({
                amountInMicrounits: 100_000, // 0.10€
                orderId: `TEST_${Date.now()}`,
                description: "Test terminal",
            });
            setTestStatus(result.status === "approved" ? "ok" : "error");
        } catch {
            setTestStatus("error");
        }
    };

    const adapterNeedsAddress = (a: TerminalAdapterType) => ["stripe", "worldline"].includes(a);
    const adapterNeedsMerchantRef = (a: TerminalAdapterType) => ["worldline", "sumup"].includes(a);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-accent-gold/10 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-accent-gold" />
                    </div>
                    <div>
                        <h2 className="text-base font-black uppercase tracking-widest text-text-primary">Terminaux de paiement</h2>
                        <p className="text-[10px] text-text-muted">Stripe · SumUp · Worldline · Manuel</p>
                    </div>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 px-4 h-9 rounded-xl bg-accent-gold text-text-primary text-[11px] font-black uppercase tracking-wider hover:bg-accent-gold/90 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Ajouter
                </button>
            </div>

            {/* Device list */}
            {devices.length === 0 && !adding && (
                <div className="flex flex-col items-center gap-3 py-12 text-center border border-dashed border-border rounded-2xl">
                    <CreditCard className="w-8 h-8 text-text-muted/40" strokeWidth={1} />
                    <p className="text-sm font-black uppercase tracking-widest text-text-muted">Aucun terminal configuré</p>
                    <p className="text-[10px] text-text-muted/70 max-w-xs">
                        Ajoutez un terminal pour encaisser par carte directement depuis le POS.
                        Sans terminal, le mode Manuel sera utilisé en fallback.
                    </p>
                </div>
            )}

            <div className="space-y-3">
                {devices.map((device) => {
                    const status = statuses[device.id] ?? "disconnected";
                    return (
                        <div
                            key={device.id}
                            className="rounded-2xl border border-border bg-surface-card p-4 flex items-center gap-4"
                        >
                            <div className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center shrink-0">
                                <CreditCard className="w-5 h-5 text-text-muted" strokeWidth={1.5} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-black text-text-primary truncate">{device.name}</p>
                                    {device.isDefault && (
                                        <span className="shrink-0 flex items-center gap-1 px-2 h-5 rounded-full bg-accent-gold/10 text-accent-gold text-[9px] font-black uppercase tracking-wider">
                                            <Star className="w-2.5 h-2.5" /> Défaut
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] text-text-muted mt-0.5">
                                    {ADAPTER_LABELS[device.adapter]} · {CONNECTION_LABELS[device.connection]}
                                    {device.address && ` · ${device.address}`}
                                </p>
                            </div>

                            {/* Status */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                {status === "connected" && <CheckCircle2 className="w-4 h-4 text-status-success" />}
                                {status === "error" && <AlertCircle className="w-4 h-4 text-status-error" />}
                                {status === "disconnected" && <div className="w-2 h-2 rounded-full bg-text-muted/40" />}
                                {status === "busy" && <Loader2 className="w-4 h-4 text-accent-gold animate-spin" />}
                                <span className="text-[10px] text-text-muted capitalize">{status}</span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                                {status === "disconnected" && (
                                    <button
                                        onClick={() => handleConnect(device.id)}
                                        className="px-3 h-7 rounded-lg bg-bg-tertiary text-[10px] font-black uppercase tracking-wider text-text-muted hover:text-text-primary transition-colors"
                                    >
                                        Connecter
                                    </button>
                                )}
                                {!device.isDefault && (
                                    <button
                                        onClick={() => handleSetDefault(device.id)}
                                        className="px-3 h-7 rounded-lg bg-bg-tertiary text-[10px] font-black uppercase tracking-wider text-text-muted hover:text-accent-gold transition-colors"
                                    >
                                        <Star className="w-3 h-3" />
                                    </button>
                                )}
                                <button
                                    onClick={() => handleRemove(device.id)}
                                    className="w-7 h-7 rounded-lg bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-status-error transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Test charge button */}
            {devices.length > 0 && (
                <div className="flex items-center gap-3 pt-2">
                    <button
                        onClick={handleTestCharge}
                        disabled={testStatus === "testing"}
                        className="flex items-center gap-2 px-4 h-9 rounded-xl border border-border text-[11px] font-black uppercase tracking-wider text-text-muted hover:text-text-primary transition-colors"
                    >
                        {testStatus === "testing" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Zap className="w-3.5 h-3.5" />
                        )}
                        Test 0,10 €
                    </button>
                    {testStatus === "ok" && <span className="text-[10px] text-status-success font-black">Approuvé</span>}
                    {testStatus === "error" && <span className="text-[10px] text-status-error font-black">Refusé / erreur</span>}
                </div>
            )}

            {/* Add wizard */}
            {adding && (
                <div className="rounded-2xl border border-accent-gold/20 bg-accent-gold/5 p-6 space-y-5">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-black uppercase tracking-widest text-accent-gold">
                            {step === "adapter" ? "1 · Type de terminal" : step === "connection" ? "2 · Connexion" : "3 · Configuration"}
                        </p>
                        <button
                            onClick={() => setAdding(false)}
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
                                    onClick={handleSave}
                                    disabled={!form.name.trim()}
                                    className="flex-1 h-10 rounded-xl bg-accent-gold text-text-primary text-[11px] font-black uppercase tracking-widest hover:bg-accent-gold/90 transition-colors disabled:opacity-40"
                                >
                                    Enregistrer le terminal
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Env vars reminder */}
            <div className="rounded-2xl border border-border/40 bg-bg-tertiary/30 p-4 space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Variables d'environnement requises</p>
                <div className="space-y-1 font-mono text-[10px] text-text-muted/80">
                    <p><span className="text-accent-gold">Stripe</span> → NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY · STRIPE_SECRET_KEY · STRIPE_TERMINAL_LOCATION_ID</p>
                    <p><span className="text-cyan-400">SumUp</span> → SUMUP_API_KEY · SUMUP_AFFILIATE_KEY</p>
                    <p><span className="text-orange-400">Worldline</span> → WORLDLINE_TERMINAL_IP · WORLDLINE_TERMINAL_PORT · WORLDLINE_MERCHANT_ID</p>
                </div>
            </div>
        </div>
    );
}
