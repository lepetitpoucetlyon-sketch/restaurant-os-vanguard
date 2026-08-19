"use client";

import { useState, useEffect } from "react";
import { Wallet, Wifi, Cable, Printer, Hand, CheckCircle2, AlertCircle, Loader2, Save } from "lucide-react";
import { cashDrawerService, type DrawerMode, type DrawerConfig } from "@/modules/ops";
import { cn } from "@/lib/ui.foundations";
import { toast } from "sonner";

// ── Mode definitions ──────────────────────────────────────────────────────────

const MODES: {
    id: DrawerMode;
    label: string;
    description: string;
    icon: React.ReactNode;
    requiresSerial?: boolean;
}[] = [
    {
        id: "printer-kick",
        label: "Via imprimante (ESC/POS)",
        description: "Tiroir branché sur le port DK (RJ11/RJ12) de l'imprimante de ticket. Solution la plus courante.",
        icon: <Printer className="w-5 h-5" />,
    },
    {
        id: "serial",
        label: "Port série (RS-232)",
        description: "Tiroir connecté directement en RS-232 / COM. Nécessite Chrome ou Edge (Web Serial API).",
        icon: <Cable className="w-5 h-5" />,
        requiresSerial: true,
    },
    {
        id: "network",
        label: "Réseau (IP direct)",
        description: "Tiroir réseau autonome avec adresse IP fixe sur le LAN. Ex: APG Cash Drawer NetPRO.",
        icon: <Wifi className="w-5 h-5" />,
    },
    {
        id: "manual",
        label: "Manuel (sans kick physique)",
        description: "Aucun déclenchement automatique. L'opérateur ouvre le tiroir manuellement. Gestion de session uniquement.",
        icon: <Hand className="w-5 h-5" />,
    },
];

type TestStatus = "idle" | "testing" | "ok" | "error";

// ── Component ─────────────────────────────────────────────────────────────────

