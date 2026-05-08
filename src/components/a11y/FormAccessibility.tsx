"use client";

import { cn } from "@/lib/ui.foundations";;
import { ReactNode, forwardRef, useId } from "react";

interface FormFieldProps {
    label: string;
    children: ReactNode;
    error?: string;
    hint?: string;
    required?: boolean;
    className?: string;
}

/**
 * Wrapper accessible pour les champs de formulaire.
 * Gère automatiquement les labels, erreurs et hints avec aria.
 */
export function FormField({
    label,
    children,
    error,
    hint,
    required = false,
    className,
}: FormFieldProps) {
    const id = useId();
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    return (
        <div className={cn("space-y-2", className)}>
            <label
                htmlFor={id}
                className="block text-sm font-medium text-text-primary"
            >
                {label}
                {required && (
                    <span className="text-status-danger ml-1" aria-label="requis">
                        *
                    </span>
                )}
            </label>

            <div
                className="relative"
                aria-describedby={cn(error && errorId, hint && hintId)}
            >
                {children}
            </div>

            {hint && !error && (
                <p id={hintId} className="text-xs text-text-muted">
                    {hint}
                </p>
            )}

            {error && (
                <p
                    id={errorId}
                    className="text-xs text-status-danger flex items-center gap-1"
                    role="alert"
                    aria-live="polite"
                >
                    <span aria-hidden="true">⚠</span>
                    {error}
                </p>
            )}
        </div>
    );
}

interface AccessibleInputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    hint?: string;
}

/**
 * Input accessible avec label intégré.
 */
export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
    ({ label, error, hint, className, required, ...props }, ref) => {
        const id = useId();
        const errorId = `${id}-error`;
        const hintId = `${id}-hint`;

        return (
            <div className="space-y-2">
                <label
                    htmlFor={id}
                    className="block text-sm font-medium text-text-primary"
                >
                    {label}
                    {required && (
                        <span className="text-status-danger ml-1" aria-label="requis">
                            *
                        </span>
                    )}
                </label>

                <input
                    ref={ref}
                    id={id}
                    aria-invalid={!!error}
                    aria-describedby={cn(error && errorId, hint && hintId)}
                    className={cn(
                        "w-full px-4 py-3 bg-bg-primary border rounded-xl text-text-primary placeholder:text-text-muted",
                        "focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all",
                        error ? "border-rose-500" : "border-border",
                        className
                    )}
                    {...props}
                />

                {hint && !error && (
                    <p id={hintId} className="text-xs text-text-muted">
                        {hint}
                    </p>
                )}

                {error && (
                    <p
                        id={errorId}
                        className="text-xs text-status-danger flex items-center gap-1"
                        role="alert"
                    >
                        <span aria-hidden="true">⚠</span>
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

AccessibleInput.displayName = "AccessibleInput";

interface VisuallyHiddenProps {
    children: ReactNode;
}

/**
 * Cache visuellement le contenu tout en le gardant accessible aux lecteurs d'écran.
 */
export function VisuallyHidden({ children }: VisuallyHiddenProps) {
    return (
        <span
            className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
            style={{ clip: "rect(0, 0, 0, 0)" }}
        >
            {children}
        </span>
    );
}

interface SkipLinkProps {
    href?: string;
    children?: ReactNode;
}

/**
 * Lien de saut pour la navigation au clavier.
 */
export function SkipLink({ href = "#main-content", children = "Aller au contenu principal" }: SkipLinkProps) {
    return (
        <a
            href={href}
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-accent focus:text-[#0A0A0A] focus:rounded-lg focus:font-bold focus:text-sm"
        >
            {children}
        </a>
    );
}

interface LiveRegionProps {
    children: ReactNode;
    mode?: "polite" | "assertive";
    atomic?: boolean;
}

/**
 * Région live pour les annonces aux lecteurs d'écran.
 */
export function LiveRegion({ children, mode = "polite", atomic = true }: LiveRegionProps) {
    return (
        <div
            role="status"
            aria-live={mode}
            aria-atomic={atomic}
            className="sr-only"
        >
            {children}
        </div>
    );
}

interface FocusTrapProps {
    children: ReactNode;
    enabled?: boolean;
    returnFocus?: boolean;
}

/**
 * Trap le focus dans un conteneur (pour modals).
 * Note: Pour une implémentation complète, utiliser @radix-ui/react-focus-scope
 */
export function FocusTrap({ children, enabled = true }: FocusTrapProps) {
    // Simplified version - for full implementation use a library
    return <div data-focus-trap={enabled}>{children}</div>;
}
