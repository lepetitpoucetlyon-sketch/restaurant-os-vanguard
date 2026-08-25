"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';

interface InstanceOption {
  id: string;
  name?: string;
}

interface TenantSelectorDropdownProps {
  instances: InstanceOption[];
  selectedId: string;
  dropdownOpen: boolean;
  onToggleDropdown: () => void;
  onSelectTenant: (id: string) => void;
}

export function TenantSelectorDropdown({
  instances,
  selectedId,
  dropdownOpen,
  onToggleDropdown,
  onSelectTenant,
}: TenantSelectorDropdownProps) {
  const selectedInstance = instances.find(i => i.id === selectedId);

  return (
    <div className="relative">
      <button
        onClick={onToggleDropdown}
        className="w-full flex items-center justify-between p-3 bg-bg-primary/50 border border-border-subtle rounded-xl text-sm font-medium text-muted hover:border-border-default transition-all"
      >
        <span className="truncate">
          {selectedInstance ? `${selectedInstance.name ?? selectedInstance.id}` : 'Sélectionner un tenant...'}
        </span>
        <ChevronDown className={cn('w-4 h-4 text-secondary transition-transform', dropdownOpen && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute z-20 top-full mt-1 w-full bg-surface-bg border border-border-subtle rounded-xl overflow-hidden shadow-xl"
          >
            {instances.map(inst => (
              <button
                key={inst.id}
                onClick={() => onSelectTenant(inst.id)}
                className={cn(
                  'w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-surface-card transition-colors',
                  inst.id === selectedId ? 'text-violet-400 bg-violet-500/10' : 'text-muted'
                )}
              >
                {inst.name ?? inst.id}
                <span className="ml-2 text-secondary text-nano">{inst.id}</span>
              </button>
            ))}
            {instances.length === 0 && (
              <p className="px-4 py-3 text-xs text-secondary">Aucun tenant dans la flotte</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
