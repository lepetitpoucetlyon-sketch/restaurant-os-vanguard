"use client";

import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { motion, Variants } from 'framer-motion';
import { Bell, Mail, Phone, Smartphone, MessageSquare, Sparkles, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { cn } from '@/lib/ui.foundations';
import type { JsonObject } from "@/shared/types/json";
import { ReservationTemplateFormatter, DEFAULT_RESERVATION_TEMPLATES } from '@/lib/templates/ReservationTemplateFormatter';

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
  { key: 'mgrNotifNewReservation', label: 'Nouvelle réservation reçue' },
  { key: 'mgrNotifCancellation',   label: 'Annulation d’une table' },
  { key: 'mgrNotifNoShow',         label: 'Alerte No-show détecté' },
  { key: 'mgrNotifModification',   label: 'Modification client en direct' },
] as const;

const CLIENT_TOGGLES = [
  { key: 'clientNotifConfirmation', label: 'Confirmation immédiate (SMS / Email)' },
  { key: 'clientNotifReminder',     label: 'Rappels avant le repas (J-1 & H-2)' },
  { key: 'clientNotifCancellation', label: 'Confirmation d’annulation' },
] as const;

const DYNAMIC_VARIABLES = [
  { tag: '{prenom}', label: 'Prénom client', example: 'Alexandre' },
  { tag: '{nom}', label: 'Nom client', example: 'Dubois' },
  { tag: '{restaurant}', label: 'Nom restaurant', example: 'Ombellule' },
  { tag: '{date}', label: 'Date du repas', example: 'Jeudi 20 Août 2026' },
  { tag: '{heure}', label: 'Heure', example: '20h00' },
  { tag: '{couverts}', label: 'Nb couverts', example: '2' },
  { tag: '{lien_modification}', label: 'Lien 1-clic', example: 'https://ombellule.fr/r/a7104' },
  { tag: '{table}', label: 'Table/Zone', example: 'Table 4 (Vue Cuisine)' },
  { tag: '{politique_annulation}', label: 'Politique No-Show', example: 'Annulation libre 24h avant' },
];

type TemplateTab = 'confirmation' | 'reminder' | 'cancellation';

