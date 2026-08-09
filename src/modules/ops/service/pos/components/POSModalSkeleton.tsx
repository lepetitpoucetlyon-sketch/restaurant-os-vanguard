"use client";

import React from "react";

/**
 * 🏛️ POS Modal Skeleton — Grade X
 * Lightweight placeholder displayed during dynamic loading of heavy POS dialogs.
 */
export function POSModalSkeleton() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pulse">
            <div className="w-full max-w-lg bg-surface-card dark:bg-surface-card/10 border border-border/40 rounded-[36px] p-8 space-y-6 shadow-premium">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between">
                    <div className="h-6 w-1/3 bg-bg-tertiary/60 rounded-full" />
                    <div className="w-8 h-8 bg-bg-tertiary/60 rounded-full" />
                </div>

                {/* Body Content Skeleton */}
                <div className="space-y-4 py-4">
                    <div className="h-20 w-full bg-bg-tertiary/40 rounded-[24px]" />
                    <div className="h-12 w-full bg-bg-tertiary/40 rounded-[20px]" />
                    <div className="grid grid-cols-2 gap-3">
                        <div className="h-12 bg-bg-tertiary/40 rounded-[20px]" />
                        <div className="h-12 bg-bg-tertiary/40 rounded-[20px]" />
                    </div>
                </div>

                {/* Footer Action Skeleton */}
                <div className="h-14 w-full bg-accent-gold/20 rounded-full" />
            </div>
        </div>
    );
}
