"use client";

import React from "react";
import { motion } from "framer-motion";
import { Briefcase, BadgeCheck } from "lucide-react";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/constants";
import { cn } from "@/lib/ui.foundations";
import type { User } from "@/shared/nexus/contracts/auth.types";

interface PersonnelMatrixProps {
  users: User[];
  currentUser?: User | null;
  selectedUserId: string | null;
  onSelectUser: (id: string) => void;
}

export function PersonnelMatrix({
  users,
  currentUser,
  selectedUserId,
  onSelectUser,
}: PersonnelMatrixProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-10 overflow-hidden relative group"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -mr-32 -mt-32 transition-opacity group-hover:opacity-100 opacity-50 pointer-events-none" />

      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent">
          <Briefcase className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-2xl font-serif text-text-primary uppercase tracking-tight italic">
            Personnel Matrix
          </h3>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
            Active Operatives Count: <span className="text-accent">{users.length}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {users.map((user, idx) => (
          <motion.button
            key={user.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectUser(user.id)}
            className={cn(
              "relative p-6 rounded-[2rem] border transition-all duration-300 flex flex-col items-center gap-4 group/card overflow-hidden text-center",
              selectedUserId === user.id || (!selectedUserId && currentUser?.id === user.id)
                ? "bg-bg-tertiary border-accent shadow-lg"
                : "bg-bg-primary/50 border-border hover:border-accent/50"
            )}
          >
            <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover/card:opacity-100 transition-opacity" />

            <div className="relative">
              <div
                className="w-20 h-20 rounded-full p-1 border border-dashed transition-all duration-500 group-hover/card:rotate-180"
                style={{ borderColor: ROLE_COLORS[user.role] }}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-bg-primary">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xl font-serif font-bold text-text-muted">{(user.name || '').charAt(0)}</span>
                    </div>
                  )}
                </div>
              </div>
              {user.id === currentUser?.id && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-accent rounded-full flex items-center justify-center border-2 border-bg-secondary shadow-lg">
                  <BadgeCheck className="w-3 h-3 text-text-primary" />
                </div>
              )}
            </div>

            <div className="relative z-10 w-full">
              <p className="font-serif font-bold text-text-primary text-sm truncate w-full">
                {user.name}
              </p>
              <div className="inline-flex items-center gap-1.5 mt-2 px-2 py-1 rounded-lg bg-bg-primary/50 border border-border/50">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ROLE_COLORS[user.role] }} />
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">
                  {ROLE_LABELS[user.role]?.split(' ')[0]}
                </span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
