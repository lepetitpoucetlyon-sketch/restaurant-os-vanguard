"use client";

import type { Dispatch, SetStateAction } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Fingerprint, Users, Euro, CreditCard, Clock } from 'lucide-react';
import { useSettings } from '@/kernel/hooks';
import { cn } from '@/lib/ui.foundations';

type Config = ReturnType<typeof useSettings>['settings']['reservationConfig'];

interface Props {
  config: Config;
  setConfig: Dispatch<SetStateAction<Config>>;
}

const cinematicItem: Variants = {
  hidden:  { opacity: 0, y: 20, filter: 'blur(10px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const IMPRINT_CONDITIONS = [
  { value: 'always',        label: 'Toujours',      desc: 'Toute réservation' },
  { value: 'group',         label: 'Groupes',       desc: null },
  { value: 'amount',        label: 'Montant',       desc: null },
  { value: 'privatization', label: 'Privatisations', desc: 'Seulement' },
] as const;

export function ReservationCardImprintSection({ config, setConfig }: Props) {
  const groupMin   = config.cardImprintGroupMin  ?? 5;
  const amountMin  = config.cardImprintAmountMin ?? 100;
  const penalty    = config.cardImprintPenaltyAmount ?? 20;
  const cancelHrs  = config.cardImprintCancelHours  ?? 24;

  return (
    <motion.div variants={cinematicItem} className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-status-success/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />

      <div className="flex items-center gap-4 mb-10 relative z-10">
        <motion.div whileHover={{ scale: 1.1, rotate: -10 }} className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent">
          <Fingerprint className="w-6 h-6" />
        </motion.div>
        <div>
          <h3 className="text-2xl font-serif text-text-primary uppercase tracking-tight italic">Garantie Réservation</h3>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Empreinte Bancaire — Stripe Setup Intent</p>
        </div>
      </div>

      <div className={cn(
        'p-8 rounded-[2rem] border-2 transition-all duration-500 relative z-10',
        config.cardImprintEnabled ? 'bg-bg-primary border-status-success/20 shadow-lg shadow-status-success/5' : 'bg-bg-tertiary/20 border-border',
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <motion.div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-lg', config.cardImprintEnabled ? 'bg-status-success text-bg-primary' : 'bg-bg-tertiary text-text-muted')}>
              <Fingerprint className="w-6 h-6" />
            </motion.div>
            <div>
              <p className="font-serif text-text-primary uppercase tracking-tight italic">Activer l&apos;empreinte bancaire</p>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">La carte est enregistrée mais jamais débitée si le client vient</p>
            </div>
          </div>
          <button
            onClick={() => setConfig(c => ({ ...c, cardImprintEnabled: !c.cardImprintEnabled }))}
            className={cn('w-16 h-8 rounded-full relative transition-all duration-500', config.cardImprintEnabled ? 'bg-status-success shadow-lg shadow-status-success/20' : 'bg-bg-tertiary border border-border')}
          >
            <motion.div animate={{ x: config.cardImprintEnabled ? 34 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} className="absolute top-1 left-1 w-6 h-6 bg-surface-card rounded-full shadow-md z-10" />
          </button>
        </div>

        <AnimatePresence>
          {config.cardImprintEnabled && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-8 pt-8 border-t border-border space-y-8">
                {/* Condition selector */}
                <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-1">Conditions d&apos;activation</label>
                  <div className="grid grid-cols-2 gap-3">
                    {IMPRINT_CONDITIONS.map(opt => {
                      const desc = opt.value === 'group'  ? `≥ ${groupMin} personnes`
                                 : opt.value === 'amount' ? `Acompte ≥ ${amountMin} €`
                                 : opt.desc;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setConfig(c => ({ ...c, cardImprintCondition: opt.value }))}
                          className={cn('px-4 py-4 rounded-2xl border text-left transition-all', config.cardImprintCondition === opt.value ? 'bg-status-success/10 border-status-success/40 text-text-primary' : 'bg-bg-secondary border-border text-text-muted hover:border-status-success/30')}
                        >
                          <p className="text-[10px] font-black uppercase tracking-widest">{opt.label}</p>
                          <p className="text-[9px] font-medium mt-0.5 opacity-70">{desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Threshold inputs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {config.cardImprintCondition === 'group' && (
                    <div className="space-y-3">
                      <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                        <Users className="w-3 h-3" /> Seuil groupe
                      </label>
                      <div className="relative">
                        <input type="number" min={2} max={50} value={groupMin} onChange={(e) => setConfig(c => ({ ...c, cardImprintGroupMin: Number(e.target.value) }))} className="w-full px-5 py-4 bg-bg-primary border border-border rounded-2xl text-text-primary font-serif outline-none focus:border-status-success shadow-sm" />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-text-muted uppercase">pers.</span>
                      </div>
                    </div>
                  )}
                  {config.cardImprintCondition === 'amount' && (
                    <div className="space-y-3">
                      <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                        <Euro className="w-3 h-3" /> Seuil montant
                      </label>
                      <div className="relative">
                        <input type="number" min={0} value={amountMin} onChange={(e) => setConfig(c => ({ ...c, cardImprintAmountMin: Number(e.target.value) }))} className="w-full px-5 py-4 bg-bg-primary border border-border rounded-2xl text-text-primary font-serif outline-none focus:border-status-success shadow-sm" />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-text-muted">€</span>
                      </div>
                    </div>
                  )}
                  <div className="space-y-3">
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                      <CreditCard className="w-3 h-3" /> Pénalité no-show
                    </label>
                    <div className="relative">
                      <input type="number" min={0} value={penalty} onChange={(e) => setConfig(c => ({ ...c, cardImprintPenaltyAmount: Number(e.target.value) }))} className="w-full px-5 py-4 bg-bg-primary border border-border rounded-2xl text-text-primary font-serif outline-none focus:border-status-success shadow-sm" />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-text-muted">€</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                      <Clock className="w-3 h-3" /> Annulation gratuite
                    </label>
                    <div className="relative">
                      <input type="number" min={0} value={cancelHrs} onChange={(e) => setConfig(c => ({ ...c, cardImprintCancelHours: Number(e.target.value) }))} className="w-full px-5 py-4 bg-bg-primary border border-border rounded-2xl text-text-primary font-serif outline-none focus:border-status-success shadow-sm" />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-text-muted uppercase">h avant</span>
                    </div>
                  </div>
                </div>

                {/* Info banner */}
                <div className="flex items-start gap-3 p-5 bg-bg-secondary rounded-2xl border border-border">
                  <Fingerprint className="w-4 h-4 text-status-success mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-relaxed">
                    La carte n&apos;est <span className="text-status-success">jamais débitée</span> si le client vient.
                    En cas de no-show, <span className="text-text-primary">{penalty} €</span> sont prélevés automatiquement le lendemain.
                    Annulation gratuite jusqu&apos;à <span className="text-text-primary">{cancelHrs}h</span> avant.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
