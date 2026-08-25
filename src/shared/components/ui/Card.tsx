import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui.foundations";

// ── Card CVA ─────────────────────────────────────────────────────────────────
const cardVariants = cva(
  'border transition-all duration-200',
  {
    variants: {
      intent: {
        default:  'bg-surface-card border-border-default shadow-sm',
        elevated: 'bg-surface-card border-border-default shadow-lg hover:shadow-xl',
        glass:    'bg-surface-card/40 backdrop-blur-xl border-white/10',
        ghost:    'bg-transparent border-transparent shadow-none',
        premium:  'bg-surface-card border-border-default shadow-premium ring-1 ring-action-primary/20',
      },
      size: {
        sm: 'p-3 rounded-xl',
        md: 'p-6 rounded-2xl',
        lg: 'p-8 rounded-3xl',
      },
    },
    defaultVariants: {
      intent: 'default',
      size:   'md',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

/**
 * Card — composant de base avec variants CVA.
 * Rétrocompatible : sans `intent`/`size`, se comporte comme avant.
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, intent, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // Fallback pour les usages legacy sans intent/size (rounded-lg + text classes)
        !intent && !size && "rounded-lg border bg-card text-card-foreground shadow-sm",
        intent || size ? cardVariants({ intent, size }) : undefined,
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-6", className)}
        {...props}
    />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn(
            "text-2xl font-semibold leading-none tracking-tight",
            className
        )}
        {...props}
    />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-secondary", className)}
        {...props}
    />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center p-6 pt-0", className)}
        {...props}
    />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }
