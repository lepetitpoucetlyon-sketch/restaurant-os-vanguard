"use client";

import { motion } from "framer-motion";

function SkeletonCard({ className }: { className?: string }) {
    return (
        <div className={`bg-white/40 dark:bg-bg-secondary/40 border border-border/40 rounded-3xl ${className} relative overflow-hidden`}>
            {/* Shimmer */}
            <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
            />
        </div>
    );
}

export default function FinanceLoading() {
    return (
        <div className="flex flex-1 flex-col bg-bg-primary h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] overflow-hidden relative p-4 md:p-10 space-y-8">

            <div className="flex justify-between items-center">
                <SkeletonCard className="h-10 w-64 !bg-transparent !border-none" />
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SkeletonCard className="h-32 w-full opacity-60" />
                <SkeletonCard className="h-32 w-full opacity-60" />
                <SkeletonCard className="h-32 w-full opacity-60" />
                <SkeletonCard className="h-32 w-full opacity-60" />
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-[400px]">
                <SkeletonCard className="lg:col-span-2 h-full opacity-70" />
                <SkeletonCard className="h-full opacity-70" />
            </div>
        </div>
    );
}
