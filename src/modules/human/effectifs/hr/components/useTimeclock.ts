import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { submitTimeclockAction } from "../actions/timeclock.action";
import type { ClockAction } from "../services/timeclock.domain";
import { logger } from "@/lib/logger";

export type FoundUser = { id: string; name: string; role: string; avatar: string | null };

export function useTimeclock(tenantId: string | null) {
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
        } catch (err) {
            logger.error("[Timeclock] Échec lookup PIN", { tenantId, pinLength: pin.length, error: err });
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

    const handleAction = async (
        type: ClockAction, 
        actionLabel: string
    ) => {
        if (!foundUser || isSubmitting) return;
        setIsSubmitting(true);

        try {
            const timestamp = new Date().toISOString();

            const result = await submitTimeclockAction(tenantId || 'default', type, {
                userId: foundUser.id,
                userName: foundUser.name,
                tenantId: tenantId || 'default',
                terminalId: "kiosk-1",
                timestamp,
                pin, // PIN must be passed for Server Action validation
            });

            if (!result.success) {
                throw new Error(result.error);
            }

            toast.success(`${actionLabel} — ${foundUser.name}`);

            // Reset kiosk after 2 s
            setTimeout(() => {
                setFoundUser(null);
                setPin("");
            }, 2000);
        } catch (err) {
            logger.error("[Timeclock] Échec enregistrement pointage", { tenantId, userId: foundUser?.id, type, error: err });
            toast.error("Enregistrement échoué — réessayez");
        } finally {
            setIsSubmitting(false);
        }
    };

    const reset = () => {
        setFoundUser(null);
        setPin("");
    };

    return {
        now,
        pin,
        foundUser,
        isLooking,
        isSubmitting,
        handlePinKey,
        handleAction,
        reset
    };
}
