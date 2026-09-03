"use client";

import React from 'react';
import { Moon, ShieldAlert } from 'lucide-react';
import { useSettingsModule } from '@/shared/providers/hooks/settings/useSettingsModule';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { GoldSwitch } from '@/shared/components/ui/GoldSwitch';
import type { NotificationsConfig } from '@nexus/contracts';

/**
 * QuietHoursSettings — configurateur des heures calmes (branche dndStartTime/dndEndTime).
 *
 * Donne au restaurateur la maîtrise de la plage horaire pendant laquelle les
 * alertes non critiques ne poussent pas de notification (elles restent au centre).
 * Les alertes CRITIQUES traversent toujours (QuietHoursPolicy) — rappelé ici.
 */
const DEFAULT_NOTIF: NotificationsConfig = {
  globalSound: true,
  doNotDisturb: false,
  dndStartTime: '00:00',
  dndEndTime: '07:00',
};

export function QuietHoursSettings(): React.ReactElement {
  const { t } = useLanguage();
  const { settings, updateSettings, isSaving } = useSettingsModule();
  const notif: NotificationsConfig = settings.notifications ?? DEFAULT_NOTIF;

  const patch = (p: Partial<NotificationsConfig>) =>
    updateSettings({ ...settings, notifications: { ...notif, ...p } });

  const inputClass =
    'rounded-lg border border-border-default bg-surface-glass px-3 py-2 text-sm text-text-primary ' +
    'focus:outline-none focus:ring-2 focus:ring-action-primary/40 disabled:opacity-40';

  return (
    <section className="rounded-2xl border border-border-default bg-surface-card p-5 space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Moon className="w-5 h-5 text-action-primary" />
          <h3 className="text-base font-bold text-text-primary">{t('settings.quietHours.title')}</h3>
        </div>
        {isSaving && (
          <span className="text-xs text-text-muted">{t('settings.quietHours.saving')}</span>
        )}
      </header>

      <p className="text-sm text-text-muted">{t('settings.quietHours.subtitle')}</p>

      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-text-primary">
            {t('settings.quietHours.permanentLabel')}
          </div>
          <div className="text-xs text-text-muted">
            {t('settings.quietHours.permanentHint')}
          </div>
        </div>
        <GoldSwitch
          checked={notif.doNotDisturb === true}
          onChange={(v) => patch({ doNotDisturb: v })}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="dnd-start" className="text-sm text-text-muted">
          {t('settings.quietHours.fromLabel')}
        </label>
        <input
          id="dnd-start"
          type="time"
          value={notif.dndStartTime ?? '00:00'}
          disabled={notif.doNotDisturb === true}
          onChange={(e) => patch({ dndStartTime: e.target.value })}
          className={inputClass}
          aria-label={t('settings.quietHours.fromLabel')}
        />
        <label htmlFor="dnd-end" className="text-sm text-text-muted">
          {t('settings.quietHours.toLabel')}
        </label>
        <input
          id="dnd-end"
          type="time"
          value={notif.dndEndTime ?? '07:00'}
          disabled={notif.doNotDisturb === true}
          onChange={(e) => patch({ dndEndTime: e.target.value })}
          className={inputClass}
          aria-label={t('settings.quietHours.toLabel')}
        />
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-border-default bg-surface-glass p-3">
        <ShieldAlert className="w-4 h-4 text-action-primary shrink-0 mt-0.5" />
        <p className="text-xs text-text-muted">{t('settings.quietHours.criticalNote')}</p>
      </div>
    </section>
  );
}
