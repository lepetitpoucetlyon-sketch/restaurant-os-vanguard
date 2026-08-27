"use client";

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock } from "lucide-react";
import { cn } from "@/lib/ui.foundations";

interface PinModalProps {
    isOpen: boolean;
    title: string;
    onConfirm: (pin: string) => void;
    onClose: () => void;
    error?: string;
}

function sanitizePinDigit(value: string): string {
    return value.replace(/\D/g, "").slice(-1);
}

function parsePastedPin(pasteText: string): string[] | null {
    const cleaned = pasteText.replace(/\D/g, "").slice(0, 4);
    return cleaned.length === 4 ? cleaned.split("") : null;
}

interface PinDigitInputProps {
    inputRef: React.RefObject<HTMLInputElement | null>;
    digit: string;
    hasError: boolean;
    onChange: (val: string) => void;
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
}

function PinDigitInput({ inputRef, digit, hasError, onChange, onKeyDown }: PinDigitInputProps) {
    const borderCls = hasError
        ? "border-status-error text-status-error"
        : digit
        ? "border-accent-gold text-text-primary shadow-lg shadow-accent-gold/15"
        : "border-border text-text-muted";

    return (
        <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            autoComplete="off"
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            className={cn(
                "h-16 w-12 text-center text-2xl font-black font-mono rounded-2xl border-2 bg-bg-primary outline-none transition-all duration-200 caret-transparent select-none",
                borderCls,
                "focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold"
            )}
        />
    );
}

function PinFeedbackText({ error }: { error?: string }) {
    if (error) {
        return (
            <motion.p
                key="error"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center text-micro font-bold text-status-error uppercase tracking-wider mb-4"
            >
                {error}
            </motion.p>
        );
    }
    return (
        <p
            key="hint"
            className="text-center text-nano text-text-muted uppercase tracking-[0.3em] mb-4"
        >
            Saisissez votre code à 4 chiffres
        </p>
    );
}

export function PinModal({ isOpen, title, onConfirm, onClose, error }: PinModalProps) {
    const [digits, setDigits] = useState<string[]>(["", "", "", ""]);

    const ref0 = useRef<HTMLInputElement>(null);
    const ref1 = useRef<HTMLInputElement>(null);
    const ref2 = useRef<HTMLInputElement>(null);
    const ref3 = useRef<HTMLInputElement>(null);
    const inputRefs = [ref0, ref1, ref2, ref3];

    useEffect(() => {
        if (isOpen) {
            setDigits(["", "", "", ""]);
            const timer = setTimeout(() => inputRefs[0].current?.focus(), 120);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    useEffect(() => {
        if (error) {
            setDigits(["", "", "", ""]);
            const timer = setTimeout(() => inputRefs[0].current?.focus(), 60);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const submit = (pinDigits: string[]) => {
        const pin = pinDigits.join("");
        if (pin.length === 4) onConfirm(pin);
    };

    const handleDigitChange = (index: number, value: string) => {
        const digit = sanitizePinDigit(value);
        const next = [...digits];
        next[index] = digit;
        setDigits(next);

        if (!digit) return;
        if (index < 3) {
            inputRefs[index + 1].current?.focus();
        } else {
            setTimeout(() => submit(next), 80);
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !digits[index] && index > 0) {
            const next = [...digits];
            next[index - 1] = "";
            setDigits(next);
            inputRefs[index - 1].current?.focus();
        } else if (e.key === "Escape") {
            onClose();
        } else if (e.key === "Enter") {
            submit(digits);
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        const parsed = parsePastedPin(e.clipboardData.getData("text"));
        if (parsed) {
            setDigits(parsed);
            inputRefs[3].current?.focus();
            setTimeout(() => submit(parsed), 80);
        }
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="pin-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm"
                    onClick={handleOverlayClick}
                >
                    <motion.div
                        key="pin-card"
                        role="dialog"
                        aria-modal="true"
                        aria-label={title}
                        initial={{ opacity: 0, scale: 0.88, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.88, y: 24 }}
                        transition={{ type: "spring", stiffness: 440, damping: 32 }}
                        className="bg-surface-card border border-border rounded-[2rem] p-8 w-[340px] shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-accent-gold/10 flex items-center justify-center shrink-0">
                                    <Lock className="w-5 h-5 text-accent-gold" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black uppercase tracking-widest text-text-primary leading-none">
                                        {title}
                                    </h2>
                                    <p className="text-nano text-text-muted uppercase tracking-wider mt-1">
                                        Autorisation PIN requise
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                                aria-label="Fermer"
                            >
                                <X className="w-4 h-4" aria-hidden="true" />
                            </button>
                        </div>

                        {/* PIN digit boxes */}
                        <div
                            className="flex gap-3 justify-center mb-5"
                            onPaste={handlePaste}
                        >
                            {digits.map((digit, index) => (
                                <PinDigitInput
                                    key={index}
                                    inputRef={inputRefs[index]}
                                    digit={digit}
                                    hasError={Boolean(error)}
                                    onChange={(val) => handleDigitChange(index, val)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                />
                            ))}
                        </div>

                        {/* Error state */}
                        <AnimatePresence mode="wait">
                            <PinFeedbackText error={error} />
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
