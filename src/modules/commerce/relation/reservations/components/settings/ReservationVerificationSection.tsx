"use client";

import type { Dispatch, SetStateAction } from 'react';
import { motion, Variants } from 'framer-motion';
import { ShieldCheck, Zap, CreditCard, History } from 'lucide-react';
import { useSettings } from '@/shared/contexts/SettingsContext';
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

const TOGGLES = [
  { id: 'autoConfirm',    label: 'Autonomous approval',  desc: 'No manual intervention',       icon: Zap },
  { id: 'requireDeposit', label: 'Financial Collateral',  desc: 'Require deposit/guarantee',    icon: CreditCard },
] as const;

export function ReservationVerificationSection({ config, setConfig }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
      {/* Verification Logic */}
      <motion.div variants={cinematicItem} className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10 flex flex-col">
        <div className="flex items-center gap-4 mb-10">
          <motion.div whileHover={{ scale: 1.1, rotate: -180 }} className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent">
            <ShieldCheck className="w-6 h-6" />
          </motion.div>
          <div>
            <h3 className="text-xl font-serif text-text-primary uppercase tracking-tight italic">Verification Logic</h3>
            <p className="text-nano font-bold text-text-muted uppercase tracking-widest">Confirmation &amp; Collateral</p>
          </div>
        </div>

        <div className="space-y-6 flex-1">
          {TOGGLES.map((toggle) => (
            <div key={toggle.id} className="p-6 bg-bg-primary rounded-[2rem] border border-border shadow-sm hover:shadow-md transition-all group/toggle">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <toggle.icon className="w-4 h-4 text-text-muted" />
                  <p className="font-serif text-text-primary text-nano uppercase tracking-widest italic">{toggle.label}</p>
                </div>
                <button
                  onClick={() => setConfig(c => ({ ...c, [toggle.id]: !c[toggle.id as keyof typeof c] }))}
                  className={cn('w-12 h-6 rounded-full relative transition-all duration-300', config[toggle.id as keyof typeof config] ? 'bg-status-success' : 'bg-bg-tertiary border border-border')}
                  data-tutorial={toggle.id === 'requireDeposit' ? 'settings-5-5' : undefined}
                >
                  <motion.div
                    animate={{ x: config[toggle.id as keyof typeof config] ? 26 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-1 left-1 w-4 h-4 bg-surface-card rounded-full shadow-sm"
                  />
                </button>
              </div>
              <p className="text-nano font-bold text-text-muted uppercase tracking-widest leading-none opacity-80">{toggle.desc}</p>
            </div>
          ))}
        </div>

        {config.requireDeposit && (
          <motion.div initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} className="mt-6 p-6 bg-bg-tertiary rounded-[2rem] border border-border space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-nano font-bold text-text-muted uppercase tracking-widest px-1">Unit</label>
                <select
                  value={config.depositType || 'fixed'}
                  onChange={(e) => setConfig(c => ({ ...c, depositType: e.target.value as 'fixed' | 'percent' }))}
                  className="w-full px-4 py-3 bg-bg-primary border border-border rounded-xl text-nano font-bold uppercase tracking-widest outline-none text-text-primary"
                >
                  <option value="fixed" className="dark:bg-bg-secondary">Fixed</option>
                  <option value="percent" className="dark:bg-bg-secondary">Percentage</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-nano font-bold text-text-muted uppercase tracking-widest px-1">Value</label>
                <div className="relative group">
                  <input
                    type="number"
                    value={config.depositAmount || 20}
                    onChange={(e) => setConfig(c => ({ ...c, depositAmount: Number(e.target.value) }))}
                    className="w-full px-4 py-3 bg-bg-primary border border-border rounded-xl text-nano font-bold outline-none text-text-primary"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-text-muted">{config.depositType === 'percent' ? '%' : '€'}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Synchronicity — Reminders & No-show */}
      <motion.div variants={cinematicItem} className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10">
        <div className="flex items-center gap-4 mb-10">
          <motion.div whileHover={{ scale: 1.1, rotate: 180 }} className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent">
            <History className="w-6 h-6" />
          </motion.div>
          <div>
            <h3 className="text-xl font-serif text-text-primary uppercase tracking-tight italic">Synchronicity</h3>
            <p className="text-nano font-bold text-text-muted uppercase tracking-widest">Reminders &amp; Latency Handlers</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <label className="block text-nano font-bold text-text-muted uppercase tracking-[0.2em] px-1">Email Dispatch Window</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[2, 4, 24, 48].map((h) => (
                <motion.button
                  key={h}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setConfig(c => ({ ...c, emailReminderHours: h }))}
                  className={cn('py-4 rounded-xl font-bold text-nano uppercase tracking-widest transition-all border', config.emailReminderHours === h ? 'bg-text-primary text-bg-primary border-text-primary shadow-lg' : 'bg-bg-tertiary text-text-muted hover:text-text-primary border-border')}
                >
                  T-{h} Hours
                </motion.button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-nano font-bold text-text-muted uppercase tracking-[0.2em] px-1">No-Show Tolerance</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[10, 15, 20, 30].map((m) => (
                <motion.button
                  key={m}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setConfig(c => ({ ...c, noShowDelayMinutes: m }))}
                  className={cn('py-4 rounded-xl font-bold text-nano uppercase tracking-widest transition-all border', config.noShowDelayMinutes === m ? 'bg-text-primary text-bg-primary border-text-primary shadow-lg' : 'bg-bg-tertiary text-text-muted hover:text-text-primary border-border')}
                >
                  +{m} Minutes
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
