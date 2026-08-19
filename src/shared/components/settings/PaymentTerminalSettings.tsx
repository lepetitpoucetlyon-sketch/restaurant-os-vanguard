"use client";

import { useState, useEffect, useCallback } from "react";
import { CreditCard, Plus, Loader2, Zap } from "lucide-react";
import { terminalService } from "@/modules/ops";
import { useNotifications } from '@/shared/contexts/NotificationsContext';
import type { TerminalDevice, TerminalStatus } from "@/modules/ops";
import { DEFAULT_FORM, type FormData, type WizardStep, type TestStatus } from "./payment-terminal/terminalConstants";
import { TpeDeviceList } from "./payment-terminal/TpeDeviceList";
import { TpeAddWizard } from "./payment-terminal/TpeAddWizard";

// ─── Orchestrateur ──────────────────────────────────────────────────────────────

export default function PaymentTerminalSettings() {
    const [devices, setDevices] = useState<TerminalDevice[]>([]);
    const [adding, setAdding] = useState(false);
    const [step, setStep] = useState<WizardStep>("adapter");
    const [form, setForm] = useState<FormData>(DEFAULT_FORM);
    const [statuses, setStatuses] = useState<Record<string, TerminalStatus>>({});
    const [testStatus, setTestStatus] = useState<TestStatus>("idle");
    const { addNotification } = useNotifications();

    const refresh = useCallback(() => { setDevices(terminalService.getAll()); }, []);
    useEffect(() => { refresh(); }, [refresh]);

    const refreshStatuses = useCallback(() => {
        const s: Record<string, TerminalStatus> = {};
        for (const d of devices) s[d.id] = terminalService.getStatus(d.id);
        setStatuses(s);
    }, [devices]);
    useEffect(() => { refreshStatuses(); }, [refreshStatuses]);

    const handleAdd = () => { setForm(DEFAULT_FORM); setStep("adapter"); setAdding(true); setTestStatus("idle"); };
    const handleSave = () => { if (!form.name.trim()) return; terminalService.add({ ...form, name: form.name.trim() }); refresh(); setAdding(false); };
    const handleRemove = (id: string) => { terminalService.remove(id); refresh(); };
    const handleSetDefault = (id: string) => { terminalService.setDefault(id); refresh(); };

    const handleConnect = async (id: string) => {
        try { await terminalService.connect(id); }
        catch (err) { console.error(err); addNotification({ type: 'critical', title: 'Connexion échouée', message: 'Impossible de connecter le terminal de paiement.' }); }
        finally { refreshStatuses(); }
    };

    const handleTestCharge = async () => {
        setTestStatus("testing");
        try {
            const result = await terminalService.charge({ amountInMicrounits: 100_000, orderId: `TEST_${Date.now()}`, description: "Test terminal" });
            setTestStatus(result.status === "approved" ? "ok" : "error");
        } catch { setTestStatus("error"); }
    };

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
                <button onClick={handleAdd} className="flex items-center gap-2 px-4 h-9 rounded-xl bg-accent-gold text-text-primary text-[11px] font-black uppercase tracking-wider hover:bg-accent-gold/90 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Ajouter
                </button>
            </div>

            {/* Device list */}
            {!adding && <TpeDeviceList devices={devices} statuses={statuses} onConnect={handleConnect} onSetDefault={handleSetDefault} onRemove={handleRemove} />}

            {/* Test charge */}
            {devices.length > 0 && (
                <div className="flex items-center gap-3 pt-2">
                    <button onClick={handleTestCharge} disabled={testStatus === "testing"} className="flex items-center gap-2 px-4 h-9 rounded-xl border border-border text-[11px] font-black uppercase tracking-wider text-text-muted hover:text-text-primary transition-colors">
                        {testStatus === "testing" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />} Test 0,10 €
                    </button>
                    {testStatus === "ok" && <span className="text-[10px] text-status-success font-black">Approuvé</span>}
                    {testStatus === "error" && <span className="text-[10px] text-status-error font-black">Refusé / erreur</span>}
                </div>
            )}

            {/* Add wizard */}
            {adding && <TpeAddWizard step={step} setStep={setStep} form={form} setForm={setForm} onSave={handleSave} onCancel={() => setAdding(false)} />}

            {/* Env vars reminder */}
            <div className="rounded-2xl border border-border/40 bg-bg-tertiary/30 p-4 space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Variables d&apos;environnement requises</p>
                <div className="space-y-1 font-mono text-[10px] text-text-muted/80">
                    <p><span className="text-accent-gold">Stripe</span> → NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY · STRIPE_SECRET_KEY · STRIPE_TERMINAL_LOCATION_ID</p>
                    <p><span className="text-cyan-400">SumUp</span> → SUMUP_API_KEY · SUMUP_AFFILIATE_KEY</p>
                    <p><span className="text-orange-400">Worldline</span> → WORLDLINE_TERMINAL_IP · WORLDLINE_TERMINAL_PORT · WORLDLINE_MERCHANT_ID</p>
                </div>
            </div>
        </div>
    );
}
