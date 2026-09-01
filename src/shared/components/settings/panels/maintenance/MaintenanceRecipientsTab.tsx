'use client';
import { useLanguage } from '@/shared/hooks';

import { Shield, Clock, Flame, Phone } from 'lucide-react';

export function MaintenanceRecipientsTab() {
  const { t } = useLanguage();
  return (
    <div className="p-6 rounded-3xl bg-surface-card border border-border-default space-y-4">
      <div className="space-y-1">
        <h3 className="text-base font-bold text-text-primary">{t('maintenance_recipients.matrix_title')}</h3>
        <p className="text-xs text-text-muted">
          Configurez les coordonnées de contact (Email, Mobile) des postes clés pour la réception des alertes d urgence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
        <div className="p-4 rounded-2xl bg-surface-glass border border-border-default space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{t('maintenance_recipients.director')}</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xs text-text-secondary font-medium">{t('maintenance_recipients.director_desc')}</p>
          <div className="pt-2 text-micro text-text-muted/80 space-y-1">
            <div>{t('maintenance_recipients.ch_app_mail_sms')}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-glass border border-border-default space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Manager de Shift</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-xs text-text-secondary font-medium">{t('maintenance_recipients.manager_desc')}</p>
          <div className="pt-2 text-micro text-text-muted/80 space-y-1">
            <div>{t('maintenance_recipients.ch_app_mail')}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-glass border border-border-default space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Chef de Cuisine & Barman</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xs text-text-secondary font-medium">{t('maintenance_recipients.kitchen_desc')}</p>
          <div className="pt-2 text-micro text-text-muted/80 space-y-1">
            <div>{t('maintenance_recipients.ch_app_sms')}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-glass border border-border-default space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Technicien SAV d Astreinte</span>
            <Phone className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-xs text-text-secondary font-medium">{t('maintenance_recipients.immediate')}</p>
          <div className="pt-2 text-micro text-text-muted/80 space-y-1">
            <div>{t('maintenance_recipients.ch_mail_sms')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
