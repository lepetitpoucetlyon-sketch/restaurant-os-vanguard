"use client";

import React, { useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/ui.foundations';

/** Journal de livraison — lecture seule, preuve opposable (collection append-only). */

interface DeliveryRecord {
  id: string;
  channel?: string;
  attemptedAt?: string;
  message?: string;
  severity?: string;
  responsibility?: string | null;
  roles?: string[];
  userIds?: string[];
  outcome?: 'dispatched' | 'skipped_quiet_hours' | 'muted' | 'no_recipients';
}

const OUTCOME_TONE: Record<string, string> = {
  dispatched: 'bg-status-success/15 text-status-success border-status-success/30',
  skipped_quiet_hours: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  muted: 'bg-surface-glass text-text-muted border-border-default',
  no_recipients: 'bg-status-danger/15 text-status-danger border-status-danger/30',
};

export function AlertDeliveryJournal(): React.ReactElement {
  const { t } = useLanguage();
  const [rows, setRows] = useState<DeliveryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const path = `${Nexus.getTenantPath('alertDeliveries')}`;
        const data = await Nexus.adapter.query<DeliveryRecord>(path);
        if (!alive) return;
        const sorted = [...(data ?? [])]
          .sort((a, b) => String(b.attemptedAt ?? '').localeCompare(String(a.attemptedAt ?? '')))
          .slice(0, 30);
        setRows(sorted);
      } catch (err) {
        logger.warn('[AlertDeliveryJournal] Lecture du journal échouée', err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const fmtWhen = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
  };

  const target = (r: DeliveryRecord) => {
    const parts = [...(r.roles ?? []), ...(r.userIds ?? [])];
    return parts.length > 0 ? parts.join(', ') : '—';
  };

  return (
    <section className="rounded-2xl border border-border-default bg-surface-card p-5 space-y-4">
      <header className="flex items-center gap-2">
        <ScrollText className="w-5 h-5 text-action-primary" />
        <h3 className="text-base font-bold text-text-primary">{t('settings.alertJournal.title')}</h3>
      </header>
      <p className="text-sm text-text-muted">{t('settings.alertJournal.subtitle')}</p>

      {loading ? (
        <div className="h-16 rounded-xl bg-surface-glass animate-pulse" />
      ) : rows.length === 0 ? (
        <p className="text-sm text-text-muted py-6 text-center">{t('settings.alertJournal.empty')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-text-muted border-b border-border-default">
                <th className="py-2 pr-3 font-semibold">{t('settings.alertJournal.colWhen')}</th>
                <th className="py-2 pr-3 font-semibold">{t('settings.alertJournal.colAlert')}</th>
                <th className="py-2 pr-3 font-semibold">{t('settings.alertJournal.colTarget')}</th>
                <th className="py-2 font-semibold">{t('settings.alertJournal.colResult')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border-default/50 text-text-primary">
                  <td className="py-2 pr-3 whitespace-nowrap text-text-muted">{fmtWhen(r.attemptedAt)}</td>
                  <td className="py-2 pr-3 max-w-[280px] truncate">{r.message ?? '—'}</td>
                  <td className="py-2 pr-3 text-text-muted">{target(r)}</td>
                  <td className="py-2">
                    <span className={cn('inline-block px-2 py-0.5 rounded-md border text-[11px] font-medium',
                      OUTCOME_TONE[r.outcome ?? 'muted'] ?? OUTCOME_TONE.muted)}>
                      {t(`settings.alertJournal.${r.outcome ?? 'muted'}`)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
