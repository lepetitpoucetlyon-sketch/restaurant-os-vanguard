import * as React from "react";
import { cn } from "@/lib/ui.foundations";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    /** Message d'erreur — change le style de la bordure */
    error?: string;
    /** Compteur de caractères visible en bas à droite (nécessite maxLength) */
    showCount?: boolean;
}

/**
 * Textarea — primitive DS multi-ligne cohérente avec Input.
 * Remplace les <textarea className="..."> bruts dans l'app.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, error, showCount, maxLength, value, defaultValue, onChange, ...props }, ref) => {
        const [count, setCount] = React.useState(
            typeof value === "string" ? value.length : typeof defaultValue === "string" ? defaultValue.length : 0
        );

        const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            if (showCount) setCount(e.target.value.length);
            onChange?.(e);
        };

        return (
            <div className="relative w-full">
                <textarea
                    ref={ref}
                    className={cn(
                        "flex min-h-[88px] w-full rounded-xl border bg-surface-card px-4 py-3 text-sm text-text-primary placeholder:text-text-muted",
                        "transition-all outline-none resize-y",
                        "focus:ring-2 focus:ring-accent/40 focus:border-accent",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        error
                            ? "border-status-danger focus:ring-status-danger/30 focus:border-status-danger"
                            : "border-border-default hover:border-border-focus",
                        className
                    )}
                    value={value}
                    defaultValue={defaultValue}
                    onChange={handleChange}
                    maxLength={maxLength}
                    {...props}
                />
                {showCount && maxLength && (
                    <p className="mt-1 text-micro text-text-muted text-right">
                        {count} / {maxLength}
                    </p>
                )}
                {error && (
                    <p className="mt-1 text-micro text-status-danger">{error}</p>
                )}
            </div>
        );
    }
);
Textarea.displayName = "Textarea";

export { Textarea };
