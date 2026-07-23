"use client";

import React from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks";
import { ROLE_LABELS } from "@domain/services/AccessPolicyManager";
import { Modal } from "@ui/Modal";
import { cn } from "@/lib/ui.foundations";;

interface ProfileSwitcherProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ProfileSwitcher({ isOpen, onClose }: ProfileSwitcherProps) {
    const { users, switchProfile, currentUser, canSwitchProfiles } = useAuth();

    const handleSwitch = async (userId: string) => {
        if (switchProfile) {
            await switchProfile(userId);
        }
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="md"
            variant="premium"
            className="bg-bg-primary"
            noPadding
        >
            <div className="p-10">
                {!canSwitchProfiles ? (
                    <div className="rounded-[2rem] border border-border bg-bg-tertiary/30 px-8 py-10 text-center">
                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-text-primary">
                            Bascule de profil désactivée
                        </p>
                        <p className="mt-3 text-xs leading-relaxed text-text-muted">
                            Le changement direct d&apos;identité est bloqué par défaut. Activez explicitement
                            `NEXT_PUBLIC_ENABLE_PROFILE_SWITCHER=true` pour les cas de support administrateur.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-6">
                        {users.map((user) => {
                            const isActive = currentUser?.id === user.id;
                            const initials = user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2);

                            return (
                                <motion.button
                                    key={user.id}
                                    whileHover={{
                                        scale: 1.05,
                                        y: -8,
                                        backgroundColor: "rgba(197, 160, 89, 0.05)",
                                        borderColor: "rgba(197, 160, 89, 0.3)"
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleSwitch(user.id)}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-6 rounded-[3rem] transition-all aspect-square relative group",
                                        isActive
                                            ? "bg-accent-gold/10 border-2 border-accent-gold shadow-[0_0_30px_rgba(197,160,89,0.2)]"
                                            : "bg-bg-tertiary/30 hover:bg-bg-tertiary border border-border/50"
                                    )}
                                >
                                    <div className={cn(
                                        "w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-5 shadow-inner transition-transform group-hover:scale-110",
                                        isActive ? "bg-accent-gold text-white" : "bg-bg-secondary dark:bg-bg-primary text-text-primary"
                                    )}>
                                        <span className="text-2xl font-black tracking-tighter">
                                            {initials}
                                        </span>
                                    </div>

                                    <div className="text-center flex flex-col gap-1.5">
                                        <span className="text-[11px] font-black uppercase tracking-tight text-text-primary leading-tight font-sans">
                                            {user.name}
                                        </span>
                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-accent-gold opacity-80 leading-none">
                                            {ROLE_LABELS[user.role]}
                                        </span>
                                    </div>

                                    {isActive && (
                                        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-accent-gold shadow-glow" />
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                )}
            </div>
        </Modal>
    );
}
