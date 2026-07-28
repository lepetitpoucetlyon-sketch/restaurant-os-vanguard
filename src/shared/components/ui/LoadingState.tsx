"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/ui.foundations";;
import { ReactNode } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

type LoadingStateStatus = "idle" | "loading" | "success" | "error";

interface LoadingStateProps {
    status: LoadingStateStatus;
    children: ReactNode;
    loadingText?: string;
    successText?: string;
    errorText?: string;
    onRetry?: () => void;
    overlay?: boolean;
    blur?: boolean;
    className?: string;
}

export function LoadingState({
    status,
    children,
    loadingText = "Chargement...",
    successText = "Terminé !",
    errorText = "Une erreur est survenue",
    onRetry,
    overlay = false,
    blur = true,
    className,
}: LoadingStateProps) {
    const isLoading = status === "loading";
    const isSuccess = status === "success";
    const isError = status === "error";

    const showOverlay = (isLoading || isSuccess || isError) && overlay;

    return (
        <div className={cn("relative", className)}>
            {/* Content */}
            <div
                className={cn(
                    "transition-all duration-300",
                    showOverlay && blur && "blur-sm pointer-events-none"
                )}
            >
                {children}
            </div>

            {/* Overlay States */}
            <AnimatePresence>
                {showOverlay && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center bg-bg-primary/80 backdrop-blur-sm rounded-inherit z-10"
                    >
                        <div className="flex flex-col items-center gap-4 text-center">
                            {isLoading && (
                                <>
                                    <Loader2 className="w-8 h-8 text-accent animate-spin" />
                                    <p className="text-sm font-medium text-text-muted">
                                        {loadingText}
                                    </p>
                                </>
                            )}
                            {isSuccess && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="flex flex-col items-center gap-3"
                                >
                                    <div className="w-12 h-12 rounded-full bg-status-success/10 flex items-center justify-center">
                                        <CheckCircle2 className="w-6 h-6 text-status-success" />
                                    </div>
                                    <p className="text-sm font-medium text-status-success">
                                        {successText}
                                    </p>
                                </motion.div>
                            )}
                            {isError && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="flex flex-col items-center gap-3"
                                >
                                    <div className="w-12 h-12 rounded-full bg-status-danger/10 flex items-center justify-center">
                                        <XCircle className="w-6 h-6 text-status-danger" />
                                    </div>
                                    <p className="text-sm font-medium text-status-danger">
                                        {errorText}
                                    </p>
                                    {onRetry && (
                                        <button
                                            onClick={onRetry}
                                            className="text-xs font-bold uppercase tracking-wider text-accent hover:underline"
                                        >
                                            Réessayer
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

interface SpinnerProps {
    size?: "sm" | "md" | "lg" | "xl";
    color?: "accent" | "white" | "muted";
    className?: string;
}

export function Spinner({ size = "md", color = "accent", className }: SpinnerProps) {
    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-6 h-6",
        lg: "w-8 h-8",
        xl: "w-12 h-12",
    };

    const colorClasses = {
        accent: "text-accent",
        white: "text-text-primary",
        muted: "text-text-muted",
    };

    return (
        <Loader2
            className={cn(
                "animate-spin",
                sizeClasses[size],
                colorClasses[color],
                className
            )}
        />
    );
}

interface LoadingOverlayProps {
    isVisible: boolean;
    text?: string;
    fullScreen?: boolean;
    className?: string;
}

export function LoadingOverlay({
    isVisible,
    text = "Chargement...",
    fullScreen = false,
    className,
}: LoadingOverlayProps) {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                        "flex items-center justify-center bg-bg-primary/90 backdrop-blur-md z-50",
                        fullScreen ? "fixed inset-0" : "absolute inset-0 rounded-inherit",
                        className
                    )}
                >
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full border-4 border-accent/20" />
                            <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-accent border-t-transparent animate-spin" />
                        </div>
                        <p className="text-sm font-medium text-text-muted">{text}</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
