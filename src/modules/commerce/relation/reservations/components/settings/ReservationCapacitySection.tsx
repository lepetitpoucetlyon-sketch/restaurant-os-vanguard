"use client";

import type { Dispatch, SetStateAction } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Target, Users, AlertTriangle } from 'lucide-react';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { cn } from '@/lib/ui.foundations';

type Config = ReturnType<typeof useSettings>['settings']['reservationConfig'];
type Slots  = ReturnType<typeof useSettings>['settings']['reservationSlots'];

interface Props {
  config: Config;
  setConfig: Dispatch<SetStateAction<Config>>;
  slots: Slots;
  setSlots: Dispatch<SetStateAction<Slots>>;
}

const cinematicItem: Variants = {
  hidden:  { opacity: 0, y: 20, filter: 'blur(10px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export function ReservationCapacitySection({ config, setConfig, slots, setSlots }: Props) {
  return (
    <motion.div variants={cinematicItem} className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10">
      <div className="flex items-center gap-4 mb-10">
        <motion.div whileHover={{ scale: 1.1, rotate: -10 }} className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent">
          <Target className="w-6 h-6" />
        </motion.div>
        <div>
          <h3 className="text-2xl font-serif text-text-primary uppercase tracking-tight italic">Capacity Matrix</h3>
          <p className="text-nano font-bold text-text-muted uppercase tracking-widest">Load Balancing &amp; Availability Slots</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
        <div className="space-y-3">
          <label className="block text-nano font-bold text-text-muted uppercase tracking-[0.2em] px-1">Slot Granularity</label>
          <select
            value={slots.slotDuration}
            onChange={(e) => setSlots(s => ({ ...s, slotDuration: Number(e.target.value) }))}
            className="w-full px-6 py-5 bg-bg-primary border border-border rounded-2xl text-text-primary font-serif outline-none appearance-none shadow-sm"
            data-tutorial="settings-5-4"
          >
            <option value={15} className="dark:bg-bg-secondary">15 Minutes (High Burst)</option>
            <option value={30} className="dark:bg-bg-secondary">30 Minutes (Balanced)</option>
            <option value={60} className="dark:bg-bg-secondary">60 Minutes (Steady Flow)</option>
          </select>
        </div>
        <div className="space-y-3">
          <label className="block text-nano font-bold text-text-muted uppercase tracking-[0.2em] px-1">Buffer Interval</label>
          <select
            value={slots.intervalBetweenSlots}
            onChange={(e) => setSlots(s => ({ ...s, intervalBetweenSlots: Number(e.target.value) }))}
            className="w-full px-6 py-5 bg-bg-primary border border-border rounded-2xl text-text-primary font-serif outline-none appearance-none shadow-sm"
          >
            <option value={0} className="dark:bg-bg-secondary">No Buffer (Zero Latency)</option>
            <option value={15} className="dark:bg-bg-secondary">15 Minutes (Cleaning)</option>
            <option value={30} className="dark:bg-bg-secondary">30 Minutes (Transition)</option>
          </select>
        </div>
        <div className="space-y-3">
          <label className="block text-nano font-bold text-text-muted uppercase tracking-[0.2em] px-1">Load Cap / Slot</label>
          <div className="relative group">
            <input
              type="number"
              value={slots.maxCoversPerSlot}
              onChange={(e) => setSlots(s => ({ ...s, maxCoversPerSlot: Number(e.target.value) }))}
              className="w-full px-6 py-5 bg-bg-primary border border-border rounded-2xl text-text-primary font-serif outline-none shadow-sm"
            />
            <Users className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted transition-colors" />
          </div>
        </div>
      </div>

      {/* Overbooking Logic */}
      <div className={cn(
        'p-8 rounded-[2rem] border-2 transition-all duration-500',
        config.overbookingAllowed ? 'bg-bg-primary border-accent/20 shadow-lg shadow-accent/5' : 'bg-bg-tertiary/20 border-border',
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <motion.div
              animate={config.overbookingAllowed ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
              transition={{ repeat: config.overbookingAllowed ? Infinity : 0, duration: 2 }}
              className={cn('w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-lg', config.overbookingAllowed ? 'bg-accent text-bg-primary' : 'bg-bg-tertiary text-text-muted')}
            >
              <AlertTriangle className="w-6 h-6" />
            </motion.div>
            <div>
              <p className="font-serif text-text-primary uppercase tracking-tight italic">Stress-Test Protocols</p>
              <p className="text-nano font-bold text-text-muted uppercase tracking-widest mt-1">Exceed capacity limits by defined threshold</p>
            </div>
          </div>
          <button
            onClick={() => setConfig(c => ({ ...c, overbookingAllowed: !c.overbookingAllowed }))}
            className={cn('w-16 h-8 rounded-full relative transition-all duration-500', config.overbookingAllowed ? 'bg-accent shadow-lg shadow-accent/20' : 'bg-bg-tertiary border border-border')}
          >
            <motion.div
              animate={{ x: config.overbookingAllowed ? 34 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-1 left-1 w-6 h-6 bg-surface-card rounded-full shadow-md z-10"
            />
          </button>
        </div>

        <AnimatePresence>
          {config.overbookingAllowed && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-8 pt-8 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-nano font-bold text-accent uppercase tracking-[0.2em]">Intensity Threshold (%)</label>
                  <div className="relative group">
                    <input
                      type="number"
                      value={config.overbookingPercent || 10}
                      onChange={(e) => setConfig(c => ({ ...c, overbookingPercent: Number(e.target.value) }))}
                      className="w-full px-6 py-4 bg-bg-tertiary border border-border rounded-xl text-text-primary font-serif transition-all outline-none"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-accent">%</span>
                  </div>
                </div>
                <div className="flex items-center bg-accent/5 rounded-2xl p-6 border border-accent/10">
                  <p className="text-nano font-bold text-accent uppercase tracking-widest leading-relaxed">
                    Warning: Overbooking protocol activated. This targets higher occupancy at the cost of service pressure.
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
