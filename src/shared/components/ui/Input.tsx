import * as React from "react";
import { cn } from "@/lib/ui.foundations";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    /** Icône affichée à gauche */
    iconLeft?: React.ReactNode;
    /** Icône ou action affichée à droite */
    iconRight?: React.ReactNode;
    /** Message d'erreur — change le style de la bordure */
    error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, iconLeft, iconRight, error, ...props }, ref) => {
        return (
            <div className="relative w-full">
                {iconLeft && (
                    <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-muted">
                        {iconLeft}
                    </div>
                )}
                <input
                    type={type}
                    className={cn(
                        "flex h-11 w-full rounded-xl border bg-surface-card px-4 py-2 text-sm text-text-primary placeholder:text-text-muted",
                        "transition-all outline-none",
                        "focus:ring-2 focus:ring-accent/40 focus:border-accent",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        error
                            ? "border-status-danger focus:ring-status-danger/30 focus:border-status-danger"
                            : "border-border-default hover:border-border-focus",
                        iconLeft  && "pl-10",
                        iconRight && "pr-10",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {iconRight && (
                    <div className="absolute inset-y-0 right-3 flex items-center text-text-muted">
                        {iconRight}
                    </div>
                )}
                {error && (
                    <p className="mt-1 text-micro text-status-danger">{error}</p>
                )}
            </div>
        );
    }
);
Input.displayName = "Input";

export { Input };