export function ReservationNotificationSection({ config, setConfig }: Props) {
  const cfg = config as JsonObject;
  const [activeTab, setActiveTab] = useState<TemplateTab>('confirmation');

  const currentTemplateKey = activeTab === 'confirmation' 
    ? 'confirmationMessage' 
    : activeTab === 'reminder' 
    ? 'reminderMessage' 
    : 'cancellationMessage';

  const defaultText = activeTab === 'confirmation'
    ? DEFAULT_RESERVATION_TEMPLATES.confirmationSms
    : activeTab === 'reminder'
    ? DEFAULT_RESERVATION_TEMPLATES.reminderSms
    : DEFAULT_RESERVATION_TEMPLATES.cancellationSms;

  const currentText = (cfg[currentTemplateKey] as string) || defaultText;

  // Insert variable tag into template
  const insertVariable = (tag: string) => {
    const updated = currentText ? `${currentText} ${tag}` : tag;
    setConfig(c => ({ ...c, [currentTemplateKey]: updated }));
  };

  // Preview interpolation
  const previewText = ReservationTemplateFormatter.interpolate(currentText, {
    customerName: 'Alexandre Dubois',
    firstName: 'Alexandre',
    lastName: 'Dubois',
    restaurantName: 'Ombellule',
    date: '2026-08-20',
    time: '20h00',
    covers: 2,
    tableName: 'Table 4 (Vue Cuisine)',
    modifyLink: 'https://ombellule.fr/r/a7104',
    cancellationPolicy: 'Annulation libre jusqu’à 24h avant',
  });

  return (
    <motion.div variants={cinematicItem} className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10 space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border/50 pb-6">
        <div className="flex items-center gap-4">
          <motion.div whileHover={{ scale: 1.1, rotate: 10 }} className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent">
            <Bell className="w-6 h-6" />
          </motion.div>
          <div>
            <h3 className="text-2xl font-serif text-text-primary uppercase tracking-tight italic">Studio Notifications &amp; SMS</h3>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Passerelle Twilio, Emails &amp; Templates Dynamiques</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-status-success/10 border border-status-success/20 px-3.5 py-1.5 rounded-full">
          <CheckCircle2 className="w-4 h-4 text-status-success" />
          <span className="text-xs font-mono font-bold text-status-success">Twilio Gateway Connecté</span>
        </div>
      </div>

      {/* Grid: Alertes Gérant vs Canaux Client */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Manager notifications */}
        <div className="space-y-5 p-6 rounded-2xl border border-border bg-bg-tertiary/30">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-text-muted">Alertes Équipe &amp; Gérant</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-mono font-bold">Temps Réel</span>
          </div>

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

          <div className="pt-3 border-t border-border/40 space-y-3">
            <p className="text-chip-label text-text-muted">Canaux de notification gérant</p>
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
                    className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all uppercase', active ? 'border-accent bg-accent/10 text-accent shadow-sm' : 'border-border text-text-muted hover:border-text-muted')}
                  >
                    <Icon className="w-3 h-3" /> {ch}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <input
                type="email"
                value={(cfg.mgrNotifEmail as string) ?? ''}
                onChange={(e) => setConfig(c => ({ ...c, mgrNotifEmail: e.target.value }))}
                placeholder="Email gérant (ex: resa@ombellule.fr)"
                className="w-full px-3.5 py-2.5 bg-bg-primary border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-accent transition-all"
              />
              <input
                type="tel"
                value={(cfg.mgrNotifPhone as string) ?? ''}
                onChange={(e) => setConfig(c => ({ ...c, mgrNotifPhone: e.target.value }))}
                placeholder="Mobile gérant (+33 6 ...)"
                className="w-full px-3.5 py-2.5 bg-bg-primary border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-accent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Client triggers & timing */}
        <div className="space-y-5 p-6 rounded-2xl border border-border bg-bg-tertiary/30">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-text-muted">Déclencheurs Client</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-mono font-bold">Automatisé</span>
          </div>

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

          <div className="pt-3 border-t border-border/40 space-y-4">
            <p className="text-chip-label text-text-muted">Cadencement des Rappels Programmés</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1">
                  <Clock className="w-3 h-3 text-accent" /> Rappel Principal (J-1/J-2)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={72}
                    value={(cfg.emailReminderHours as number) ?? (cfg.clientReminderHours as number) ?? 24}
                    onChange={(e) => setConfig(c => ({ ...c, emailReminderHours: Number(e.target.value), clientReminderHours: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2 bg-bg-primary border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-accent transition-all pr-12 font-mono"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-text-muted font-bold">heures</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1">
                  <Clock className="w-3 h-3 text-accent" /> Rappel Express SMS (Jour J)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={(cfg.smsReminderHours as number) ?? 2}
                    onChange={(e) => setConfig(c => ({ ...c, smsReminderHours: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2 bg-bg-primary border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-accent transition-all pr-12 font-mono"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-text-muted font-bold">heures</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TEMPLATE CUSTOMIZER & LIVE SMARTPHONE PREVIEW */}
      <div className="border border-border/80 rounded-3xl p-6 md:p-8 bg-bg-tertiary/20 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-lg font-serif text-text-primary uppercase tracking-tight italic">Personnalisation des Messages &amp; SMS</h4>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Insérez des variables dynamiques en 1 clic</p>
            </div>
          </div>

          {/* Template Tabs */}
          <div className="flex p-1 bg-bg-primary border border-border rounded-2xl gap-1">
            <button
              onClick={() => setActiveTab('confirmation')}
              className={cn('px-4 py-1.5 rounded-xl text-xs font-bold transition-all', activeTab === 'confirmation' ? 'bg-accent text-bg-primary shadow-sm' : 'text-text-muted hover:text-text-primary')}
            >
              Confirmation Immédiate
            </button>
            <button
              onClick={() => setActiveTab('reminder')}
              className={cn('px-4 py-1.5 rounded-xl text-xs font-bold transition-all', activeTab === 'reminder' ? 'bg-accent text-bg-primary shadow-sm' : 'text-text-muted hover:text-text-primary')}
            >
              Rappel Programmé
            </button>
            <button
              onClick={() => setActiveTab('cancellation')}
              className={cn('px-4 py-1.5 rounded-xl text-xs font-bold transition-all', activeTab === 'cancellation' ? 'bg-accent text-bg-primary shadow-sm' : 'text-text-muted hover:text-text-primary')}
            >
              Annulation
            </button>
          </div>
        </div>

        {/* Dynamic Variable Chips */}
        <div className="space-y-2">
          <p className="text-chip-label text-text-muted flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-accent" /> Variables dynamiques disponibles (cliquez pour insérer) :
          </p>
          <div className="flex flex-wrap gap-2">
            {DYNAMIC_VARIABLES.map(({ tag, label, example }) => (
              <button
                key={tag}
                type="button"
                onClick={() => insertVariable(tag)}
                title={`Exemple : ${example}`}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-bg-secondary hover:border-accent/60 hover:bg-accent/5 text-xs text-text-primary transition-all font-mono shadow-xs"
              >
                <span className="text-accent font-bold">{tag}</span>
                <span className="text-[10px] text-text-muted group-hover:text-text-primary transition-colors">({label})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Editor & Phone Simulator Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
          {/* Text Editor */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between text-xs text-text-muted font-mono">
              <span>Texte du message {activeTab.toUpperCase()} :</span>
              <span>{currentText.length} caractères • ~{Math.ceil(currentText.length / 153)} segment(s) SMS</span>
            </div>
            <textarea
              rows={6}
              value={currentText}
              onChange={(e) => setConfig(c => ({ ...c, [currentTemplateKey]: e.target.value }))}
              placeholder="Rédigez le texte du message..."
              className="w-full p-4 bg-bg-primary border border-border rounded-2xl text-sm text-text-primary focus:outline-none focus:border-accent transition-all font-mono leading-relaxed"
            />
            <div className="flex items-center justify-between text-[11px] text-text-muted">
              <span className="flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-accent" /> Le lien autonome {`{lien_modification}`} permet au client d’annuler en 1-clic pour libérer la table.
              </span>
              <button
                type="button"
                onClick={() => setConfig(c => ({ ...c, [currentTemplateKey]: defaultText }))}
                className="text-xs text-accent hover:underline font-bold"
              >
                Rétablir défaut
              </button>
            </div>
          </div>

          {/* Live Smartphone Simulator */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full max-w-[280px] bg-neutral-900 border-4 border-neutral-700 rounded-[2.5rem] p-3 shadow-2xl space-y-3 text-white">
              {/* Phone speaker & camera notch */}
              <div className="w-20 h-4 bg-neutral-800 rounded-full mx-auto" />
              
              {/* Header SMS */}
              <div className="text-center border-b border-neutral-800 pb-2 space-y-0.5">
                <div className="w-8 h-8 rounded-full bg-neutral-700 mx-auto flex items-center justify-center text-xs font-bold text-neutral-300">
                  O
                </div>
                <p className="text-[11px] font-bold">Ombellule</p>
                <p className="text-[8px] text-neutral-400 uppercase tracking-widest font-mono">SMS Garanti • Twilio</p>
              </div>

              {/* Chat Bubble */}
              <div className="py-2 space-y-2 min-h-[160px] flex flex-col justify-end">
                <div className="text-[9px] text-neutral-500 text-center font-mono">Aujourd'hui 14:32</div>
                <div className="bg-emerald-600 text-white text-[11px] p-3 rounded-2xl rounded-bl-xs leading-snug shadow-md space-y-1">
                  <p>{previewText}</p>
                </div>
              </div>

              {/* Phone home indicator */}
              <div className="w-24 h-1 bg-neutral-600 rounded-full mx-auto mt-2" />
            </div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest text-center mt-3">
              Aperçu en direct (avec données d’exemple)
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
