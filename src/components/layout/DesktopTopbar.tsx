"use client";

import React from 'react';
import { usePathname } from "next/navigation";
import { NAV_SECTIONS } from "@/config/navigation";
import Link from "next/link";
import { cn } from "@/lib/ui.foundations";
import { useNexusCore } from "@/hooks";

export function DesktopTopbar() {
    const pathname = usePathname();
    const { auth } = useNexusCore();
    const { currentUser } = auth;

    return (
        <nav className="fixed top-0 inset-x-0 h-20 bg-bg-primary/80 backdrop-blur-3xl border-b border-border/40 z-[60] flex items-center px-10 justify-between">
            <div className="flex items-center gap-12">
                <div className="font-serif font-black italic text-2xl tracking-tighter">
                    RESTAURANT <span className="text-accent-gold not-italic">OS</span>
                </div>
                
                <div className="hidden xl:flex items-center gap-8">
                    {NAV_SECTIONS.slice(0, 5).map((section) => (
                        <Link 
                            key={section.id} 
                            href={section.items[0]?.href || '#'}
                            className={cn(
                                "text-[10px] font-black uppercase tracking-[0.3em] transition-all",
                                pathname.startsWith(section.items[0]?.href) ? "text-accent-gold" : "text-text-muted hover:text-text-primary"
                            )}
                        >
                            {section.title}
                        </Link>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                    <span className="text-[11px] font-black uppercase tracking-tight">{currentUser?.name}</span>
                    <span className="text-[8px] text-accent-gold font-black uppercase tracking-widest">{currentUser?.role}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-bg-tertiary border border-border/40 flex items-center justify-center overflow-hidden shadow-premium">
                    {currentUser?.avatar ? (
                        <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <span className="font-serif italic text-lg">{currentUser?.name?.charAt(0)}</span>
                    )}
                </div>
            </div>
        </nav>
    );
}
