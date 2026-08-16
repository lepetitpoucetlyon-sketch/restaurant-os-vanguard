"use client";

import React from "react";
import { motion } from "framer-motion";
import { User as UserIcon, Camera, Star, ScanFace, Award, Edit3, X } from "lucide-react";
import { ROLE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/ui.foundations";
import type { User } from "@/shared/nexus/contracts/auth.types";
import type { ProfileData } from "./types";

interface IdentityCoreHeaderProps {
  selectedUser?: User | null;
  formData: ProfileData;
  isEditing: boolean;
  onToggleEdit: () => void;
}

export function IdentityCoreHeader({
  selectedUser,
  formData,
  isEditing,
  onToggleEdit,
}: IdentityCoreHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-12 relative z-10">
      <div className="flex items-center gap-6">
        <div className="relative">
          <motion.div
            className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-bg-tertiary shadow-xl"
            whileHover={{ scale: 1.05, rotate: -2 }}
          >
            {formData.avatar ? (
              <img src={formData.avatar} alt={formData.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-bg-tertiary">
                <UserIcon className="w-12 h-12 text-text-muted" />
              </div>
            )}
          </motion.div>
          {isEditing && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-3 -right-3 w-12 h-12 bg-accent rounded-2xl flex items-center justify-center shadow-lg border-4 border-bg-secondary text-text-primary hover:bg-accent/90 transition-colors"
            >
              <Camera className="w-5 h-5" />
            </motion.button>
          )}
          <div className="absolute -top-3 -right-3 px-3 py-1.5 bg-accent-gold/20 backdrop-blur-md rounded-xl shadow-sm flex items-center gap-1.5 border border-accent-gold/30">
            <Star className="w-3.5 h-3.5 text-accent-gold fill-accent-gold" />
            <span className="text-xs font-bold text-accent-gold">
              {selectedUser?.performanceScore?.toFixed(1) || '5.0'}
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-4xl font-serif text-text-primary uppercase tracking-tight italic">
              {formData.name || 'Unknown Operative'}
            </h2>
            <span className="px-3 py-1 rounded-lg bg-bg-tertiary text-text-muted text-[10px] font-bold uppercase tracking-widest border border-border">
              Lvl {selectedUser?.accessLevel ?? 1}
            </span>
          </div>
          <div className="flex items-center gap-4 text-text-muted">
            <div className="flex items-center gap-2">
              <ScanFace className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">ID: {selectedUser?.id?.slice(0, 8)}</span>
            </div>
            <div className="w-1 h-4 bg-border rounded-full" />
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">{ROLE_LABELS[selectedUser?.role || 'server']}</span>
            </div>
          </div>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggleEdit}
        className={cn(
          "flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border",
          isEditing
            ? "bg-error/10 border-error/20 text-error hover:bg-error hover:text-text-primary"
            : "bg-bg-tertiary border-border text-text-primary hover:bg-bg-primary shadow-sm"
        )}
      >
        {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
        {isEditing ? 'Abort Edit' : 'Modify Data'}
      </motion.button>
    </div>
  );
}
