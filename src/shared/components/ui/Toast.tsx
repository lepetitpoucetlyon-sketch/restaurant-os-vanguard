"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, X, Info, Sparkles } from 'lucide-react';
import { cn } from "@/lib/ui.foundations";
import { motion, AnimatePresence } from 'framer-motion';
import { toastVariants } from '@/shared/utils/motion';

export type ToastType = 'success' | 'error' | 'info' | 'premium' | 'warning';

interface Toast {
    id: string;
    title?: string;
    description?: string;
    message?: string; // For backward compatibility
    type: ToastType;
    duration: number;
}

interface ToastOptions {
    title: string;
    description?: string;
    type?: ToastType;
    duration?: number;
}

interface ToastContextType {
    showToast: (options: string | ToastOptions, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TOAST_DURATION = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((options: string | ToastOptions, type: ToastType = 'success', durationValue: number = TOAST_DURATION) => {
        const id = Math.random().toString(36).substr(2, 9);
        
        if (typeof options === 'string') {
            setToasts(prev => [...prev, { id, message: options, type, duration: durationValue }]);
        } else {
            setToasts(prev => [...prev, { 
                id, 
                title: options.title, 
                description: options.description, 
                type: options.type || type, 
                duration: options.duration || durationValue 
            }]);
        }
        
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, typeof options === 'string' ? durationValue : (options.duration || durationValue));
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-4 inset-x-4 sm:top-auto sm:inset-x-auto sm:bottom-8 sm:right-8 z-[1000] flex flex-col gap-3 pointer-events-none items-center sm:items-end">
                <AnimatePresence mode="popLayout">
                    {toasts.map(toast => (
                        <motion.div
                            key={toast.id}
                            layout
                            variants={toastVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className={cn(
                                "pointer-events-auto rounded-2xl shadow-2xl border w-full sm:w-auto sm:min-w-[340px] max-w-md backdrop-blur-xl overflow-hidden",
                                toast.type === 'success' ? "bg-bg-primary/95 dark:bg-bg-secondary/95 border-green-100 dark:border-green-900/30" :
                                    toast.type === 'error' ? "bg-bg-primary/95 dark:bg-bg-secondary/95 border-red-100 dark:border-red-900/30" :
                                        toast.type === 'premium' ? "bg-text-primary/95 border-default" :
                                            toast.type === 'warning' ? "bg-bg-primary/95 dark:bg-bg-secondary/95 border-amber-100 dark:border-amber-900/30" :
                                                "bg-bg-primary/95 dark:bg-bg-secondary/95 border-focus dark:border-focus/30"
                            )}
                        >
                            <div className="px-5 py-4 flex items-center gap-4">
                                {/* Icon with pulse animation */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 10, delay: 0.1 }}
                                    className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                        toast.type === 'success' ? "bg-success/10 text-success" :
                                            toast.type === 'error' ? "bg-error/10 text-error" :
                                                toast.type === 'premium' ? "bg-accent text-text-primary" :
                                                    toast.type === 'warning' ? "bg-warning/10 text-warning" :
                                                        "bg-action-primary/10 text-brand"
                                    )}
                                >
                                    {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                                    {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
                                    {toast.type === 'premium' && <Sparkles className="w-5 h-5" />}
                                    {toast.type === 'info' && <Info className="w-5 h-5" />}
                                </motion.div>

                                {/* Message */}
                                <div className="flex-1 min-w-0">
                                    {toast.title && (
                                        <p className={cn(
                                            "text-[13px] font-black tracking-widest uppercase mb-1",
                                            toast.type === 'premium' ? "text-text-primary" : "text-text-primary"
                                        )}>
                                            {toast.title}
                                        </p>
                                    )}
                                    <p className={cn(
                                        "text-[12px] font-bold leading-relaxed opacity-80",
                                        toast.type === 'premium' ? "text-text-primary/80" : "text-text-muted"
                                    )}>
                                        {toast.description || toast.message}
                                    </p>
                                </div>

                                {/* Close button with hover effect */}
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => removeToast(toast.id)}
                                    className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0",
                                        toast.type === 'premium'
                                            ? "text-text-primary/40 hover:text-text-primary hover:bg-surface-card/10"
                                            : "text-text-muted hover:text-text-primary hover:bg-bg-tertiary"
                                    )}
                                >
                                    <X className="w-4 h-4" />
                                </motion.button>
                            </div>

                            {/* Progress bar */}
                            <motion.div
                                initial={{ scaleX: 1 }}
                                animate={{ scaleX: 0 }}
                                transition={{ duration: toast.duration / 1000, ease: "linear" }}
                                style={{ transformOrigin: "left" }}
                                className={cn(
                                    "h-1",
                                    toast.type === 'success' ? "bg-accent" :
                                        toast.type === 'error' ? "bg-status-danger" :
                                            toast.type === 'premium' ? "bg-accent" :
                                                toast.type === 'warning' ? "bg-status-warning" :
                                                    "bg-action-primary"
                                )}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
}