export default function CashDrawerSettings() {
    const [config, setConfig] = useState<DrawerConfig>({ mode: "printer-kick" });
    const [testStatus, setTestStatus] = useState<TestStatus>("idle");
    const [testError, setTestError] = useState<string | null>(null);
    const [serialSupported, setSerialSupported] = useState(true);

    useEffect(() => {
        setConfig(cashDrawerService.getConfig());
        setSerialSupported(typeof navigator !== "undefined" && "serial" in navigator);
    }, []);

    const handleSave = () => {
        cashDrawerService.save(config);
        toast.success("Configuration tiroir-caisse enregistrée");
    };

    const handleTest = async () => {
        setTestStatus("testing");
        setTestError(null);
        const result = await cashDrawerService.kick();
        if (result.ok) {
            setTestStatus("ok");
        } else {
            setTestStatus("error");
            setTestError(result.error ?? "Erreur inconnue");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-accent-gold/10 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-accent-gold" />
                </div>
                <div>
                    <h2 className="text-base font-black uppercase tracking-widest text-text-primary">Tiroir-caisse</h2>
                    <p className="text-[10px] text-text-muted">Choisissez comment le tiroir est connecté</p>
                </div>
            </div>

            {/* Mode cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MODES.map((m) => {
                    const disabled = m.requiresSerial && !serialSupported;
                    const selected = config.mode === m.id;
                    return (
                        <button
                            key={m.id}
                            disabled={disabled}
                            onClick={() => !disabled && setConfig(c => ({ ...c, mode: m.id }))}
                            className={cn(
                                "relative text-left p-4 rounded-2xl border transition-all",
                                selected
                                    ? "border-accent-gold bg-accent-gold/5 ring-2 ring-accent-gold/20"
                                    : "border-border bg-surface-card hover:border-accent-gold/30",
                                disabled && "opacity-40 cursor-not-allowed"
                            )}
                        >
                            {selected && (
                                <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-accent-gold" />
                            )}
                            <div className={cn("mb-2", selected ? "text-accent-gold" : "text-text-muted")}>
                                {m.icon}
                            </div>
                            <p className="text-[12px] font-black uppercase tracking-wider text-text-primary mb-1">
                                {m.label}
                            </p>
                            <p className="text-[10px] text-text-muted leading-relaxed">
                                {m.description}
                            </p>
                            {disabled && (
                                <p className="text-[9px] text-status-error mt-1 font-black uppercase tracking-wider">
                                    Non supporté sur ce navigateur
                                </p>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Extra config for network mode */}
            {config.mode === "network" && (
                <div className="rounded-2xl border border-border bg-bg-tertiary/40 p-5 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                        Configuration réseau
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5">
                                Adresse IP du tiroir
                            </label>
                            <input
                                type="text"
                                value={config.networkIp ?? ""}
                                onChange={e => setConfig(c => ({ ...c, networkIp: e.target.value }))}
                                placeholder="192.168.1.55"
                                className="w-full h-11 rounded-2xl border border-border bg-bg-primary px-4 font-mono text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-gold/50 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5">
                                Port TCP
                            </label>
                            <input
                                type="number"
                                value={config.networkPort ?? 9100}
                                onChange={e => setConfig(c => ({ ...c, networkPort: Number(e.target.value) }))}
                                placeholder="9100"
                                className="w-full h-11 rounded-2xl border border-border bg-bg-primary px-4 font-mono text-sm text-text-primary focus:outline-none focus:border-accent-gold/50 transition-colors"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Extra config for serial mode */}
            {config.mode === "serial" && (
                <div className="rounded-2xl border border-border bg-bg-tertiary/40 p-5 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                        Configuration série
                    </p>
                    <div className="max-w-[200px]">
                        <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5">
                            Baud rate
                        </label>
                        <select
                            value={config.baudRate ?? 9600}
                            onChange={e => setConfig(c => ({ ...c, baudRate: Number(e.target.value) }))}
                            className="w-full h-11 rounded-2xl border border-border bg-bg-primary px-4 text-sm text-text-primary focus:outline-none focus:border-accent-gold/50 transition-colors"
                        >
                            {[1200, 2400, 4800, 9600, 19200, 38400, 115200].map(b => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                    </div>
                    <p className="text-[9px] text-text-muted">
                        Le navigateur demandera de sélectionner le port COM au premier test.
                    </p>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-5 h-10 rounded-xl bg-accent-gold text-text-primary text-[11px] font-black uppercase tracking-wider hover:bg-accent-gold/90 transition-colors"
                >
                    <Save className="w-3.5 h-3.5" />
                    Enregistrer
                </button>

                <button
                    onClick={handleTest}
                    disabled={testStatus === "testing"}
                    className="flex items-center gap-2 px-5 h-10 rounded-xl border border-border text-[11px] font-black uppercase tracking-wider text-text-muted hover:text-text-primary transition-colors"
                >
                    {testStatus === "testing" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <Wallet className="w-3.5 h-3.5" />
                    )}
                    Tester le tiroir
                </button>

                {testStatus === "ok" && (
                    <div className="flex items-center gap-1.5 text-status-success text-[11px] font-black uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4" />
                        Tiroir ouvert
                    </div>
                )}
                {testStatus === "error" && (
                    <div className="flex items-center gap-1.5 text-status-error text-[11px] font-black uppercase tracking-wider">
                        <AlertCircle className="w-4 h-4" />
                        {testError ?? "Erreur"}
                    </div>
                )}
            </div>

            {/* Note on printer-kick */}
            {config.mode === "printer-kick" && (
                <div className="rounded-2xl border border-border/40 bg-bg-tertiary/30 p-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-1">Note</p>
                    <p className="text-[10px] text-text-muted leading-relaxed">
                        Le tiroir doit être branché sur le port DK de l'imprimante de ticket configurée comme réception. La commande ESC/POS <span className="font-mono text-accent-gold/80">ESC p 0</span> sera envoyée via l'imprimante.
                    </p>
                </div>
            )}
        </div>
    );
}
