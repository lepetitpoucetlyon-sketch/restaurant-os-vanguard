"use client";

import React from 'react';
import { Users, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useSettingsModule } from '@/shared/providers/hooks/settings/useSettingsModule';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { GoldSwitch } from '@/shared/components/ui/GoldSwitch';
import { cn } from '@/lib/ui.foundations';
import { RBAC_ROLES } from '@/kernel/contracts/rbac';
import { DEFAULT_RESPONSIBILITY_ROLES, type Responsibility } from '@/kernel/alerts/AlertRouter';
import type { AlertRouting } from '@nexus/contracts';

/** Configurateur « qui reçoit quoi » — rend lisible et éditable la table AlertRouting. */

const RESPONSIBILITIES: Responsibility[] = [
  'RESP_HYGIENE', 'RESP_STOCK', 'RESP_FISCAL', 'RESP_RH', 'RESP_SERVICE', 'RESP_TECHNIQUE', 'RESP_DIRECTION',
];

/** Rôles proposés à la sélection (encadrement + postes clés). */
const ASSIGNABLE_ROLES = ['admin', 'directeur', 'manager', 'comptable', 'chef_cuisinier', 'chef_rang', 'barman', 'serveur'] as const;

function roleLabel(role: string): string {
  return (RBAC_ROLES as Record<string, { label?: string }>)[role]?.label ?? role;
}

export function AlertRoutingSettings(): React.ReactElement {
  const { t } = useLanguage();
  const { settings, updateSettings, isSaving } = useSettingsModule();
  const routings: AlertRouting[] = settings.notificationRoutings ?? [];

  const entryFor = (resp: Responsibility): AlertRouting | undefined =>
    routings.find((r) => r.responsibility === resp || r.eventType === resp);

  const isEnabled = (resp: Responsibility) => entryFor(resp)?.enabled !== false;

  /** Rôles effectifs affichés : ceux configurés, sinon les défauts de la responsabilité. */
  const effectiveRoles = (resp: Responsibility): string[] => {
    const e = entryFor(resp);
    if (e?.roles && e.roles.length > 0) return e.roles;
    return DEFAULT_RESPONSIBILITY_ROLES[resp].map(String);
  };

  const persist = (resp: Responsibility, patch: Partial<AlertRouting>) => {
    const existing = entryFor(resp);
    const base: AlertRouting = existing ?? {
      eventType: resp,
      responsibility: resp,
      recipients: [],
      roles: DEFAULT_RESPONSIBILITY_ROLES[resp].map(String),
      channels: ['push'],
      enabled: true,
    };
    const next: AlertRouting = { ...base, responsibility: resp, ...patch };
    const others = routings.filter((r) => r !== existing);
    updateSettings({ ...settings, notificationRoutings: [...others, next] });
  };

  const toggleRole = (resp: Responsibility, role: string) => {
    const current = new Set(effectiveRoles(resp));
    if (current.has(role)) current.delete(role); else current.add(role);
    persist(resp, { roles: Array.from(current) });
  };

  return (
    <section className="rounded-2xl border border-border-default bg-surface-card p-5 space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-action-primary" />
          <h3 className="text-base font-bold text-text-primary">{t('settings.alertRouting.title')}</h3>
        </div>
        {isSaving && <span className="text-xs text-text-muted">{t('settings.alertRouting.saving')}</span>}
      </header>

      <p className="text-sm text-text-muted">{t('settings.alertRouting.subtitle')}</p>

      <div className="space-y-3">
        {RESPONSIBILITIES.map((resp) => {
          const enabled = isEnabled(resp);
          const active = new Set(effectiveRoles(resp));
          return (
            <div key={resp} className="rounded-xl border border-border-default p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">
                    {t(`settings.responsibilities.${resp}`)}
                  </span>
                  {!enabled && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-500">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {t('settings.alertRouting.mutedWarn')}
                    </span>
                  )}
                </div>
                <GoldSwitch checked={enabled} onChange={(v) => persist(resp, { enabled: v })} />
              </div>

              <div className={cn('flex flex-wrap gap-2', !enabled && 'opacity-40 pointer-events-none')}>
                {ASSIGNABLE_ROLES.map((role) => {
                  const on = active.has(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(resp, role)}
                      aria-pressed={on}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer',
                        on
                          ? 'bg-action-primary/15 border-action-primary/50 text-text-primary'
                          : 'bg-surface-glass border-border-default text-text-muted hover:text-text-primary'
                      )}
                    >
                      {roleLabel(role)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-border-default bg-surface-glass p-3">
        <ShieldAlert className="w-4 h-4 text-action-primary shrink-0 mt-0.5" />
        <p className="text-xs text-text-muted">{t('settings.alertRouting.criticalNote')}</p>
      </div>
    </section>
  );
}
