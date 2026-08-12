"use client";

import type { Dispatch, SetStateAction } from 'react';
import { motion, Variants } from 'framer-motion';
import { Bell, Mail, Phone, Smartphone } from 'lucide-react';
import { useSettings } from '@/shared/hooks';
import { cn } from '@/lib/ui.foundations';
import { JsonObject } from "@/lib/types/json";

type Config = ReturnType<typeof useSettings>['settings']['reservationConfig'];

interface Props {
  config: Config;
  setConfig: Dispatch<SetStateAction<Config>>;
}

const cinematicItem: Variants = {
  hidden:  { opacity: 0, y: 20, filter: 'blur(10px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const MGR_TOGGLES = [
  { key: 'mgrNotifNewReservation', label: 'Nouvelle réservation' },
  { key: 'mgrNotifCancellation',   label: 'Annulation' },
  { key: 'mgrNotifNoShow',         label: 'No-show détecté' },
  { key: 'mgrNotifModification',   label: 'Modification client' },
] as const;

const CLIENT_TOGGLES = [
  { key: 'clientNotifConfirmation', label: 'Confirmation de réservation' },
  { key: 'clientNotifReminder',     label: 'Rappel avant visite' },
  { key: 'clientNotifCancellation', label: 'Confirmation annulation' },
] as const;

export function ReservationNotificationSection({ config, setConfig }: Props) {
  const cfg = config as JsonObject;

  return (
    <motion.div variants={cinematicItem} className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10">
      <div className="flex items-center gap-4 mb-10">
        <motion.div whileHover={{ scale: 1.1, rotate: 10 }} className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent">
          <Bell className="w-6 h-6" />
        </motion.div>
        <div>
          <h3 className="text-2xl font-serif text-text-primary uppercase tracking-tight italic">Notification Matrix</h3>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Gérant &amp; Client</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Manager notifications */}
        <div className="space-y-5 p-6 rounded-2xl border border-border bg-bg-tertiary/30">
          <p className="text-xs font-black uppercase tracking-widest text-text-muted">Alertes Gérant</p>

          {MGR_TOGGLES.map(({ key, label }) => {
            const checked = !!(cfg[key]);
            return (
              <div key={key} className="flex items-center justify-between gap-4">
                <span className="text-sm text-text-primary font-medium">{label}</span>
                <button onClick={() => setConfig(c => ({ ...c, [key]: !checked }))} className={cn('w-10 h-5 rounded-full transition-all relative shrink-0', checked ? 'bg-status-success' : 'bg-bg-primary border border-border')}>
                  <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm', checked ? 'right-0.5' : 'left-0.5')} />
                </button>
              </div>
            );
          })}

          <div className="pt-2 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Canaux</p>
            <div className="flex gap-2 flex-wrap">
              {(['email', 'sms', 'push'] as const).map((ch) => {
                const channels = (cfg.mgrNotifChannels as string[]) ?? ['email'];
                const active = channels.includes(ch);
                const Icon = ch === 'email' ? Mail : ch === 'sms' ? Phone : Smartphone;
                return (
                  <button
                    key={ch}
                    onClick={() => {
                      const next = (active ? channels.filter(c => c !== ch) : [...channels, ch]) as Array<'email' | 'sms' | 'push'>;
                      setConfig(c => ({ ...c, mgrNotifChannels: next }));
                    }}
                    className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all uppercase', active ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-muted')}
                  >
                    <Icon className="w-3 h-3" /> {ch}
                  </button>
                );
              })}
            </div>
            <input
              type="email"
              value={(cfg.mgrNotifEmail as string) ?? ''}
              onChange={(e) => setConfig(c => ({ ...c, mgrNotifEmail: e.target.value }))}
              placeholder="Email du gérant"
              className="w-full px-4 py-2.5 bg-bg-primary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent transition-all"
            />
          </div>
        </div>

        {/* Client notifications */}
        <div className="space-y-5 p-6 rounded-2xl border border-border bg-bg-tertiary/30">
          <p className="text-xs font-black uppercase tracking-widest text-text-muted">Messages Client</p>

          {CLIENT_TOGGLES.map(({ key, label }) => {
            const raw = cfg[key];
            const checked = raw !== undefined ? !!raw : true;
            return (
              <div key={key} className="flex items-center justify-between gap-4">
                <span className="text-sm text-text-primary font-medium">{label}</span>
                <button onClick={() => setConfig(c => ({ ...c, [key]: !checked }))} className={cn('w-10 h-5 rounded-full transition-all relative shrink-0', checked ? 'bg-status-success' : 'bg-bg-primary border border-border')}>
                  <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm', checked ? 'right-0.5' : 'left-0.5')} />
                </button>
              </div>
            );
          })}

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Rappel envoyé avant (h)</label>
            <input
              type="number"
              min={1}
              max={72}
              value={(cfg.clientReminderHours as number) ?? 24}
              onChange={(e) => setConfig(c => ({ ...c, clientReminderHours: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 bg-bg-primary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent transition-all"
            />
          </div>

          <div className="pt-2 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Canaux Client</p>
            <div className="flex gap-2 flex-wrap">
              {(['email', 'sms'] as const).map((ch) => {
                const channels = (cfg.clientNotifChannels as string[]) ?? ['email'];
                const active = channels.includes(ch);
                const Icon = ch === 'email' ? Mail : Phone;
                return (
                  <button
                    key={ch}
                    onClick={() => {
                      const next = (active ? channels.filter(c => c !== ch) : [...channels, ch]) as Array<'email' | 'sms'>;
                      setConfig(c => ({ ...c, clientNotifChannels: next }));
                    }}
                    className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all uppercase', active ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-muted')}
                  >
                    <Icon className="w-3 h-3" /> {ch}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
