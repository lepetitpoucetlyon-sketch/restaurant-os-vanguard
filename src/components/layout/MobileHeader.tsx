"use client";

import { usePathname } from "next/navigation";
import { UserCircle, Bell, Search, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/ui.foundations";;
import { useAuth } from "@/context/AuthContext";
import { PageHeaderWithDocs } from "@/components/ui/PageHeaderWithDocs";
import { ProfileSwitcher } from "./ProfileSwitcher";
import { PageKey } from "@/types/permissions.types";
import { useState } from "react";

export function MobileHeader() {
    const pathname = usePathname();
    const { currentUser } = useAuth();
    const [isProfileSwitcherOpen, setIsProfileSwitcherOpen] = useState(false);

    const getTitle = (path: string) => {
        const segment = (path.split("/").filter(Boolean)[0] || "Dashboard").trim();
        return (segment.charAt(0) || '').toUpperCase() + segment.slice(1).replace("-", " ");
    };

    // Map pathname to PageKey
    const getPageKeyFromPath = (path: string): PageKey | 'dashboard' => {
        const segment = path.split('/').filter(Boolean)[0] || 'dashboard';
        const pathToPageKey: Record<string, PageKey> = {
            '': 'dashboard',
            'dashboard': 'dashboard',
            'floor-plan': 'floor_plan',
            'reservations': 'reservations',
            'omnichannel-reservations': 'reservations',
            'quotes': 'reservations',
            'pms': 'reservations',
            'pos': 'pos',
            'kitchen': 'kitchen',
            'kds': 'kds',
            'inventory': 'inventory',
            'storage-map': 'storage_map',
            'crm': 'crm',
            'staff': 'staff',
            'planning': 'planning',
            'leaves': 'leaves',
            'finance': 'finance',
            'accounting': 'finance',
            'analytics': 'analytics',
            'analytics-integration': 'analytics',
            'intelligence': 'analytics',
            'haccp': 'haccp',
            'quality': 'haccp',
            'groups': 'groups',
            'seo': 'seo',
            'ai-referencing': 'seo',
            'social-marketing': 'seo',
            'bar': 'bar',
            'settings': 'settings',
            'account-settings': 'settings',
            'onboarding': 'staff',
        };
        return pathToPageKey[segment] || 'dashboard';
    };

    const categoryId = getPageKeyFromPath(pathname);

    return (
        <header className="lg:hidden min-h-16 pt-[env(safe-area-inset-top)] bg-white/40 dark:bg-black/40 backdrop-blur-[40px] px-6 flex items-center justify-between border-b border-white/10 dark:border-white/5 sticky top-0 z-[50] shadow-sm">
            <div className="flex items-center gap-2 py-4">
                <PageHeaderWithDocs categoryId={categoryId} title={getTitle(pathname)} className="text-xl font-serif font-black italic text-text-primary tracking-tight">
                    <span className="text-accent-gold not-italic">.</span>
                </PageHeaderWithDocs>
            </div>

            <div className="flex items-center gap-4">
                <button className="w-9 h-9 rounded-full bg-bg-tertiary flex items-center justify-center border border-border">
                    <Search className="w-4 h-4 text-text-muted" />
                </button>
                <button 
                    onClick={() => setIsProfileSwitcherOpen(true)}
                    className="w-10 h-10 rounded-full bg-bg-tertiary border border-border flex items-center justify-center overflow-hidden"
                >
                    {currentUser?.avatar ? (
                        <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <UserCircle className="w-6 h-6 text-text-muted" />
                    )}
                </button>
            </div>
            <ProfileSwitcher isOpen={isProfileSwitcherOpen} onClose={() => setIsProfileSwitcherOpen(false)} />
        </header>
    );
}
