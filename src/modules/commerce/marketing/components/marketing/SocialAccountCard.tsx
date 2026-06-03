"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/ui.foundations";
import { LucideIcon } from "lucide-react";

interface SocialAccountCardProps {
    account: {
        id: string;
        platform: string;
        handle: string;
        followers: number;
        icon?: import("react").ComponentType<{ size?: number; strokeWidth?: number }>;
        gradient: string;
        posts: number;
        engagement: number;
        trend: string;
    };
}

export function SocialAccountCard({ account }: SocialAccountCardProps) {
    const Icon = account.icon as import("react").FC<{ size?: number; strokeWidth?: number }> | undefined;
    return (
        <div className="group relative overflow-hidden bg-surface-card/40 dark:bg-surface-sidebar/40 backdrop-blur-xl border border-default dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all duration-500">
            <div className={cn(
                "absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br rounded-full blur-[80px] opacity-20 group-hover:opacity-30 transition-opacity",
                account.gradient
            )} />

            <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-5">
                        <div className={cn(
                            "w-20 h-20 rounded-[2rem] flex items-center justify-center text-white shadow-lg bg-gradient-to-br transform group-hover:scale-105 group-hover:rotate-3 transition-all duration-500",
                            account.gradient
                        )}>
                            { Icon ? <Icon size={40} strokeWidth={1.5} /> : null }
                        </div>
                        <div>
                            <h3 className="font-serif font-bold text-3xl text-text-primary tracking-tight mb-1">{account.platform}</h3>
                            <p className="text-sm font-medium text-text-muted">{account.handle}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Abonnés', value: (account.followers / 1000).toFixed(1) + 'K', trend: account.trend },
                        { label: 'Publications', value: account.posts, trend: null },
                        { label: 'Engagement', value: account.engagement + '%', trend: '+0.4%' }
                    ].map((stat, idx) => (
                        <div key={idx} className="p-5 bg-surface-card/50 dark:bg-surface-sidebar/20 rounded-2xl border border-subtle backdrop-blur-sm hover:bg-surface-card/80 dark:hover:bg-surface-card/5 transition-colors">
                            <p className="text-3xl font-serif font-medium text-text-primary tracking-tighter tabular-nums">
                                {stat.value}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">{stat.label}</p>
                                {stat.trend && (
                                    <span className="text-[9px] font-bold text-status-success bg-status-success/10 px-1.5 py-0.5 rounded-full">{stat.trend}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
