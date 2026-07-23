"use client";

import { Users, MoreHorizontal } from "lucide-react";
import { Button } from "@ui/button";

interface SegmentCardProps {
    segment: {
        id: string;
        name: string;
        count?: number;
        color: string;
        criteria: string | Record<string, string>;
    };
}

export function SegmentCard({ segment }: SegmentCardProps) {
    return (
        <div className="group bg-surface-card/40 dark:bg-surface-sidebar/40 backdrop-blur-xl border border-default dark:border-white/5 rounded-[2.5rem] p-8 hover:translate-y-[-4px] transition-all duration-300 shadow-sm hover:shadow-xl">
            <div className="flex items-start justify-between mb-8">
                <div className="p-4 rounded-2xl shadow-lg" style={{ backgroundColor: segment.color, color: 'white' }}>
                    <Users size={24} strokeWidth={2} />
                </div>
                <Button size="icon" variant="ghost" className="rounded-full hover:bg-surface-sidebar/5">
                    <MoreHorizontal size={20} className="text-text-muted" />
                </Button>
            </div>

            <div className="space-y-4">
                <div>
                    <h3 className="text-3xl font-serif font-bold text-text-primary tracking-tight mb-2">{segment.name}</h3>
                    <p className="text-sm font-medium text-text-muted p-3 bg-surface-card/50 rounded-xl border border-default inline-block">
                        {typeof segment.criteria === 'string' ? segment.criteria : JSON.stringify(segment.criteria)}
                    </p>
                </div>

                <div className="flex items-end gap-2">
                    <span className="text-6xl font-serif font-medium tracking-tighter text-text-primary" style={{ color: segment.color }}>
                        {segment.count}
                    </span>
                    <span className="text-sm font-bold text-text-muted uppercase tracking-widest pb-4">Clients</span>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-black/5">
                <Button className="w-full h-12 rounded-xl text-xs font-bold uppercase tracking-widest bg-surface-card text-text-primary hover:bg-bg-tertiary border border-border shadow-sm">
                    Voir la liste
                </Button>
            </div>
        </div>
    );
}
