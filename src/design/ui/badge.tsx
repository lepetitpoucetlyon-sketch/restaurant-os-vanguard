import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui.foundations";

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-all",
    {
        variants: {
            variant: {
                default:     "bg-accent/10 text-brand border-accent/20",
                secondary:   "bg-surface-card text-text-secondary border-border-default",
                destructive: "bg-status-danger/10 text-status-danger border-status-danger/20",
                success:     "bg-status-success/10 text-status-success border-status-success/20",
                warning:     "bg-status-warning/10 text-status-warning border-status-warning/20",
                outline:     "border-border-default text-text-secondary bg-transparent",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}
