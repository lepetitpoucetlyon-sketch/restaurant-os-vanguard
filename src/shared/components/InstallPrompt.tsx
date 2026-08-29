'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, PlusSquare, Sparkles } from 'lucide-react';
import { Button, BottomSheet } from '@/shared/components/ui';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'nexus_pwa_install_dismissed';

function checkDismissedRecently(): boolean {
  if (typeof window === 'undefined') return false;
  const dismissedAt = localStorage.getItem(DISMISS_KEY);
  if (!dismissedAt) return false;
  const diffDays = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
  return diffDays < 30;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone || checkDismissedRecently()) return;

    const ua = window.navigator.userAgent.toLowerCase();
    const isApple = /iphone|ipad|ipod/.test(ua);
    setIsIos(isApple);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (isApple && !isStandalone) {
      const timer = setTimeout(() => setShowPrompt(true), 5000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowPrompt(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    }
  };

  return (
    <>
      <AnimatePresence>
        {showPrompt && (
          <motion.aside
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            aria-label="Installation de l'application"
            className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-surface-card/95 backdrop-blur-2xl border border-action-primary/30 shadow-2xl max-w-sm w-[90%]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-xl bg-action-primary/10 border border-action-primary/20 flex items-center justify-center text-action-primary shrink-0">
                <Download className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-serif font-bold text-xs text-text-primary flex items-center gap-1.5">
                  <span>Installer Restaurant OS</span>
                  <Sparkles className="w-3 h-3 text-action-primary" />
                </h4>
                <p className="text-micro text-text-secondary mt-0.5 leading-snug">
                  Accédez au mode plein écran haute performance et travaillez hors-ligne.
                </p>
              </div>

              <button
                onClick={handleDismiss}
                className="text-text-muted hover:text-text-primary p-1 transition-colors"
                aria-label="Fermer la suggestion"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3.5 flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-micro h-7 px-2.5 text-text-secondary hover:text-text-primary"
              >
                Plus tard
              </Button>
              <Button
                variant="default"
                size="sm"
                aria-label="Installer l'Application"
                onClick={handleInstallClick}
                className="text-micro h-7 px-3 bg-action-primary text-black font-semibold rounded-lg shadow-sm hover:brightness-110"
              >
                Installer
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <BottomSheet
        isOpen={showIosGuide}
        onClose={() => setShowIosGuide(false)}
        title="Installer sur iOS"
      >
        <div className="p-4 space-y-4 text-xs text-text-primary">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-muted border border-border-light/10">
            <Share className="w-5 h-5 text-action-primary shrink-0" />
            <p>1. Appuyez sur le bouton <strong>Partager</strong> dans Safari.</p>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-muted border border-border-light/10">
            <PlusSquare className="w-5 h-5 text-action-primary shrink-0" />
            <p>2. Faites défiler et sélectionnez <strong>Sur l'écran d'accueil</strong>.</p>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
