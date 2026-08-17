"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNexusFleet } from '@/modules/intelligence';
import { authedFetch } from '@/lib/client/authedFetch';
import { Activity, Brain } from 'lucide-react';
import type { StatusFilter } from './fleet-command/fleetCommandTypes';
import { FleetCommandHeader } from './fleet-command/FleetCommandHeader';
import { FleetCommandTableRow } from './fleet-command/FleetCommandTableRow';

export function FleetCommandTable() {
  const { instances, isLoading } = useNexusFleet();
  const [reindexing, setReindexing] = useState<Record<string, boolean>>({});
  const [commanding, setCommanding] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [filterOpen, setFilterOpen] = useState(false);
  const [commandMenuId, setCommandMenuId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const filteredInstances = useMemo(() => instances.filter(inst => {
    const matchesSearch = !searchQuery.trim() ||
      inst.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.key?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || inst.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [instances, searchQuery, statusFilter]);

  useEffect(() => { setPage(0); }, [searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredInstances.length / PAGE_SIZE));
  const pagedInstances = useMemo(
    () => filteredInstances.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [filteredInstances, page],
  );

  const handleReindex = useCallback(async (instanceId: string) => {
    setReindexing(prev => ({ ...prev, [instanceId]: true }));
    try {
      await authedFetch('/api/admin/fleet/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reindex', instanceId }),
      });
    } finally {
      setReindexing(prev => ({ ...prev, [instanceId]: false }));
    }
  }, []);

  const handleCommand = useCallback(async (instanceId: string, action: string) => {
    setCommandMenuId(null);
    setCommanding(prev => ({ ...prev, [instanceId]: true }));
    try {
      await authedFetch('/api/admin/fleet/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, instanceId }),
      });
    } finally {
      setCommanding(prev => ({ ...prev, [instanceId]: false }));
    }
  }, []);

  const handleToggleCommandMenu = useCallback((id: string) => {
    setCommandMenuId(prev => (prev === id ? null : id));
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-focus/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-focus rounded-full border-t-transparent animate-spin" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Synchronisation Télémétrie...</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-card border border-border-subtle rounded-[2rem] overflow-hidden shadow-2xl">
      <FleetCommandHeader
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        filterOpen={filterOpen}
        onSearchChange={setSearchQuery}
        onToggleFilter={() => setFilterOpen(o => !o)}
        onSelectFilter={f => { setStatusFilter(f); setFilterOpen(false); }}
        onCloseFilter={() => setFilterOpen(false)}
      />

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-card">
              <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Instance ID</th>
              <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Statut / Santé</th>
              <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Risque HACCP</th>
              <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Utilisateurs</th>
              <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Conformité Globale</th>
              <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest">
                <div className="flex items-center gap-1.5"><Brain className="w-3 h-3" />RAG</div>
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {pagedInstances.map((instance, idx) => (
              <FleetCommandTableRow
                key={instance.id}
                instance={instance}
                idx={page * PAGE_SIZE + idx}
                reindexing={reindexing[instance.id] || false}
                commanding={commanding[instance.id] || false}
                commandMenuOpen={commandMenuId === instance.id}
                onReindex={handleReindex}
                onCommand={handleCommand}
                onToggleCommandMenu={handleToggleCommandMenu}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-6 bg-surface-card border-t border-border-subtle flex items-center justify-between gap-4 flex-wrap">
        <p className="text-[9px] font-bold text-secondary uppercase tracking-[0.2em]">
          {pagedInstances.length} site{pagedInstances.length !== 1 ? 's' : ''} affiché{pagedInstances.length !== 1 ? 's' : ''} / {filteredInstances.length} filtré{filteredInstances.length !== 1 ? 's' : ''} / {instances.length} total
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-border-subtle bg-surface-card hover:bg-surface-hover disabled:opacity-30 transition-colors"
            >
              ←
            </button>
            <span className="text-[9px] font-bold text-secondary uppercase px-2">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-border-subtle bg-surface-card hover:bg-surface-hover disabled:opacity-30 transition-colors"
            >
              →
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Activity className="w-3 h-3 text-brand" />
          <span className="text-[9px] font-black text-muted uppercase">Flotte en direct</span>
        </div>
      </div>
    </div>
  );
}
