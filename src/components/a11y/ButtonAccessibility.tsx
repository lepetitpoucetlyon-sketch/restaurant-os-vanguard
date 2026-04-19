"use client";

import { cn } from "@/lib/ui.foundations";;
import { ReactNode, forwardRef, ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";

interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** Label accessible si le bouton ne contient que des icônes */
    ariaLabel?: string;
    /** Indique si le bouton est en état de chargement */
    loading?: boolean;
    /** Texte affiché pendant le chargement */
    loadingText?: string;
}

/**
 * Bouton avec accessibilité renforcée.
 */
export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
    (
        {
            children,
            ariaLabel,
            loading = false,
            loadingText = "Chargement...",
            disabled,
            className,
            ...props
        },
        ref
    ) => {
        return (
            <button
                ref={ref}
                aria-label={ariaLabel}
                aria-busy={loading}
                aria-disabled={disabled || loading}
                disabled={disabled || loading}
                className={cn(
                    "relative inline-flex items-center justify-center gap-2",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    className
                )}
                {...props}
            >
                {loading ? (
                    <>
                        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        <span className="sr-only">{loadingText}</span>
                        {children}
                    </>
                ) : (
                    children
                )}
            </button>
        );
    }
);

AccessibleButton.displayName = "AccessibleButton";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** Label accessible obligatoire pour les boutons icône */
    label: string;
    /** Icône à afficher */
    icon: ReactNode;
    /** Taille du bouton */
    size?: "sm" | "md" | "lg";
}

/**
 * Bouton icône avec label accessible obligatoire.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ label, icon, size = "md", className, ...props }, ref) => {
        const sizeClasses = {
            sm: "w-8 h-8",
            md: "w-10 h-10",
            lg: "w-12 h-12",
        };

        return (
            <button
                ref={ref}
                aria-label={label}
                title={label}
                className={cn(
                    "inline-flex items-center justify-center rounded-full",
                    "bg-bg-tertiary border border-border text-text-muted",
                    "hover:bg-bg-secondary hover:text-text-primary hover:border-accent/40",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                    "transition-all duration-200",
                    sizeClasses[size],
                    className
                )}
                {...props}
            >
                {icon}
            </button>
        );
    }
);

IconButton.displayName = "IconButton";

interface AccessibleLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    /** Indique que le lien ouvre dans une nouvelle fenêtre */
    external?: boolean;
}

/**
 * Lien accessible avec indication automatique pour liens externes.
 */
export const AccessibleLink = forwardRef<HTMLAnchorElement, AccessibleLinkProps>(
    ({ children, external = false, className, ...props }, ref) => {
        const externalProps = external
            ? {
                target: "_blank",
                rel: "noopener noreferrer",
            }
            : {};

        return (
            <a
                ref={ref}
                className={cn(
                    "text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded",
                    className
                )}
                {...externalProps}
                {...props}
            >
                {children}
                {external && (
                    <span className="sr-only"> (s'ouvre dans une nouvelle fenêtre)</span>
                )}
            </a>
        );
    }
);

AccessibleLink.displayName = "AccessibleLink";
