"use client";

import { useState, useEffect, useCallback } from "react";
import { useAtom } from "jotai";
import { activeTenantIdAtom } from "@/store/pillars/sovereign";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
    LogIn,
    LogOut,
    Coffee,
    Play,
    Delete,
    RotateCcw,
    Clock,
} from "lucide-react";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { NexusEventBus } from "@/shared/eventBus/NexusEventBus";

type FoundUser = { id: string; name: string; role: string; avatar: string | null };

// ─── Types ──────────────────────────────────────────────────────────────────

type ClockAction = "CLOCK_IN" | "CLOCK_OUT" | "BREAK_START" | "BREAK_END";

const ACTION_CONFIG: Record<
    ClockAction,
    { label: string; icon: React.ElementType; color: string }
> = {
    CLOCK_IN:    { label: "Arrivée",      icon: LogIn,   color: "bg-status-success hover:bg-status-success" },
    CLOCK_OUT:   { label: "Départ",       icon: LogOut,  color: "bg-rose-600 hover:bg-status-danger" },
    BREAK_START: { label: "Début pause",  icon: Coffee,  color: "bg-action-primary hover:bg-action-primary" },
    BREAK_END:   { label: "Fin pause",    icon: Play,    color: "bg-sky-600 hover:bg-status-info" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function padDigit(n: number): string {
    return String(n).padStart(2, "0");
}

function formatTime(date: Date): string {
    return `${padDigit(date.getHours())}:${padDigit(date.getMinutes())}:${padDigit(date.getSeconds())}`;
}

function formatDate(date: Date): string {
    return date.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TimeclockDashboard() {
    const [tenantId] = useAtom(activeTenantIdAtom);
    const [now, setNow] = useState(new Date());
    const [pin, setPin] = useState("");
    const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
    const [isLooking, setIsLooking] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Update clock every second
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    // Look up user via API server-side (PIN hashed + rate limit persistant)
    const lookupUser = useCallback(async (enteredPin: string) => {
        setIsLooking(true);
        try {
            const res = await fetch('/api/timeclock/verify-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: enteredPin, terminalId: 'kiosk-1' }),
            });

            if (res.ok) {
                const user = await res.json() as FoundUser;
                setFoundUser(user);
            } else if (res.status === 429) {
                const data = await res.json() as { error: string };
                toast.error(data.error ?? 'Kiosque temporairement verrouillé');
                setPin("");
            } else {
                toast.error('PIN incorrect — réessayez');
                setPin("");
            }
        } catch {
            toast.error("Erreur de connexion — réessayez");
            setPin("");
        } finally {
            setIsLooking(false);
        }
    }, []);

    useEffect(() => {
        if (pin.length === 4) {
            lookupUser(pin);
        }
    }, [pin, lookupUser]);

    const handlePinKey = (key: string) => {
        if (foundUser || isLooking) return;
        if (key === "clear") {
            setPin("");
            return;
        }
        if (key === "back") {
            setPin((p) => p.slice(0, -1));
            return;
        }
        if (pin.length < 4) {
            setPin((p) => p + key);
        }
    };

    const handleAction = async (type: ClockAction) => {
        if (!foundUser || isSubmitting) return;
        setIsSubmitting(true);

        try {
            const idArr = crypto.getRandomValues(new Uint32Array(1));
            const timestamp = new Date().toISOString();

            if (type === 'CLOCK_IN' || type === 'CLOCK_OUT') {
                const eventName = type === 'CLOCK_IN' ? 'staff.clock_in' : 'staff.clock_out';
                await NexusEventBus.emitDurable(eventName, {
                    v: 1,
                    tenantId: tenantId || 'default',
                    userId: foundUser.id,
                    userName: foundUser.name,
                    terminalId: "kiosk-1",
                    timestamp,
                });
            } else {
                // Break logic fallback (hors spec P1, juste pour ne pas casser)
                const entryId = idArr[0].toString(16);
                const shiftPath = tenantId ? `tenants/${tenantId}/shiftEntries/${entryId}` : `shiftEntries/${entryId}`;
                await Nexus.adapter.set(shiftPath, {
                    id: entryId,
                    userId: foundUser.id,
                    userName: foundUser.name,
                    type,
                    timestamp,
                    location: { terminalId: "kiosk-1" },
                });
            }

            toast.success(`${ACTION_CONFIG[type].label} — ${foundUser.name}`);

            // Reset kiosk after 2 s
            setTimeout(() => {
                setFoundUser(null);
                setPin("");
            }, 2000);
        } catch {
            toast.error("Enregistrement échoué — réessayez");
        } finally {
            setIsSubmitting(false);
        }
    };

    const reset = () => {
        setFoundUser(null);
        setPin("");
    };

    // ─── PIN pad ─────────────────────────────────────────────────────────────
    const pinPad = [
        ["1", "2", "3"],
        ["4", "5", "6"],
        ["7", "8", "9"],
        ["clear", "0", "back"],
    ];

    return (
        <div className="fixed inset-0 bg-surface-sidebar flex flex-col items-center justify-center text-text-primary overflow-hidden">
            {/* Ambient gradient */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-sky-900/10 rounded-full blur-[120px]" />
            </div>

            {/* Clock */}
            <div className="relative z-10 text-center mb-12">
                <div className="text-[clamp(4rem,12vw,9rem)] font-mono font-extralight tracking-tight leading-none text-text-primary/90 tabular-nums">
                    {formatTime(now)}
                </div>
                <p className="text-text-primary/30 text-sm font-medium tracking-widest capitalize mt-3">
                    {formatDate(now)}
                </p>
            </div>

            {/* Main card */}
            <AnimatePresence mode="wait">
                {foundUser ? (
                    // ── Employee found — show action panel ───────────────────
                    <motion.div
                        key="user-panel"
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -24 }}
                        className="relative z-10 w-full max-w-sm px-6"
                    >
                        {/* Avatar */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-24 h-24 rounded-3xl mb-4 overflow-hidden border-2 border-white/10 shadow-2xl">
                                {foundUser.avatar ? (
                                    <img
                                        src={foundUser.avatar}
                                        alt={foundUser.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-white/10 flex items-center justify-center text-3xl font-serif italic text-text-primary/60">
                                        {getInitials(foundUser.name)}
                                    </div>
                                )}
                            </div>
                            <h2 className="text-2xl font-serif italic text-text-primary">
                                {foundUser.name}
                            </h2>
                            <p className="text-xs text-text-primary/30 uppercase tracking-widest mt-1 font-bold">
                                {foundUser.role}
                            </p>
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            {(Object.entries(ACTION_CONFIG) as [ClockAction, typeof ACTION_CONFIG["CLOCK_IN"]][]).map(
                                ([type, cfg]) => {
                                    const Icon = cfg.icon;
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => handleAction(type)}
                                            disabled={isSubmitting}
                                            className={`flex flex-col items-center gap-2 py-5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-40 ${cfg.color}`}
                                        >
                                            <Icon className="w-6 h-6" />
                                            {cfg.label}
                                        </button>
                                    );
                                }
                            )}
                        </div>

                        <button
                            onClick={reset}
                            className="flex items-center gap-2 mx-auto mt-6 px-5 py-2 rounded-xl text-text-primary/30 hover:text-text-primary/60 text-xs uppercase tracking-widest transition-colors"
                        >
                            <RotateCcw className="w-3 h-3" />
                            Annuler
                        </button>
                    </motion.div>
                ) : (
                    // ── PIN entry panel ──────────────────────────────────────
                    <motion.div
                        key="pin-panel"
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -24 }}
                        className="relative z-10 w-full max-w-xs px-6"
                    >
                        {/* PIN display */}
                        <div className="flex justify-center gap-4 mb-8">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                                        i < pin.length
                                            ? "bg-white border-white scale-110"
                                            : "border-white/20"
                                    }`}
                                />
                            ))}
                        </div>

                        <p className="text-center text-text-primary/30 text-xs uppercase tracking-[0.3em] mb-6 font-bold">
                            {isLooking ? "Identification..." : "Entrez votre PIN"}
                        </p>

                        {/* PIN pad */}
                        <div className="grid grid-cols-3 gap-3">
                            {pinPad.flat().map((key) => {
                                const isSpecial = key === "clear" || key === "back";
                                const Icon = key === "back" ? Delete : key === "clear" ? RotateCcw : null;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => handlePinKey(key)}
                                        disabled={isLooking}
                                        className={`h-16 rounded-2xl font-mono text-xl font-bold transition-all active:scale-95 disabled:opacity-30 ${
                                            isSpecial
                                                ? "bg-white/5 text-text-primary/40 hover:bg-white/10 text-sm"
                                                : "bg-white/10 text-text-primary hover:bg-white/20"
                                        }`}
                                    >
                                        {Icon ? (
                                            <Icon className="w-5 h-5 mx-auto" />
                                        ) : (
                                            key
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-center gap-2 mt-8 text-text-primary/15">
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px] uppercase tracking-widest font-bold">
                                Pointeuse Kiosque
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
