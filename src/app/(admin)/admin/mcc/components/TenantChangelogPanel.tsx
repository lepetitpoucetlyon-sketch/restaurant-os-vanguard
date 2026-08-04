"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { History, Filter, ChevronDown, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { authedFetch } from '@/lib/client/authedFetch';
import { useNexusFleet } from '@/shared/nexus/engines/Intelligence';
import type { ChangeCategory, ChangelogEntry } from '@/shared/nexus/engines/mcc/ChangelogService';

const CHANGELOG_PAGE_SIZE = 80;

const CATEGORY_META: Record<ChangeCategory, { label: string; color: string }> = {
  UI_OVERRIDE:  { label: 'UI',          color: 'text-violet-400 bg-violet-500/10 border-violet-500/30' },
  FEATURE_FLAG: { label: 'Feature',     color: 'text-blue-400 bg-status-info/10 border-blue-500/30'     },
  BILLING:      { label: 'Billing',     color: 'text-status-success bg-status-success/10 border-emerald-500/30' },
  UPGRADE:      { label: 'Upgrade',     color: 'text-action-primary bg-action-primary/10 border-action-primary/30'  },
  DEBUG:        { label: 'Debug',       color: 'text-orange-400 bg-orange-500/10 border-orange-500/30'},
  CONFIG:       { label: 'Config',      color: 'text-text-secondary bg-slate-500/10 border-slate-500/30'  },
  MAINTENANCE:  { label: 'Maintenance', color: 'text-status-danger bg-status-danger/10 border-red-500/30'        },
  ROLLOUT:      { label: 'Rollout',     color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'     },
  CUSTOM:       { label: 'Custom',      color: 'text-pink-400 bg-pink-500/10 border-pink-500/30'     },
};

const ALL_CATEGORIES = Object.keys(CATEGORY_META) as ChangeCategory[];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)   return 'à l\'instant';
  if (m < 60)  return `il y a ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

export function TenantChangelogPanel() {
  const { instances } = useNexusFleet();

  const [selectedId, setSelectedId]     = useState<string>('__FLEET__');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [filterCat, setFilterCat]       = useState<ChangeCategory | 'ALL'>('ALL');
  const [entries, setEntries]           = useState<ChangelogEntry[]>([]);
  const [isLoading, setIsLoading]       = useState(false);
  const [expanded, setExpanded]         = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(CHANGELOG_PAGE_SIZE) });
      if (selectedId === '__FLEET__') {
        params.set('scope', 'fleet');
      } else {
        params.set('tenantId', selectedId);
      }
      if (filterCat !== 'ALL') params.set('category', filterCat);

      const res  = await authedFetch(`/api/admin/fleet/changelog?${params}`);
      const data = await res.json() as { changelog?: ChangelogEntry[] };
      setEntries(data.changelog ?? []);
    } catch {
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedId, filterCat]);

  useEffect(() => { load(); }, [load]);

  const displayName = selectedId === '__FLEET__'
    ? 'Flotte entière'
    : (instances.find(i => i.id === selectedId)?.name ?? selectedId);

  return (
    <div className="p-6 bg-surface-card border border-border-subtle rounded-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <History className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted">Historique</h3>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-tighter">Changelog auto-catégorisé</p>
          </div>
        </div>
        <button onClick={load} disabled={isLoading} className="p-2 rounded-lg bg-bg-primary/30 border border-border-subtle text-secondary hover:text-muted transition-all">
          <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
        </button>
      </div>

      {/* Tenant selector + category filter */}
      <div className="flex gap-2 flex-wrap">
        {/* Tenant dropdown */}
        <div className="relative flex-1 min-w-[160px]">
          <button
            onClick={() => setDropdownOpen(o => !o)}
            className="w-full flex items-center justify-between px-3 py-2 bg-bg-primary/50 border border-border-subtle rounded-xl text-xs font-medium text-muted hover:border-border-default transition-all"
          >
            <span className="truncate">{displayName}</span>
            <ChevronDown className={cn('w-3.5 h-3.5 text-secondary shrink-0 ml-1 transition-transform', dropdownOpen && 'rotate-180')} />
          </button>
          {dropdownOpen && (
            <div className="absolute z-20 top-full mt-1 w-full bg-surface-bg border border-border-subtle rounded-xl overflow-hidden shadow-xl">
              <button
                onClick={() => { setSelectedId('__FLEET__'); setDropdownOpen(false); }}
                className={cn('w-full text-left px-3 py-2 text-xs hover:bg-surface-card transition-colors', selectedId === '__FLEET__' ? 'text-cyan-400' : 'text-muted')}
              >
                Flotte entière
              </button>
              {instances.map(inst => (
                <button
                  key={inst.id}
                  onClick={() => { setSelectedId(inst.id); setDropdownOpen(false); }}
                  className={cn('w-full text-left px-3 py-2 text-xs hover:bg-surface-card transition-colors', inst.id === selectedId ? 'text-cyan-400' : 'text-muted')}
                >
                  {inst.name ?? inst.id}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category filter */}
        <div className="relative">
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value as ChangeCategory | 'ALL')}
            className="appearance-none px-3 py-2 bg-bg-primary/50 border border-border-subtle rounded-xl text-xs font-medium text-muted pr-8 focus:outline-none hover:border-border-default transition-all cursor-pointer"
          >
            <option value="ALL">Toutes</option>
            {ALL_CATEGORIES.map(c => (
              <option key={c} value={c}>{CATEGORY_META[c].label}</option>
            ))}
          </select>
          <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary pointer-events-none" />
        </div>
      </div>

      {/* Summary badges */}
      {entries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {ALL_CATEGORIES
            .filter(c => entries.some(e => e.category === c))
            .map(c => {
              const count = entries.filter(e => e.category === c).length;
              return (
                <button
                  key={c}
                  onClick={() => setFilterCat(c)}
                  className={cn(
                    'px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider transition-all',
                    CATEGORY_META[c].color,
                    filterCat === c && 'ring-1 ring-white/20'
                  )}
                >
                  {CATEGORY_META[c].label} {count}
                </button>
              );
            })}
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
        {isLoading && (
          <div className="py-8 text-center text-secondary text-xs animate-pulse">Chargement...</div>
        )}
        {!isLoading && entries.length === 0 && (
          <div className="py-8 text-center text-secondary text-xs">Aucune entrée</div>
        )}
        {!isLoading && entries.map((entry, idx) => {
          const meta    = CATEGORY_META[entry.category];
          const isOpen  = expanded === entry.id;
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.02, duration: 0.2 }}
              className="relative pl-5"
            >
              {/* Timeline line */}
              {idx < entries.length - 1 && (
                <div className="absolute left-1.5 top-5 bottom-0 w-px bg-surface-card" />
              )}
              <div className="absolute left-0 top-3 w-3 h-3 rounded-full border-2 border-border-subtle bg-surface-bg" />

              <div
                className="ml-2 p-3 bg-bg-primary/30 border border-border-subtle rounded-xl cursor-pointer hover:border-border-subtle transition-all"
                onClick={() => setExpanded(isOpen ? null : entry.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border', meta.color)}>
                        {meta.label}
                      </span>
                      {entry.tenantId !== '__FLEET__' && (
                        <span className="text-[9px] text-secondary font-mono truncate">{entry.tenantId}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted font-medium mt-1 line-clamp-1">{entry.description}</p>
                    <p className="text-[9px] font-mono text-secondary mt-0.5">{entry.action}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] text-secondary">{timeAgo(entry.appliedAt)}</p>
                    {entry.affectedCount && entry.affectedCount > 1 && (
                      <p className="text-[8px] text-secondary/60">{entry.affectedCount} tenants</p>
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-3 pt-3 border-t border-border-subtle space-y-2">
                    {entry.key && (
                      <p className="text-[9px] font-mono text-secondary">
                        <span className="text-text-primary/30">Key: </span>{entry.key}
                      </p>
                    )}
                    <p className="text-[9px] text-secondary">
                      <span className="text-text-primary/30">Scope: </span>{entry.scope}
                      {' — '}
                      <span className="text-text-primary/30">Par: </span>{entry.appliedBy}
                    </p>
                    <p className="text-[9px] text-secondary">
                      <span className="text-text-primary/30">Date: </span>
                      {new Date(entry.appliedAt).toLocaleString('fr-FR')}
                    </p>
                    {(entry.before !== undefined || entry.after !== undefined) && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {entry.before !== undefined && (
                          <div className="p-2 bg-status-danger/5 border border-red-500/10 rounded-lg">
                            <p className="text-[8px] font-black uppercase text-status-danger/60 mb-1">Avant</p>
                            <pre className="text-[9px] text-secondary overflow-auto max-h-20 whitespace-pre-wrap break-all">
                              {JSON.stringify(entry.before, null, 2)}
                            </pre>
                          </div>
                        )}
                        {entry.after !== undefined && (
                          <div className="p-2 bg-status-success/5 border border-emerald-500/10 rounded-lg">
                            <p className="text-[8px] font-black uppercase text-status-success/60 mb-1">Après</p>
                            <pre className="text-[9px] text-secondary overflow-auto max-h-20 whitespace-pre-wrap break-all">
                              {JSON.stringify(entry.after, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
