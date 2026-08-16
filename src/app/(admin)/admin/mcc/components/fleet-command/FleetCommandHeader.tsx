"use client";

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ChevronDown, Check } from 'lucide-react';
import { StatusFilter, STATUS_FILTERS } from './fleetCommandTypes';

interface FleetCommandHeaderProps {
  searchQuery: string;
  statusFilter: StatusFilter;
  filterOpen: boolean;
  onSearchChange: (query: string) => void;
  onToggleFilter: () => void;
  onSelectFilter: (filter: StatusFilter) => void;
  onCloseFilter: () => void;
}

export function FleetCommandHeader({
  searchQuery,
  statusFilter,
  filterOpen,
  onSearchChange,
  onToggleFilter,
  onSelectFilter,
  onCloseFilter,
}: FleetCommandHeaderProps) {
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        onCloseFilter();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onCloseFilter]);

  return (
    <div className="p-8 border-b border-border-subtle flex items-center justify-between bg-gradient-to-r from-action-primary/5 to-transparent">
      <div>
        <h2 className="text-xl font-serif font-black text-text-primary tracking-tighter">Centre de Commandement</h2>
        <p className="text-[10px] text-secondary uppercase font-bold tracking-widest mt-1">Orchestration en temps réel des actifs de l'empire</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="px-4 py-2 bg-surface-card rounded-xl border border-border-subtle flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="RECHERCHER UN SITE..."
            className="bg-transparent border-none outline-none text-[10px] font-bold text-text-primary placeholder:text-secondary w-32"
          />
        </div>
        <div className="relative" ref={filterRef}>
          <button
            onClick={onToggleFilter}
            className={`flex items-center gap-2 px-3 py-2.5 border rounded-xl transition-all text-[9px] font-black uppercase tracking-widest ${
              statusFilter !== 'ALL'
                ? 'bg-action-primary text-text-primary border-focus/40'
                : 'bg-action-primary/10 text-brand border-focus/20 hover:bg-action-primary/20'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {statusFilter !== 'ALL' ? statusFilter : ''}
            <ChevronDown className={`w-3 h-3 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {filterOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-full mt-2 w-44 bg-surface-card border border-border-subtle rounded-xl shadow-2xl z-50 overflow-hidden"
              >
                {STATUS_FILTERS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => onSelectFilter(f.value)}
                    className="flex items-center justify-between w-full px-4 py-2.5 text-[9px] font-black uppercase tracking-widest hover:bg-surface-card transition-colors text-left"
                  >
                    <span className={statusFilter === f.value ? 'text-brand' : 'text-muted'}>{f.label}</span>
                    {statusFilter === f.value && <Check className="w-3 h-3 text-brand" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
