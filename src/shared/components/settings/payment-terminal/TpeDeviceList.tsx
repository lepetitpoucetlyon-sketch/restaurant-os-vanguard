"use client";

import {
    CreditCard, Star, CheckCircle2, AlertCircle, Loader2, Trash2,
} from "lucide-react";
import type { TerminalDevice, TerminalStatus } from "@/modules/ops";
import { ADAPTER_LABELS, CONNECTION_LABELS } from "./terminalConstants";

interface TpeDeviceListProps {
    devices: TerminalDevice[];
    statuses: Record<string, TerminalStatus>;
    onConnect: (id: string) => void;
    onSetDefault: (id: string) => void;
    onRemove: (id: string) => void;
}

export function TpeDeviceList({ devices, statuses, onConnect, onSetDefault, onRemove }: TpeDeviceListProps) {
    if (devices.length === 0) {
        return (
            <div className="flex flex-col items-center gap-3 py-12 text-center border border-dashed border-border rounded-2xl">
                <CreditCard className="w-8 h-8 text-text-muted/40" strokeWidth={1} />
                <p className="text-sm font-black uppercase tracking-widest text-text-muted">Aucun terminal configuré</p>
                <p className="text-nano text-text-muted/70 max-w-xs">
                    Ajoutez un terminal pour encaisser par carte directement depuis le POS.
                    Sans terminal, le mode Manuel sera utilisé en fallback.
                </p>
            </div>
        );
    }

    return (
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
                                    <span className="shrink-0 flex items-center gap-1 px-2 h-5 rounded-full bg-accent-gold/10 text-accent-gold text-nano font-black uppercase tracking-wider">
                                        <Star className="w-2.5 h-2.5" /> Défaut
                                    </span>
                                )}
                            </div>
                            <p className="text-nano text-text-muted mt-0.5">
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
                            <span className="text-nano text-text-muted capitalize">{status}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                            {status === "disconnected" && (
                                <button
                                    onClick={() => onConnect(device.id)}
                                    className="px-3 h-7 rounded-lg bg-bg-tertiary text-nano font-black uppercase tracking-wider text-text-muted hover:text-text-primary transition-colors"
                                >
                                    Connecter
                                </button>
                            )}
                            {!device.isDefault && (
                                <button
                                    onClick={() => onSetDefault(device.id)}
                                    className="px-3 h-7 rounded-lg bg-bg-tertiary text-nano font-black uppercase tracking-wider text-text-muted hover:text-accent-gold transition-colors"
                                >
                                    <Star className="w-3 h-3" />
                                </button>
                            )}
                            <button
                                onClick={() => onRemove(device.id)}
                                className="w-7 h-7 rounded-lg bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-status-error transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
