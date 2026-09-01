'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, BellRing, Sparkles } from 'lucide-react';
import { KDSAudioHardwareService } from '../services/KDSAudioHardwareService';
import { Button } from "@/shared/components/ui/Button";

interface KDSCoursingAnimationIndicatorProps {
  orderId: string;
  tableNumber?: string | number;
  requestedCourse?: string; // Ex: 'plat', 'dessert'
  isFireActive: boolean;
  onAcknowledge?: () => void;
}

export function KDSCoursingAnimationIndicator({
  orderId,
  tableNumber,
  requestedCourse = 'PLATS',
  isFireActive,
  onAcknowledge,
}: KDSCoursingAnimationIndicatorProps) {
  useEffect(() => {
    if (isFireActive) {
      KDSAudioHardwareService.playChime('suite_fire');
    }
  }, [isFireActive]);

  return (
    <AnimatePresence>
      {isFireActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          className="relative w-full overflow-hidden rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-950/80 via-orange-950/90 to-amber-950/80 p-3 shadow-xl shadow-amber-500/20"
        >
          {/* Animated Glow overlay */}
          <motion.div
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"
          />

          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-text-primary shadow-md">
                <Flame className="h-5 w-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-micro font-black uppercase tracking-wider text-amber-300">
                  <BellRing className="h-3.5 w-3.5 animate-pulse text-amber-400" />
                  RÉCLAME SALLE — {tableNumber ? `TABLE ${tableNumber}` : `COMMANDE #${orderId.slice(-4)}`}
                </div>
                <div className="text-xs font-black tracking-tight text-white flex items-center gap-1">
                  <span>ENVOYER LA SUITE : </span>
                  <span className="text-amber-400 underline decoration-amber-500 underline-offset-2">
                    {requestedCourse.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {onAcknowledge && (
              <Button variant="ghost"
                onClick={onAcknowledge}
                className="flex items-center gap-1 rounded-lg bg-amber-500/20 px-3 py-1.5 text-nano font-black uppercase tracking-wider text-amber-300 border border-amber-500/30 hover:bg-amber-500 hover:text-text-primary transition-colors"
              >
                <Sparkles className="h-3 w-3" />
                Compris (Fire)
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
