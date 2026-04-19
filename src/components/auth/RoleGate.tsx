"use client";

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, Lock, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

// Mapping pathname to CategoryKey
const PATH_TO_CATEGORY: Record<string, string> = {
    '/dashboard': 'dashboard',
    '/floor-plan': 'floor-plan',
    '/reservations': 'reservations',
    '/omnichannel-reservations': 'reservations',
    '/quotes': 'reservations',
    '/pms': 'reservations',
    '/crm': 'crm',
    '/kitchen': 'kitchen',
    '/kds': 'kds',
    '/inventory': 'inventory',
    '/storage-map': 'inventory',
    '/staff': 'staff',
    '/planning': 'planning',
    '/leaves': 'planning',
    '/analytics': 'analytics',
    '/analytics-integration': 'analytics',
    '/intelligence': 'analytics',
    '/finance': 'accounting',
    '/accounting': 'accounting',
    '/settings': 'settings',
    '/haccp': 'haccp',
    '/quality': 'haccp',
    '/pos': 'pos',
    '/recruitment': 'recruitment',
    '/onboarding': 'onboarding',
    '/account-settings': 'account-settings',
    '/seo': 'analytics',
    '/ai-referencing': 'analytics',
    '/social-marketing': 'analytics',
    '/bar': 'kitchen',
    '/registre': 'registre',
};

export const RoleGate = ({ children }: { children: React.ReactNode }) => {
    const { currentUser, hasAccess, isAuthenticated } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const category = Object.keys(PATH_TO_CATEGORY).find(path => pathname.startsWith(path));
    const requiredCategory = category ? PATH_TO_CATEGORY[category] : null;

    const isPublicPath = pathname === '/welcome' || pathname === '/onboarding/setup';
    if (isPublicPath) return <>{children}</>;

    const isAllowed = !requiredCategory || hasAccess(requiredCategory as any);

    if (!isAuthenticated) return null; // AuthGate handles this

    if (!isAllowed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-primary p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full text-center p-8 rounded-[2.5rem] bg-bg-secondary border border-border shadow-2xl relative overflow-hidden"
                >
                    {/* Background decoration */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-error/5 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/5 rounded-full blur-3xl" />

                    <div className="w-20 h-20 rounded-3xl bg-error/10 flex items-center justify-center mx-auto mb-8 relative z-10">
                        <Lock className="w-10 h-10 text-error" />
                    </div>

                    <h2 className="text-3xl font-serif font-bold text-text-primary mb-4 italic">Accès Restreint</h2>
                    <p className="text-text-muted mb-8 leading-relaxed">
                        Désolé, votre rôle actuel (**{currentUser?.role}**) ne vous permet pas d'accéder à la section **{requiredCategory}**.
                    </p>

                    <div className="space-y-4">
                        <Button
                            className="w-full h-14 bg-text-primary text-white rounded-2xl font-bold uppercase text-[11px] tracking-widest hover:bg-black transition-all"
                            onClick={() => router.push('/')}
                        >
                            <Home className="w-4 h-4 mr-3" />
                            Retour au Dashboard
                        </Button>
                        <p className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest">
                            Contactez un administrateur pour changer vos droits
                        </p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return <>{children}</>;
};
