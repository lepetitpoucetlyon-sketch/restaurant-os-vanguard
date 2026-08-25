"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/ui.foundations";

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
    options: SelectOption[];
    placeholder?: string;
    error?: string;
    onChange?: (value: string) => void;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, options, placeholder, error, onChange, ...props }, ref) => {
        return (
            <div className="relative w-full">
                <select
                    className={cn(
                        "flex h-11 w-full appearance-none rounded-xl border bg-surface-card px-4 py-2 pr-10 text-sm text-text-primary",
                        "transition-all outline-none cursor-pointer",
                        "focus:ring-2 focus:ring-accent/40 focus:border-accent",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        error
                            ? "border-status-danger focus:ring-status-danger/30"
                            : "border-border-default hover:border-border-focus",
                        className
                    )}
                    ref={ref}
                    onChange={e => onChange?.(e.target.value)}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                {error && (
                    <p className="mt-1 text-micro text-status-danger">{error}</p>
                )}
            </div>
        );
    }
);
Select.displayName = "Select";

export { Select };
