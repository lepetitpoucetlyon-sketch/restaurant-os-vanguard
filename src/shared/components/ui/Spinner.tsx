import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui.foundations";

const spinnerVariants = cva(
    "animate-spin rounded-full border-2 border-current border-t-transparent",
    {
        variants: {
            size: {
                xs:  "h-3 w-3",
                sm:  "h-4 w-4",
                md:  "h-6 w-6",
                lg:  "h-8 w-8",
                xl:  "h-12 w-12",
            },
            spinnerColor: {
                default: "text-accent",
                muted:   "text-text-muted",
                white:   "text-white",
                danger:  "text-status-danger",
            },
        },
        defaultVariants: {
            size: "md",
            spinnerColor: "default",
        },
    }
);

type SpinnerVariantProps = VariantProps<typeof spinnerVariants>;

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: SpinnerVariantProps["size"];
    spinnerColor?: SpinnerVariantProps["spinnerColor"];
    /** Texte accessible pour les lecteurs d'écran */
    label?: string;
}

export function Spinner({ className, size, spinnerColor, label = "Chargement…", ...props }: SpinnerProps) {
    return (
        <div role="status" aria-label={label} {...props}>
            <div className={cn(spinnerVariants({ size, spinnerColor }), className)} />
            <span className="sr-only">{label}</span>
        </div>
    );
}
