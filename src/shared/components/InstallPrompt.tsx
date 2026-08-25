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

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already installed as standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    // Check if user dismissed recently (30 days)
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const diffDays = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (diffDays < 30) return;
    }

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isApple = /iphone|ipad|ipod/.test(ua);
    setIsIos(isApple);

    // Chrome/Android listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If iOS Safari and not standalone, show after 5s delay
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
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
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
                <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                  Accédez au mode plein écran haute performance et travaillez hors-ligne.
                </p>
              </div>

              <button
                onClick={handleDismiss}
                className="text-text-muted hover:text-text-primary p-1 rounded-lg transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" variant="default" className="flex-1 text-xs" onClick={handleInstallClick}>
                Installer l'Application
              </Button>
              <Button size="sm" variant="ghost" className="text-xs" onClick={handleDismiss}>
                Plus tard
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* iOS Installation Guide BottomSheet */}
      <BottomSheet
        isOpen={showIosGuide}
        onClose={() => setShowIosGuide(false)}
        title="Installer sur iPad & iPhone"
      >
        <div className="p-6 space-y-4">
          <p className="text-xs text-text-secondary leading-relaxed">
            Pour installer l'application sur votre écran d'accueil iOS :
          </p>

          <ol className="space-y-3 text-xs text-text-primary font-medium">
            <li className="flex items-center gap-3 p-3 rounded-xl bg-surface-bg border border-border-default">
              <span className="w-6 h-6 rounded-full bg-action-primary/10 text-action-primary font-bold flex items-center justify-center text-[10px]">1</span>
              <span>Appuyez sur le bouton <strong>Partager</strong> <Share className="w-4 h-4 inline text-action-primary ml-1" /> dans Safari</span>
            </li>
            <li className="flex items-center gap-3 p-3 rounded-xl bg-surface-bg border border-border-default">
              <span className="w-6 h-6 rounded-full bg-action-primary/10 text-action-primary font-bold flex items-center justify-center text-[10px]">2</span>
              <span>Sélectionnez <strong>Sur l'écran d'accueil</strong> <PlusSquare className="w-4 h-4 inline text-action-primary ml-1" /></span>
            </li>
            <li className="flex items-center gap-3 p-3 rounded-xl bg-surface-bg border border-border-default">
              <span className="w-6 h-6 rounded-full bg-action-primary/10 text-action-primary font-bold flex items-center justify-center text-[10px]">3</span>
              <span>Touchez <strong>Ajouter</strong> en haut à droite</span>
            </li>
          </ol>

          <Button variant="default" className="w-full mt-4" onClick={() => setShowIosGuide(false)}>
            J'ai compris
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}
