"use client";

import { motion } from "framer-motion";

function SkeletonCard({ className }: { className?: string }) {
    return (
        <div className={`bg-white/40 dark:bg-bg-secondary/40 border border-border/40 rounded-[2.5rem] ${className} relative overflow-hidden`}>
            {/* Shimmer */}
            <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
            />
        </div>
    );
}

export default function InventoryLoading() {
    return (
        <div className="flex flex-1 flex-col bg-bg-primary h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] overflow-hidden relative p-4 md:p-10 space-y-8 md:space-y-10">
            {/* Cinematic Background Elements */}
            <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-accent-gold/5 blur-[150px] pointer-events-none rounded-full" />

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 min-h-[140px]">
                <SkeletonCard className="h-full w-full opacity-60" />
                <SkeletonCard className="h-full w-full opacity-60" />
                <SkeletonCard className="h-full w-full opacity-60" />
                <SkeletonCard className="h-full w-full opacity-60" />
            </div>

            {/* Main Content Skeleton */}
            <div className="card-premium flex-1 overflow-hidden p-8 md:p-12 space-y-10 opacity-80">
                {/* Search Bar Area */}
                <div className="flex items-center gap-10">
                    <SkeletonCard className="h-14 w-96 rounded-full" />
                    <div className="flex gap-4">
                        <SkeletonCard className="h-12 w-32 rounded-full" />
                        <SkeletonCard className="h-12 w-32 rounded-full" />
                        <SkeletonCard className="h-12 w-32 rounded-full" />
                    </div>
                </div>

                {/* Table Header */}
                <div className="px-8 flex justify-between">
                    <SkeletonCard className="h-4 w-24 rounded-full opacity-30" />
                    <SkeletonCard className="h-4 w-24 rounded-full opacity-30" />
                    <SkeletonCard className="h-4 w-24 rounded-full opacity-30" />
                    <SkeletonCard className="h-4 w-24 rounded-full opacity-30" />
                </div>

                {/* List Items */}
                <div className="space-y-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-32 bg-white/20 dark:bg-bg-tertiary/20 border border-border/20 rounded-[2.5rem] relative overflow-hidden">
                            <motion.div
                                animate={{ opacity: [0.3, 0.6, 0.3] }}
                                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: i * 0.2 }}
                                className="absolute inset-0 bg-white/5"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
