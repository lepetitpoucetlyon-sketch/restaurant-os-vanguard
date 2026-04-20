"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/ui.foundations";;
import { InputHTMLAttributes, forwardRef } from "react";

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
    variant?: "default" | "minimal" | "pill";
    iconPosition?: "left" | "right";
    containerClassName?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
    (
        {
            className,
            containerClassName,
            variant = "default",
            iconPosition = "left",
            placeholder = "Rechercher...",
            ...props
        },
        ref
    ) => {
        const variantClasses = {
            default: "bg-bg-primary border border-border rounded-xl",
            minimal: "bg-bg-tertiary border-0 rounded-lg",
            pill: "bg-bg-primary border border-border rounded-full",
        };

        const inputPadding = iconPosition === "left" ? "pl-12 pr-4" : "pl-4 pr-12";

        return (
            <div className={cn("relative group", containerClassName)}>
                <Search
                    strokeWidth={1.5}
                    className={cn(
                        "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted group-focus-within:text-accent transition-colors",
                        iconPosition === "left" ? "left-4" : "right-4"
                    )}
                />
                <input
                    ref={ref}
                    type="text"
                    placeholder={placeholder}
                    className={cn(
                        "w-full py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all",
                        variantClasses[variant],
                        inputPadding,
                        className
                    )}
                    {...props}
                />
            </div>
        );
    }
);

SearchInput.displayName = "SearchInput";
