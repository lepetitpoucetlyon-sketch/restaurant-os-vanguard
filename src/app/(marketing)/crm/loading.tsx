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

export default function CRMLoading() {
    return (
        <div className="flex h-screen -m-4 md:-m-8 bg-bg-primary overflow-hidden relative">
            {/* Sidebar Skeleton */}
            <div className="w-[380px] bg-bg-secondary border-r border-border p-10 flex flex-col z-20 space-y-10">
                <SkeletonCard className="h-32 w-3/4 rounded-xl opacity-50" />
                <SkeletonCard className="h-16 w-full rounded-full opacity-70" />

                <div className="space-y-4 flex-1">
                    <SkeletonCard className="h-16 w-full rounded-full opacity-60" />
                    <SkeletonCard className="h-16 w-full rounded-full opacity-60" />
                    <SkeletonCard className="h-16 w-full rounded-full opacity-60" />
                    <SkeletonCard className="h-16 w-full rounded-full opacity-60" />
                </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="flex-1 overflow-hidden bg-bg-primary p-12 pt-16 flex flex-col space-y-16">
                {/* Header */}
                <div className="flex justify-between items-center px-4">
                    <SkeletonCard className="h-12 w-64 !bg-transparent !border-none" />
                    <div className="flex gap-4">
                        <SkeletonCard className="h-14 w-32 rounded-2xl" />
                        <SkeletonCard className="h-14 w-40 rounded-2xl" />
                    </div>
                </div>

                {/* List */}
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-2 gap-6 pb-32">
                    {[...Array(6)].map((_, i) => (
                        <SkeletonCard key={i} className="h-40 w-full rounded-[3rem] opacity-80" />
                    ))}
                </div>
            </div>
        </div>
    );
}
