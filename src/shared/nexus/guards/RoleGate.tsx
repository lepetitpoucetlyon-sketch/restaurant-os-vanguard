"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import { Lock, Home } from 'lucide-react';
import { Button } from '@ui/button';
import { motion } from 'framer-motion';
import { canAccessModule, User } from '@nexus/contracts';

// Mapping pathname to CategoryKey
const PATH_TO_CATEGORY: Record<string, string> = {
    '/dashboard': 'dashboard',
    '/floor-plan': 'floor-plan',
    '/reservations': 'reservations',
    '/omnichannel-reservations': 'omnichannel',
    '/quotes': 'crm',
    '/sanitary-control': 'quality',
    '/crm': 'crm',
    '/kitchen': 'kitchen',
    '/kds': 'operations',
    '/inventory': 'inventory',
    '/storage-map': 'inventory',
    '/staff': 'hr',
    '/planning': 'hr',
    '/leaves': 'hr',
    '/analytics': 'marketing',
    '/finance': 'finance',
    '/accounting': 'finance',
    '/settings': 'settings',
    '/haccp': 'quality',
    '/quality': 'quality',
    '/pos': 'operations',
    '/recruitment': 'hr',
    '/onboarding': 'hr',
    '/account-settings': 'account-settings',
    '/seo': 'marketing',
    '/ai-referencing': 'marketing',
    '/social-marketing': 'marketing',
    '/bar': 'kitchen',
    '/registre': 'operations',
};

export const RoleGate = ({ children }: { children: React.ReactNode }) => {
    const { currentUser, isAuthenticated } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const category = Object.keys(PATH_TO_CATEGORY).find(path => pathname.startsWith(path));
    const requiredCategory = category ? PATH_TO_CATEGORY[category] : null;

    const isPublicPath = pathname === '/' || pathname === '/welcome' || pathname === '/onboarding/setup';
    if (isPublicPath) return <>{children}</>;

    // 🛡️ PRAETORIAN SUTURE: Check via NexusInternalMapper
    // Sincérité à la Racine : Plus de 'as unknown'. Utilisation du type User souverain.
    const permissions = currentUser as User | null;
    let isAllowed = !requiredCategory || (permissions?.permissions && canAccessModule(permissions.permissions, requiredCategory.toUpperCase()));

    // Social Shield: Un utilisateur RESTRICTED a ses autres accès coupés au niveau du Gate
    if (permissions && (permissions as User & { status?: string }).status === 'RESTRICTED' && requiredCategory) {
        isAllowed = false; // Coupé au niveau du Gate
    }

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
                            className="w-full h-14 bg-text-primary text-white rounded-2xl font-bold uppercase text-[11px] tracking-widest hover:bg-surface-sidebar transition-all"
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
