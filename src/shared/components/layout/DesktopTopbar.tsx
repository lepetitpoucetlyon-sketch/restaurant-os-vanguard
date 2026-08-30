"use client";

import React from 'react';
import Image from "next/image";
import { usePathname } from "next/navigation";
import { NAV_SECTIONS, filterNavSections } from "@/config/navConfig";
import { APP_MODE } from "@/config/instance";
import Link from "next/link";
import { cn } from "@/lib/ui.foundations";
import { useNexusCore, useUI } from "@/shared/hooks";
import { LayoutGrid } from "lucide-react";
import { DisplayDepthToggle } from "@/shared/components/layout/DisplayDepthToggle";

export function DesktopTopbar() {
    const pathname = usePathname();
    const { auth } = useNexusCore();
    const { currentUser } = auth;
    const { toggleLaunchpad } = useUI();
    const visibleSections = filterNavSections(NAV_SECTIONS, APP_MODE);

    return (
        <nav className="fixed top-0 inset-x-0 h-20 bg-bg-primary/80 backdrop-blur-3xl border-b border-border/40 z-[60] flex items-center px-10 justify-between">
            <div className="flex items-center gap-10">
                <Link href="/" className="font-serif font-black italic text-2xl tracking-tighter flex items-center gap-2">
                    RESTAURANT <span className="text-accent-gold not-italic">OS</span>
                </Link>

                <button
                    onClick={toggleLaunchpad}
                    className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-accent-gold/10 hover:bg-accent-gold/20 text-accent-gold border border-accent-gold/30 transition-all text-micro font-black uppercase tracking-widest group"
                >
                    <LayoutGrid className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    <span>Modules (40+)</span>
                </button>
                
                <div className="hidden 2xl:flex items-center gap-6">
                    {visibleSections.slice(0, 7).map((section) => (
                        <Link
                            key={section.id}
                            href={section.items[0]?.href || '#'}
                            prefetch={false}
                            className={cn(
                                "text-nano font-black uppercase tracking-[0.25em] transition-all py-1 border-b-2",
                                pathname.startsWith(section.items[0]?.href)
                                    ? "text-accent-gold border-accent-gold"
                                    : "text-text-muted hover:text-text-primary border-transparent"
                            )}
                        >
                            {section.title}
                        </Link>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-6">
                <DisplayDepthToggle className="hidden sm:flex" />
                <div className="flex flex-col items-end">
                    <span className="text-micro font-black uppercase tracking-tight">{currentUser?.name}</span>
                    <span className="text-nano text-accent-gold font-black uppercase tracking-widest">{currentUser?.role}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-bg-tertiary border border-border/40 flex items-center justify-center overflow-hidden shadow-premium">
                    {currentUser?.avatar ? (
                        <Image src={currentUser.avatar} alt="Avatar" width={40} height={40} className="w-full h-full object-cover" unoptimized />
                    ) : (
                        <span className="font-serif italic text-lg">{currentUser?.name?.charAt(0)}</span>
                    )}
                </div>
            </div>
        </nav>
    );
}
