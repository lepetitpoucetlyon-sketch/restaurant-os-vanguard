// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import { 
    Users, 
    Plus, 
    ChevronRight, 
    Briefcase, 
    Star, 
    Mail, 
    Phone 
} from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { User } from "@/types";

interface StaffCardProps {
    user: User;
    onClick?: () => void;
}

export const StaffCard = ({ user, onClick }: StaffCardProps) => (
    <motion.div
        variants={staggerItem}
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="group bg-white dark:bg-bg-secondary rounded-xl border border-border shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden relative"
    >
        <div className="absolute top-0 right-0 w-24 h-24 bg-bg-tertiary -mr-12 -mt-12 rounded-full opacity-50 group-hover:scale-150 transition-all duration-700" />

        <div className="p-8 relative z-10">
            <div className="flex items-start justify-between mb-8">
                <div className="flex gap-5 items-center">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-[2rem] bg-bg-tertiary border border-border flex items-center justify-center font-serif text-3xl text-text-primary shadow-inner group-hover:scale-105 transition-all duration-500 overflow-hidden">
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            ) : (user.name || '').charAt(0)}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-success border-4 border-white shadow-sm" />
                    </div>
                    <div>
                        <h3 className="text-xl font-serif font-semibold text-text-primary leading-tight group-hover:text-accent transition-colors">{user.name}</h3>
                        <p className="text-[10px] font-bold text-accent uppercase tracking-widest mt-1.5 flex items-center gap-2">
                            <Briefcase strokeWidth={2} className="w-3 h-3" />
                            {user.role}
                        </p>
                    </div>
                </div>
                <button className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted hover:bg-accent hover:text-white transition-all shadow-sm">
                    <ChevronRight strokeWidth={1.5} className="w-5 h-5" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-border pt-6 mt-2">
                <div className="space-y-1.5">
                    <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Dernier Service</p>
                    <p className="text-[12px] font-medium text-text-primary font-mono tracking-tighter">Aujourd&apos;hui, 12:45</p>
                </div>
                <div className="space-y-1.5">
                    <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Performance</p>
                    <div className="flex items-center gap-1.5">
                        <Star strokeWidth={1.5} className="w-3.5 h-3.5 text-warning fill-warning/20" />
                        <span className="text-[12px] font-bold text-text-primary font-mono">4.9</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="px-8 py-5 bg-bg-tertiary/40 border-t border-border flex items-center justify-between group-hover:bg-accent/5 transition-colors">
            <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                <span className="text-[10px] font-bold text-text-primary uppercase tracking-[0.2em]">En Service</span>
            </div>
            <div className="flex gap-2">
                <button className="w-9 h-9 rounded-lg bg-white dark:bg-bg-tertiary border border-border flex items-center justify-center text-text-muted hover:bg-accent hover:text-white hover:border-accent transition-all shadow-sm">
                    <Mail strokeWidth={1.5} className="w-4 h-4" />
                </button>
                <button className="w-9 h-9 rounded-lg bg-white dark:bg-bg-tertiary border border-border flex items-center justify-center text-text-muted hover:bg-accent hover:text-white hover:border-accent transition-all shadow-sm">
                    <Phone strokeWidth={1.5} className="w-4 h-4" />
                </button>
            </div>
        </div>
    </motion.div>
);

interface StaffListProps {
    users: User[];
    onOpenModal: (user?: User) => void;
}

export const StaffList = ({ users, onOpenModal }: StaffListProps) => {
    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8"
        >
            {users.map(user => (
                <StaffCard key={user.id} user={user} onClick={() => onOpenModal(user)} />
            ))}

            {/* Empty state add card */}
            <motion.button
                variants={staggerItem}
                onClick={() => onOpenModal()}
                className="h-full min-h-[300px] border-2 border-dashed border-border/60 bg-bg-tertiary/20 rounded-xl flex flex-col items-center justify-center p-10 group hover:border-accent hover:bg-bg-tertiary transition-all duration-500"
            >
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-bg-tertiary border border-border flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-accent group-hover:text-white transition-all shadow-sm">
                    <Plus strokeWidth={1.5} className="w-8 h-8 text-text-muted group-hover:text-white" />
                </div>
                <h4 className="text-xl font-serif font-semibold text-text-primary">Nouveau Profil</h4>
                <p className="text-[13px] text-text-muted font-medium text-center mt-3 leading-relaxed">
                    Ajouter un nouveau membre à votre <br />brigade d'élite.
                </p>
            </motion.button>
        </motion.div>
    );
};
