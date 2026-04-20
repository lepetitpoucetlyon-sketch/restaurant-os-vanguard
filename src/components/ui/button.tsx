// @ts-nocheck
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/ui.foundations";

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
    {
        variants: {
            variant: {
                default: "bg-accent text-white hover:bg-black dark:hover:bg-emerald-400 shadow-sm",
                destructive: "bg-error text-white hover:bg-error/90",
                outline: "border border-border bg-white dark:bg-neutral-800 text-text-primary hover:bg-bg-tertiary dark:hover:bg-neutral-700",
                secondary: "bg-bg-tertiary text-text-primary hover:bg-neutral-200 dark:hover:bg-neutral-700",
                ghost: "hover:bg-bg-tertiary text-text-secondary hover:text-text-primary",
                link: "text-accent underline-offset-4 hover:underline",
                success: "bg-success text-white hover:bg-success/90",
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
