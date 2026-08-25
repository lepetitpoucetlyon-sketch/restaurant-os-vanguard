"use client";

import React, { useState } from "react";
import { Shield, Key, Eye, EyeOff, Camera, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/ui.foundations";
import type { ProfileData } from "./types";

interface SecurityProtocolSectionProps {
  formData: ProfileData;
  isEditing: boolean;
  onChange: (field: keyof ProfileData, value: string) => void;
}

export function SecurityProtocolSection({
  formData,
  isEditing,
  onChange,
}: SecurityProtocolSectionProps) {
  const [showPin, setShowPin] = useState(false);

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <h4 className="text-nano font-bold text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Security Protocol
        </h4>
        <div className="space-y-4">
          <div className="group">
            <label className="block text-nano font-bold text-text-muted uppercase tracking-widest mb-1.5 ml-1">
              Nouveau code PIN (laisser vide pour conserver l&apos;actuel)
            </label>
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                value={formData.pin}
                onChange={(e) => onChange('pin', e.target.value)}
                disabled={!isEditing}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder={isEditing ? "4 chiffres" : "PIN masqué"}
                className={cn(
                  "w-full pl-12 pr-12 py-5 rounded-2xl font-serif text-xl tracking-[0.5em] transition-all outline-none border",
                  isEditing
                    ? "bg-bg-primary border-accent/50 text-text-primary focus:border-accent focus:ring-1 focus:ring-accent/50"
                    : "bg-bg-tertiary/50 border-transparent text-text-muted"
                )}
              />
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent transition-colors"
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="group">
            <label className="block text-nano font-bold text-text-muted uppercase tracking-widest mb-1.5 ml-1">
              Identity Avatar Relay
            </label>
            <div className="relative">
              <input
                type="url"
                value={formData.avatar}
                onChange={(e) => onChange('avatar', e.target.value)}
                disabled={!isEditing}
                placeholder="https://..."
                className={cn(
                  "w-full pl-12 pr-6 py-5 rounded-2xl font-medium text-sm transition-all outline-none border",
                  isEditing
                    ? "bg-bg-primary border-accent/50 text-text-primary focus:border-accent focus:ring-1 focus:ring-accent/50"
                    : "bg-bg-tertiary/50 border-transparent text-text-muted"
                )}
              />
              <Camera className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SecurityAdvisoryBox() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-10 p-6 rounded-2xl bg-accent-gold/5 border border-accent-gold/20 flex items-start gap-4"
    >
      <div className="w-8 h-8 rounded-lg bg-accent-gold/20 flex items-center justify-center flex-shrink-0 text-accent-gold">
        <ShieldCheck className="w-4 h-4" />
      </div>
      <div>
        <h5 className="font-serif font-bold text-accent-gold text-sm mb-1 uppercase tracking-wide">Security Directive</h5>
        <p className="text-xs text-text-muted leading-relaxed font-medium">
          PIN sequences are cryptographically hashed. Unauthorized sharing constitutes a Class 3 protocol violation. Verify all vectors before committing.
        </p>
      </div>
    </motion.div>
  );
}
