'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Modal } from '@ui/Modal';
import { useAuth } from '@/shared/providers/NexusCoreProvider';

export interface PasskeyStepUpModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionTitle: string;
  actionDescription: string;
  severity?: 'critical' | 'sensitive' | 'standard';
}

export function PasskeyStepUpModal({
  open,
  onClose,
  onSuccess,
  actionTitle,
  actionDescription,
  severity = 'sensitive',
}: PasskeyStepUpModalProps) {
  const { verifyPin } = useAuth();
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const hasWebAuthn = false; // Désactivé jusqu'au déploiement du backend d'assertion WebAuthn / API auth

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;

    setIsVerifying(true);
    setPinError(false);

    const valid = verifyPin ? await verifyPin(pin) : true;
    if (valid) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsVerifying(false);
        setPin('');
        onSuccess();
      }, 600);
    } else {
      setIsVerifying(false);
      setPinError(true);
      setPin('');
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title=""
      size="sm"
    >
      <div className="p-6 text-center space-y-6">
        {/* Header Icon */}
        <div className="flex justify-center">
          <div
            className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all ${
              isSuccess
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : severity === 'critical'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="w-8 h-8 animate-bounce" />
            ) : (
              <Lock className="w-8 h-8" />
            )}
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <h2 className="text-lg font-serif font-bold text-text-primary">
            {isSuccess ? 'Autorisation confirmée' : actionTitle}
          </h2>
          <p className="text-xs text-text-muted max-w-xs mx-auto">
            {isSuccess ? 'Votre identité a été vérifiée avec succès.' : actionDescription}
          </p>
        </div>

        {/* Step-up Body */}
        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.form
              key="pin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handlePinSubmit}
              className="space-y-4 pt-2"
            >
              <div className="space-y-2">
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Code PIN (4 à 6 chiffres)"
                  className="w-full py-3 px-4 text-center text-xl tracking-[0.4em] font-mono bg-surface-card border border-border/80 rounded-xl focus:border-amber-500 focus:outline-none text-text-primary"
                  autoFocus
                />
                {pinError && (
                  <p className="text-xs text-rose-400 flex items-center justify-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Code PIN incorrect. Veuillez réessayer.
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={pin.length < 4 || isVerifying}
                  className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-text-primary font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Valider
                </button>
              </div>
            </motion.form>
          ) : null}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
