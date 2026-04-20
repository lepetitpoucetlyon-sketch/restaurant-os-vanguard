"use client";

import { motion } from "framer-motion";

function SkeletonCard({ className }: { className?: string }) {
    return (
        <div className={`bg-white/40 dark:bg-bg-secondary/40 border border-border/40 rounded-xl ${className} relative overflow-hidden`}>
            {/* Shimmer */}
            <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
            />
        </div>
    );
}

export default function StaffLoading() {
    return (
        <div className="flex flex-1 flex-col bg-bg-primary h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] overflow-hidden relative p-4 md:p-10 space-y-8">

            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex gap-4">
                    <SkeletonCard className="h-10 w-32 rounded-lg" />
                    <SkeletonCard className="h-10 w-32 rounded-lg" />
                    <SkeletonCard className="h-10 w-32 rounded-lg" />
                </div>
                <SkeletonCard className="h-10 w-32 rounded-lg" />
            </div>

            {/* Staff Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <SkeletonCard key={i} className="h-80 w-full opacity-60" />
                ))}
            </div>

            {/* Footer Activity Panel */}
            <SkeletonCard className="h-64 w-full opacity-60" />
        </div>
    );
}
