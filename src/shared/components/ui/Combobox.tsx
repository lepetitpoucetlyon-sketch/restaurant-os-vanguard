// @wip owner:design-system-team échéance:2026-Q4 — primitive DS Combobox à adopter (audit DS 2026-08-30)
"use client";

import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/ui.foundations";

export interface ComboboxOption {
    value: string;
    label: string;
    hint?: string;
    disabled?: boolean;
}

export interface ComboboxProps {
    options: ComboboxOption[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    error?: string;
    disabled?: boolean;
    className?: string;
    /** Filtre custom (par défaut : label + value + hint contient la query, case-insensitive) */
    filter?: (option: ComboboxOption, query: string) => boolean;
    /** Label accessibilité (aria-label) */
    ariaLabel?: string;
}

/**
 * Combobox — primitive DS combinant recherche + sélection (dropdown filtrable).
 * Remplace les patterns raw `<input>` + `<ul>` de suggestions dans l'app.
 * Support clavier natif (↑↓ pour naviguer, Enter pour valider, Esc pour fermer).
 */
export const Combobox = React.forwardRef<HTMLDivElement, ComboboxProps>(
    ({
        options,
        value,
        onChange,
        placeholder = "Sélectionner...",
        searchPlaceholder = "Rechercher…",
        emptyMessage = "Aucun résultat",
        error,
        disabled,
        className,
        filter,
        ariaLabel,
    }, ref) => {
        const [open, setOpen] = React.useState(false);
        const [query, setQuery] = React.useState("");
        const [activeIdx, setActiveIdx] = React.useState(0);
        const inputRef = React.useRef<HTMLInputElement>(null);
        const rootRef = React.useRef<HTMLDivElement>(null);
        React.useImperativeHandle(ref, () => rootRef.current!, []);

        const defaultFilter = (opt: ComboboxOption, q: string) => {
            const needle = q.toLowerCase().trim();
            if (!needle) return true;
            return [opt.label, opt.value, opt.hint].filter(Boolean)
                .some(s => (s as string).toLowerCase().includes(needle));
        };
        const filtered = React.useMemo(
            () => options.filter(o => (filter ?? defaultFilter)(o, query)),
            [options, query, filter]
        );

        const selected = options.find(o => o.value === value);

        React.useEffect(() => {
            if (!open) return;
            const onDocClick = (e: MouseEvent) => {
                if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
            };
            document.addEventListener("mousedown", onDocClick);
            return () => document.removeEventListener("mousedown", onDocClick);
        }, [open]);

        React.useEffect(() => {
            if (open) setTimeout(() => inputRef.current?.focus(), 0);
        }, [open]);

        React.useEffect(() => { setActiveIdx(0); }, [query, open]);

        const handleKey = (e: React.KeyboardEvent) => {
            if (e.key === "Escape") { setOpen(false); return; }
            if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)); return; }
            if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); return; }
            if (e.key === "Enter") {
                e.preventDefault();
                const opt = filtered[activeIdx];
                if (opt && !opt.disabled) { onChange(opt.value); setOpen(false); setQuery(""); }
            }
        };

        return (
            <div ref={rootRef} className={cn("relative w-full", className)}>
                <button
                    type="button"
                    disabled={disabled}
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    aria-label={ariaLabel ?? placeholder}
                    onClick={() => !disabled && setOpen(o => !o)}
                    className={cn(
                        "flex h-11 w-full items-center justify-between rounded-xl border bg-surface-card px-4 py-2 text-sm text-text-primary text-left",
                        "transition-all outline-none",
                        "focus:ring-2 focus:ring-accent/40 focus:border-accent",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        error
                            ? "border-status-danger focus:ring-status-danger/30 focus:border-status-danger"
                            : "border-border-default hover:border-border-focus"
                    )}
                >
                    <span className={cn(!selected && "text-text-muted")}>
                        {selected?.label ?? placeholder}
                    </span>
                    <ChevronDown className="h-4 w-4 text-text-muted shrink-0" />
                </button>

                {open && (
                    <div
                        role="listbox"
                        className="absolute z-50 mt-2 w-full rounded-xl border border-border-default bg-surface-card shadow-lg"
                    >
                        <div className="p-2 border-b border-border-subtle">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    onKeyDown={handleKey}
                                    placeholder={searchPlaceholder}
                                    aria-label={searchPlaceholder}
                                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-hover text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-1 focus:ring-accent"
                                />
                            </div>
                        </div>
                        <ul className="max-h-64 overflow-y-auto py-1">
                            {filtered.length === 0 && (
                                <li className="px-3 py-2 text-sm text-text-muted text-center">{emptyMessage}</li>
                            )}
                            {filtered.map((opt, i) => {
                                const isSelected = opt.value === value;
                                const isActive = i === activeIdx;
                                return (
                                    <li key={opt.value}>
                                        <button
                                            type="button"
                                            role="option"
                                            aria-selected={isSelected}
                                            disabled={opt.disabled}
                                            aria-label={opt.label}
                                            onClick={() => { onChange(opt.value); setOpen(false); setQuery(""); }}
                                            onMouseEnter={() => setActiveIdx(i)}
                                            className={cn(
                                                "flex w-full items-center justify-between px-3 py-2 text-sm text-left",
                                                "transition-colors",
                                                isActive && "bg-surface-hover",
                                                opt.disabled ? "text-text-muted cursor-not-allowed" : "text-text-primary hover:bg-surface-hover"
                                            )}
                                        >
                                            <span className="flex flex-col">
                                                <span>{opt.label}</span>
                                                {opt.hint && <span className="text-micro text-text-muted">{opt.hint}</span>}
                                            </span>
                                            {isSelected && <Check className="h-4 w-4 text-accent shrink-0" />}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
                {error && <p className="mt-1 text-micro text-status-danger">{error}</p>}
            </div>
        );
    }
);
Combobox.displayName = "Combobox";
