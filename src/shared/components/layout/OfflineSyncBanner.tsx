'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';

export function OfflineSyncBanner() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showSyncSuccess, setShowSyncSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowSyncSuccess(true);
      const timer = setTimeout(() => setShowSyncSuccess(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowSyncSuccess(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showSyncSuccess) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -40, opacity: 0 }}
        role="status"
        aria-live="polite"
        className={cn(
          "fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl shadow-xl backdrop-blur-md border text-xs font-bold flex items-center gap-2.5 transition-all text-text-on-primary",
          isOnline
            ? "bg-emerald-600/95 border-emerald-500 text-text-on-primary"
            : "bg-amber-600/95 border-amber-500 text-text-on-primary"
        )}
      >
        {isOnline ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-text-on-primary" />
            <span className="text-text-on-primary">Connexion rétablie — Données synchronisées</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-text-on-primary animate-pulse" />
            <span className="text-text-on-primary">Mode Hors-Ligne Actif — Sauvegarde locale continue</span>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
