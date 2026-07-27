"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/ui.foundations";;
import { motion, AnimatePresence, PanInfo, useDragControls } from "framer-motion";
import { modalBackdrop, modalCinematic, easing, drawerVariants, mobileBackdrop } from "@/shared/utils/motion";
import { useHasMounted, useIsMobile } from "@/shared/hooks";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
    showClose?: boolean;
    size?: "sm" | "md" | "lg" | "xl" | "full";
    variant?: "default" | "premium";
    /** Force desktop modal even on mobile */
    forceDesktop?: boolean;
    noPadding?: boolean;
}

const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    full: "max-w-[95vw]"
};

// Mobile sheet sizes based on modal size
const mobileSizeClasses = {
    sm: "max-h-[60vh]",
    md: "max-h-[80vh]",
    lg: "max-h-[90vh]",
    xl: "max-h-[95vh]",
    full: "h-[95vh]"
};

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    className,
    showClose = true,
    size = "md",
    variant = "default",
    forceDesktop = false,
    noPadding = false
}: ModalProps) {
    const mounted = useHasMounted();
    const isMobile = useIsMobile();
    const dragControls = useDragControls();

    const shouldRenderAsSheet = isMobile && !forceDesktop;

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    const handleDragEnd = (_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {

        if (info.offset.y > 100 && info.velocity.y > 0) {
            onClose();
        }
    };

    if (!mounted) return null;

    // ========================================
    // MOBILE: Render as Bottom Sheet
    // ========================================
    if (shouldRenderAsSheet) {
        return createPortal(
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center">
                        {/* Backdrop */}
                        <motion.div
                            variants={mobileBackdrop}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            onClick={onClose}
                            className="absolute inset-0 bg-surface-sidebar/50 backdrop-blur-sm"
                        />

                        {/* Sheet */}
                        <motion.div
                            variants={drawerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            drag="y"
                            dragControls={dragControls}
                            dragConstraints={{ top: 0 }}
                            dragElastic={{ top: 0, bottom: 0.5 }}
                            onDragEnd={handleDragEnd}
                            className={cn(
                                "relative w-full bg-bg-primary rounded-t-[2rem] shadow-2xl overflow-hidden",
                                mobileSizeClasses[size],
                                className
                            )}
                        >
                            {/* Drag Handle */}
                            <div
                                onPointerDown={(e) => dragControls.start(e)}
                                className="flex justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing"
                            >
                                <div className="w-12 h-1.5 bg-border rounded-full" />
                            </div>

                            {/* Header */}
                            {title && (
                                <div className="px-6 py-3 border-b border-border flex items-center justify-between">
                                    <h3 className="text-xl font-serif font-semibold text-text-primary tracking-tight">
                                        {title}
                                    </h3>
                                    {showClose && (
                                        <button
                                            onClick={onClose}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-all"
                                        >
                                            <X strokeWidth={2} className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Content */}
                            <div className={cn("overflow-auto elegant-scrollbar", !noPadding && "p-6")} style={{ maxHeight: "calc(100% - 80px)" }}>
                                {children}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>,
            document.body
        );
    }

    // ========================================
    // DESKTOP: Render as Center Modal
    // ========================================
    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        variants={modalBackdrop}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                        className="absolute inset-0 bg-surface-sidebar/40 backdrop-blur-xl"
                    />

                    {/* Modal Content */}
                    <motion.div
                        variants={modalCinematic}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className={cn(
                            "relative w-full rounded-[2.5rem] shadow-[0_32px_128px_rgba(0,0,0,0.3)] overflow-hidden",
                            "border border-border/10",
                            variant === "premium"
                                ? "bg-bg-secondary/90 backdrop-blur-2xl"
                                : "bg-bg-secondary",
                            sizeClasses[size],
                            className
                        )}
                    >

                        {title && (
                            <div className="px-10 pt-10 pb-2 flex items-center justify-between">
                                <motion.div
                                    initial={{ opacity: 0, x: -30, filter: "blur(10px)" }}
                                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                                    transition={{ delay: 0.3, duration: 0.6, ease: easing.easeOutExpo }}
                                >
                                    <h3 className="text-3xl font-serif font-black text-text-primary tracking-tight">
                                        {title}
                                    </h3>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: 48 }}
                                        transition={{ delay: 0.6, duration: 0.8, ease: easing.easeOutExpo }}
                                        className="h-1 bg-accent mt-2 rounded-full opacity-50"
                                    />
                                </motion.div>
                                {showClose && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.4, type: "spring", damping: 12 }}
                                        whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.05)" }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={onClose}
                                        className="w-12 h-12 flex items-center justify-center rounded-2xl transition-all text-text-muted hover:text-text-primary hover:rotate-90 duration-300"
                                    >
                                        <X strokeWidth={2} className="w-6 h-6" />
                                    </motion.button>
                                )}
                            </div>
                        )}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            className={cn(!noPadding && "p-10")}
                        >
                            {children}
                        </motion.div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
