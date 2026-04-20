// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/ui.foundations";;
import { ReactNode } from "react";

interface SkeletonProps {
    className?: string;
    variant?: "text" | "circular" | "rectangular" | "rounded";
    width?: string | number;
    height?: string | number;
    animation?: "pulse" | "shimmer" | "none";
}

export function Skeleton({
    className,
    variant = "text",
    width,
    height,
    animation = "pulse",
}: SkeletonProps) {
    const variantClasses = {
        text: "h-4 rounded",
        circular: "rounded-full aspect-square",
        rectangular: "rounded-none",
        rounded: "rounded-2xl",
    };

    const animationClasses = {
        pulse: "animate-pulse",
        shimmer: "animate-shimmer bg-gradient-to-r from-bg-tertiary via-bg-secondary to-bg-tertiary bg-[length:200%_100%]",
        none: "",
    };

    return (
        <div
            className={cn(
                "bg-bg-tertiary",
                variantClasses[variant],
                animationClasses[animation],
                className
            )}
            style={{
                width: typeof width === "number" ? `${width}px` : width,
                height: typeof height === "number" ? `${height}px` : height,
            }}
        />
    );
}

interface CardSkeletonProps {
    variant?: "default" | "stat" | "list-item" | "profile";
    className?: string;
}

export function CardSkeleton({ variant = "default", className }: CardSkeletonProps) {
    if (variant === "stat") {
        return (
            <div className={cn("bg-bg-secondary border border-border rounded-[2rem] p-6", className)}>
                <div className="flex items-start justify-between mb-4">
                    <Skeleton variant="rounded" className="w-12 h-12" />
                    <Skeleton variant="text" className="w-12" />
                </div>
                <Skeleton variant="text" className="w-24 h-8 mb-2" />
                <Skeleton variant="text" className="w-16 h-3" />
            </div>
        );
    }

    if (variant === "list-item") {
        return (
            <div className={cn("bg-bg-secondary border border-border rounded-2xl p-4 flex items-center gap-4", className)}>
                <Skeleton variant="circular" className="w-12 h-12" />
                <div className="flex-1">
                    <Skeleton variant="text" className="w-32 h-4 mb-2" />
                    <Skeleton variant="text" className="w-24 h-3" />
                </div>
                <Skeleton variant="text" className="w-16 h-8" />
            </div>
        );
    }

    if (variant === "profile") {
        return (
            <div className={cn("bg-bg-secondary border border-border rounded-[2.5rem] p-8", className)}>
                <div className="flex items-center gap-6 mb-6">
                    <Skeleton variant="circular" className="w-20 h-20" />
                    <div>
                        <Skeleton variant="text" className="w-40 h-6 mb-2" />
                        <Skeleton variant="text" className="w-24 h-4" />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <Skeleton variant="rounded" className="h-16" />
                    <Skeleton variant="rounded" className="h-16" />
                    <Skeleton variant="rounded" className="h-16" />
                </div>
            </div>
        );
    }

    // default
    return (
        <div className={cn("bg-bg-secondary border border-border rounded-[2rem] p-6", className)}>
            <Skeleton variant="text" className="w-1/3 h-5 mb-4" />
            <Skeleton variant="text" className="w-full h-4 mb-2" />
            <Skeleton variant="text" className="w-5/6 h-4 mb-2" />
            <Skeleton variant="text" className="w-2/3 h-4" />
        </div>
    );
}

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
    className?: string;
}

export function TableSkeleton({ rows = 5, columns = 4, className }: TableSkeletonProps) {
    return (
        <div className={cn("bg-bg-secondary border border-border rounded-2xl overflow-hidden", className)}>
            {/* Header */}
            <div className="flex gap-4 p-4 bg-bg-tertiary border-b border-border">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} variant="text" className="flex-1 h-4" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div
                    key={rowIndex}
                    className="flex gap-4 p-4 border-b border-border last:border-b-0"
                >
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton key={colIndex} variant="text" className="flex-1 h-4" />
                    ))}
                </div>
            ))}
        </div>
    );
}

interface PageSkeletonProps {
    variant?: "dashboard" | "list" | "detail";
    className?: string;
}

export function PageSkeleton({ variant = "dashboard", className }: PageSkeletonProps) {
    if (variant === "list") {
        return (
            <div className={cn("space-y-4", className)}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <Skeleton variant="text" className="w-48 h-8" />
                    <Skeleton variant="rounded" className="w-32 h-10" />
                </div>
                {/* List Items */}
                {Array.from({ length: 5 }).map((_, i) => (
                    <CardSkeleton key={i} variant="list-item" />
                ))}
            </div>
        );
    }

    if (variant === "detail") {
        return (
            <div className={cn("space-y-6", className)}>
                <CardSkeleton variant="profile" />
                <div className="grid grid-cols-2 gap-6">
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
                <CardSkeleton />
            </div>
        );
    }

    // dashboard
    return (
        <div className={cn("space-y-6", className)}>
            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <CardSkeleton key={i} variant="stat" />
                ))}
            </div>
            {/* Main Content */}
            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2">
                    <CardSkeleton />
                </div>
                <CardSkeleton />
            </div>
        </div>
    );
}
