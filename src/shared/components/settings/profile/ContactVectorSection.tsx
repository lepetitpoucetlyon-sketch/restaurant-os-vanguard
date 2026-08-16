"use client";

import React from "react";
import { Terminal, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import type { ProfileData } from "./types";

interface ContactVectorSectionProps {
  formData: ProfileData;
  isEditing: boolean;
  onChange: (field: keyof ProfileData, value: string) => void;
}

export function ContactVectorSection({
  formData,
  isEditing,
  onChange,
}: ContactVectorSectionProps) {
  return (
    <div className="space-y-6">
      <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
        <Terminal className="w-4 h-4" />
        Contact Vector
      </h4>
      <div className="space-y-4">
        <div className="group">
          <label className="block text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1.5 ml-1">
            Digital Mail Relay
          </label>
          <div className="relative">
            <input
              type="email"
              value={formData.email}
              onChange={(e) => onChange('email', e.target.value)}
              disabled={!isEditing}
              className={cn(
                "w-full pl-12 pr-6 py-5 rounded-2xl font-medium text-sm transition-all outline-none border",
                isEditing
                  ? "bg-bg-primary border-accent/50 text-text-primary focus:border-accent focus:ring-1 focus:ring-accent/50"
                  : "bg-bg-tertiary/50 border-transparent text-text-muted"
              )}
            />
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          </div>
        </div>
        <div className="group">
          <label className="block text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1.5 ml-1">
            Voice Link
          </label>
          <div className="relative">
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              disabled={!isEditing}
              className={cn(
                "w-full pl-12 pr-6 py-5 rounded-2xl font-medium text-sm transition-all outline-none border",
                isEditing
                  ? "bg-bg-primary border-accent/50 text-text-primary focus:border-accent focus:ring-1 focus:ring-accent/50"
                  : "bg-bg-tertiary/50 border-transparent text-text-muted"
              )}
            />
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
