import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui.foundations";

const avatarVariants = cva(
    "relative inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden font-semibold select-none",
    {
        variants: {
            size: {
                xs:  "h-6  w-6  text-[9px]",
                sm:  "h-8  w-8  text-[10px]",
                md:  "h-10 w-10 text-xs",
                lg:  "h-12 w-12 text-sm",
                xl:  "h-16 w-16 text-base",
                "2xl": "h-20 w-20 text-lg",
            },
        },
        defaultVariants: { size: "md" },
    }
);

function getInitials(name: string): string {
    return name
        .split(" ")
        .slice(0, 2)
        .map(w => w[0])
        .join("")
        .toUpperCase();
}

function stringToHue(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 360;
}

export interface AvatarProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof avatarVariants> {
    /** URL de la photo */
    src?: string | null;
    /** Nom complet — utilisé pour les initiales et la couleur de fond */
    name?: string;
    /** Fallback quand aucune photo ni nom */
    fallback?: React.ReactNode;
    /** Statut en ligne — affiche un badge coloré */
    status?: "online" | "offline" | "busy" | "away";
}

const STATUS_COLORS = {
    online:  "bg-status-success",
    busy:    "bg-status-danger",
    away:    "bg-status-warning",
    offline: "bg-text-muted",
} as const;

export function Avatar({ className, size, src, name, fallback, status, ...props }: AvatarProps) {
    const [imgError, setImgError] = React.useState(false);
    const initials = name ? getInitials(name) : null;
    const hue = name ? stringToHue(name) : 0;

    return (
        <div className={cn("relative", className)} {...props}>
            <div
                className={cn(avatarVariants({ size }))}
                style={!src || imgError ? { backgroundColor: `hsl(${hue}, 40%, 55%)`, color: "#fff" } : undefined}
            >
                {src && !imgError ? (
                    <img
                        src={src}
                        alt={name ?? "Avatar"}
                        className="h-full w-full object-cover"
                        onError={() => setImgError(true)}
                    />
                ) : initials ? (
                    <span>{initials}</span>
                ) : (
                    fallback ?? <span>?</span>
                )}
            </div>
            {status && (
                <span
                    className={cn(
                        "absolute bottom-0 right-0 block rounded-full ring-2 ring-surface-card",
                        STATUS_COLORS[status],
                        size === "xs" || size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5"
                    )}
                />
            )}
        </div>
    );
}
