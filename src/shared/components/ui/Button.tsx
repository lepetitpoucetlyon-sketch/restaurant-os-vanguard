import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/ui.foundations";

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
    {
        variants: {
            variant: {
                default: "bg-action-primary text-text-on-primary hover:bg-action-primary-hover shadow-sm",
                destructive: "bg-status-danger text-text-on-primary hover:bg-status-danger/90",
                outline: "border border-border bg-surface-card text-text-primary hover:bg-surface-glass",
                secondary: "bg-surface-glass text-text-primary hover:bg-surface-card",
                ghost: "hover:bg-surface-glass text-text-secondary hover:text-text-primary",
                link: "text-action-primary underline-offset-4 hover:underline",
                success: "bg-status-success text-text-on-primary hover:bg-status-success/90",
            },
            size: {
                default: "h-11 px-6 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-12 rounded-lg px-10 text-sm",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)


export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, ...props }, ref) => {
        const Comp = "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
