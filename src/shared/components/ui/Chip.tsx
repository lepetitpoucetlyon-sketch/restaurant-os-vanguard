// @wip owner:design-system-team échéance:2026-Q4 — primitive UI shared à adopter (audit orphelins 2026-08-30)
import * as React from "react";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui.foundations";

const chipVariants = cva(
    "inline-flex items-center gap-1.5 rounded-full border font-medium transition-all",
    {
        variants: {
            variant: {
                default:     "bg-accent/10 text-brand border-accent/20 hover:bg-accent/20",
                secondary:   "bg-surface-card text-text-secondary border-border-default hover:border-border-focus",
                destructive: "bg-status-danger/10 text-status-danger border-status-danger/20",
                success:     "bg-status-success/10 text-status-success border-status-success/20",
            },
            size: {
                sm: "px-2.5 py-0.5 text-nano",
                md: "px-3 py-1 text-micro",
                lg: "px-4 py-1.5 text-xs",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "md",
        },
    }
);

export interface ChipProps
    extends React.HTMLAttributes<HTMLSpanElement>,
        VariantProps<typeof chipVariants> {
    /** Callback appelé quand l'utilisateur clique sur ✕ */
    onRemove?: () => void;
    /** Icône affichée à gauche du label */
    icon?: React.ReactNode;
}

export function Chip({ className, variant, size, children, onRemove, icon, ...props }: ChipProps) {
    return (
        <span className={cn(chipVariants({ variant, size }), className)} {...props}>
            {icon && <span className="shrink-0">{icon}</span>}
            {children}
            {onRemove && (
                <button
                    type="button"
                    onClick={e => { e.stopPropagation(); onRemove(); }}
                    className="ml-0.5 shrink-0 rounded-full p-0.5 hover:bg-black/10 transition-colors focus:outline-none"
                    aria-label="Supprimer"
                >
                    <X className="h-3 w-3" />
                </button>
            )}
        </span>
    );
}
