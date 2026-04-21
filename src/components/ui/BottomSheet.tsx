"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, PanInfo, useDragControls } from "framer-motion";
import { cn } from "@/lib/ui.foundations";;
import { drawerVariants, mobileBackdrop, sheetHandleVariants } from "@/lib/motion";
import { X } from "lucide-react";
import { useHasMounted } from "@/hooks";

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    /** Height of sheet: 'auto', 'half', 'full' */
    size?: "auto" | "half" | "full";
    /** Show drag handle at top */
    showHandle?: boolean;
    /** Allow drag to dismiss */
    dragToDismiss?: boolean;
    className?: string;
}

export function BottomSheet({
    isOpen,
    onClose,
    children,
    title,
    subtitle,
    size = "auto",
    showHandle = true,
    dragToDismiss = true,
    className,
}: BottomSheetProps) {
    const mounted = useHasMounted();
    const sheetRef = useRef<HTMLDivElement>(null);
    const dragControls = useDragControls();

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

    const handleDragEnd = (_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {

        if (dragToDismiss && info.offset.y > 150 && info.velocity.y > 0) {
            onClose();
        }
    };

    const sizeClasses = {
        auto: "max-h-[85vh]",
        half: "h-[60vh]",
        full: "h-[96vh]",
    };

    if (!mounted) return null;

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
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Sheet */}
                    <motion.div
                        ref={sheetRef}
                        variants={drawerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        drag={dragToDismiss ? "y" : false}
                        dragControls={dragControls}
                        dragConstraints={{ top: 0 }}
                        dragElastic={{ top: 0, bottom: 0.6 }}
                        onDragEnd={handleDragEnd}
                        className={cn(
                            "relative w-full bg-white dark:bg-bg-secondary rounded-t-[3.5rem] shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden border-t border-white/10",
                            sizeClasses[size],
                            className
                        )}
                    >
                        {/* Drag Handle */}
                        {showHandle && (
                            <div
                                className="flex justify-center pt-5 pb-2 cursor-grab active:cursor-grabbing"
                                onPointerDown={(e) => dragControls.start(e)}
                            >
                                <div className="w-16 h-1.5 bg-border dark:bg-neutral-800 rounded-full" />
                            </div>
                        )}

                        {/* Header */}
                        {(title || subtitle) && (
                            <div className="px-8 pt-4 pb-6 flex items-start justify-between">
                                <div>
                                    {title && (
                                        <h3 className="text-3xl font-serif font-black italic text-text-primary tracking-tighter">
                                            {title}<span className="text-accent-gold not-italic">.</span>
                                        </h3>
                                    )}
                                    {subtitle && (
                                        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mt-1">
                                            {subtitle}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        {/* Content */}
                        <div className="px-8 pb-10 overflow-auto elegant-scrollbar" style={{ maxHeight: "calc(100% - 120px)" }}>
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
