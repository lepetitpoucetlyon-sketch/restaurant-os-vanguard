"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/ui.foundations";;
import { ReactNode } from "react";
import { CheckCircle2, XCircle, AlertCircle, Info, X } from "lucide-react";

type FeedbackType = "success" | "error" | "warning" | "info";

interface FeedbackBannerProps {
    type: FeedbackType;
    title?: string;
    message: string;
    action?: ReactNode;
    onDismiss?: () => void;
    dismissible?: boolean;
    className?: string;
}

const feedbackConfig = {
    success: {
        icon: CheckCircle2,
        bg: "bg-emerald-50 dark:bg-emerald-500/10",
        border: "border-emerald-200 dark:border-emerald-500/20",
        iconColor: "text-emerald-500",
        titleColor: "text-emerald-700 dark:text-emerald-400",
        textColor: "text-emerald-600 dark:text-emerald-300",
    },
    error: {
        icon: XCircle,
        bg: "bg-rose-50 dark:bg-rose-500/10",
        border: "border-rose-200 dark:border-rose-500/20",
        iconColor: "text-rose-500",
        titleColor: "text-rose-700 dark:text-rose-400",
        textColor: "text-rose-600 dark:text-rose-300",
    },
    warning: {
        icon: AlertCircle,
        bg: "bg-amber-50 dark:bg-amber-500/10",
        border: "border-amber-200 dark:border-amber-500/20",
        iconColor: "text-amber-500",
        titleColor: "text-amber-700 dark:text-amber-400",
        textColor: "text-amber-600 dark:text-amber-300",
    },
    info: {
        icon: Info,
        bg: "bg-blue-50 dark:bg-blue-500/10",
        border: "border-blue-200 dark:border-blue-500/20",
        iconColor: "text-blue-500",
        titleColor: "text-blue-700 dark:text-blue-400",
        textColor: "text-blue-600 dark:text-blue-300",
    },
};

export function FeedbackBanner({
    type,
    title,
    message,
    action,
    onDismiss,
    dismissible = true,
    className,
}: FeedbackBannerProps) {
    const config = feedbackConfig[type];
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
                "flex items-start gap-4 p-4 rounded-2xl border",
                config.bg,
                config.border,
                className
            )}
        >
            <div
                className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    config.bg
                )}
            >
                <Icon className={cn("w-5 h-5", config.iconColor)} />
            </div>

            <div className="flex-1 min-w-0">
                {title && (
                    <h4 className={cn("font-bold text-sm mb-1", config.titleColor)}>
                        {title}
                    </h4>
                )}
                <p className={cn("text-sm", config.textColor)}>{message}</p>
                {action && <div className="mt-3">{action}</div>}
            </div>

            {dismissible && onDismiss && (
                <button
                    onClick={onDismiss}
                    className={cn(
                        "p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0",
                        config.iconColor
                    )}
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </motion.div>
    );
}

interface InlineMessageProps {
    type: FeedbackType;
    children: ReactNode;
    size?: "sm" | "md";
    className?: string;
}

export function InlineMessage({
    type,
    children,
    size = "md",
    className,
}: InlineMessageProps) {
    const config = feedbackConfig[type];
    const Icon = config.icon;

    const sizeClasses = {
        sm: "gap-1.5 text-xs",
        md: "gap-2 text-sm",
    };

    const iconSizes = {
        sm: "w-3.5 h-3.5",
        md: "w-4 h-4",
    };

    return (
        <div
            className={cn(
                "flex items-center",
                sizeClasses[size],
                config.textColor,
                className
            )}
        >
            <Icon className={cn(iconSizes[size], config.iconColor)} />
            <span>{children}</span>
        </div>
    );
}

interface ConfirmationDialogProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "default";
    loading?: boolean;
}

export function ConfirmationDialog({
    isOpen,
    onConfirm,
    onCancel,
    title,
    message,
    confirmText = "Confirmer",
    cancelText = "Annuler",
    variant = "default",
    loading = false,
}: ConfirmationDialogProps) {
    const variantClasses = {
        danger: "bg-rose-500 hover:bg-rose-600 text-white",
        warning: "bg-amber-500 hover:bg-amber-600 text-white",
        default: "bg-accent hover:bg-accent/90 text-[#0A0A0A]",
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onCancel}
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-bg-secondary rounded-[2rem] shadow-2xl max-w-md w-full p-8 border border-border"
                    >
                        <h3 className="text-xl font-serif font-bold text-text-primary mb-2">
                            {title}
                        </h3>
                        <p className="text-text-muted mb-6">{message}</p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={onCancel}
                                disabled={loading}
                                className="px-6 py-3 rounded-xl text-sm font-bold text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors disabled:opacity-50"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={loading}
                                className={cn(
                                    "px-6 py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2",
                                    variantClasses[variant]
                                )}
                            >
                                {loading && (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                        className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                                    />
                                )}
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
