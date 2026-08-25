"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Brain,
  RotateCcw,
  Terminal,
  RefreshCw,
} from 'lucide-react';
import { EmpireInstance } from '@nexus/contracts';
import { COMMANDER_ACTIONS, INSTANCE_BASE_DOMAIN } from './fleetCommandTypes';

interface FleetCommandTableRowProps {
  instance: EmpireInstance;
  idx: number;
  reindexing: boolean;
  commanding: boolean;
  commandMenuOpen: boolean;
  onReindex: (id: string) => void;
  onCommand: (id: string, action: string) => void;
  onToggleCommandMenu: (id: string) => void;
}

export const FleetCommandTableRow = React.memo(({
  instance,
  idx,
  reindexing,
  commanding,
  commandMenuOpen,
  onReindex,
  onCommand,
  onToggleCommandMenu,
}: FleetCommandTableRowProps) => {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.05 }}
      className="hover:bg-surface-card transition-colors group"
    >
      <td className="px-6 py-5">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-text-primary tracking-tight">{instance.name}</span>
          <span className="text-nano text-secondary font-mono">ID: {instance.id} • {instance.key}</span>
        </div>
      </td>
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              instance.status === 'ONLINE'
                ? 'bg-status-success shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : instance.status === 'CRITICAL'
                ? 'bg-error shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse'
                : 'bg-status-warning shadow-[0_0_12px_rgba(245,158,11,0.4)]'
            }`}
          />
          <div className="flex flex-col">
            <span className="text-nano font-black uppercase text-muted">{instance.status}</span>
            <div className="w-16 h-1 bg-surface-card rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  instance.metrics.healthScore < 70 ? 'bg-error' : 'bg-status-success'
                }`}
                style={{ width: `${instance.metrics.healthScore}%` }}
              />
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  instance.metrics.healthScore >= 90 ? 'bg-status-success' : 'bg-status-warning'
                }`}
              />
              <span className="text-nano font-black text-muted uppercase">
                Sensors {instance.metrics.healthScore}%
              </span>
            </div>
            {instance.metrics.healthScore < 95 && (
              <div className="flex items-center gap-1.5 text-error">
                <AlertCircle className="w-3 h-3" />
                <span className="text-nano font-black uppercase tracking-tighter">
                  Hygiene Drift Detected
                </span>
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-5 text-right">
        <div className="flex flex-col items-end">
          <span className="text-sm font-bold text-text-primary">{instance.metrics.activeUsers}</span>
          <span className="text-nano font-bold text-secondary uppercase tracking-tighter">Sessions</span>
        </div>
      </td>
      <td className="px-6 py-5">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-card border border-border-subtle rounded-lg w-fit">
            <ShieldCheck
              className={`w-3.5 h-3.5 ${
                instance.security.nf525Certified ? 'text-status-success' : 'text-secondary'
              }`}
            />
            <span className="text-nano font-black uppercase tracking-wider text-muted">NF525 SEALED</span>
          </div>
        </div>
      </td>

      {/* RAG status */}
      <td className="px-6 py-5">
        {instance.rag ? (
          <div className="flex flex-col gap-1">
            <div
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-nano font-black uppercase border w-fit ${
                instance.rag.status === 'online'
                  ? 'bg-status-success/10 text-status-success border-emerald-500/20'
                  : instance.rag.status === 'indexing'
                  ? 'bg-action-primary/10 text-action-primary border-action-primary/20 animate-pulse'
                  : instance.rag.status === 'offline'
                  ? 'bg-status-danger/10 text-status-danger border-red-500/20'
                  : 'bg-surface-card text-secondary border-border-subtle'
              }`}
            >
              <Brain className="w-2.5 h-2.5" />
              {instance.rag.status}
            </div>
            {instance.rag.documentCount !== undefined && (
              <span className="text-nano text-secondary font-mono">{instance.rag.documentCount} docs</span>
            )}
          </div>
        ) : (
          <span className="text-nano text-secondary font-mono">—</span>
        )}
      </td>

      <td className="px-6 py-5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onReindex(instance.id)}
            disabled={reindexing}
            title="Réindexer RAG"
            className="p-2.5 rounded-xl bg-surface-card border border-subtle text-muted hover:text-brand hover:border-brand transition-all opacity-0 group-hover:opacity-100 disabled:opacity-30"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${reindexing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() =>
              window.open(`https://${instance.key}.${INSTANCE_BASE_DOMAIN}`, '_blank', 'noopener,noreferrer')
            }
            title="Ouvrir l'instance"
            className="p-2.5 rounded-xl bg-surface-card border border-subtle text-muted hover:text-text-primary hover:border-default transition-all opacity-0 group-hover:opacity-100"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <div className="relative">
            <button
              onClick={() => onToggleCommandMenu(instance.id)}
              disabled={commanding}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-action-primary/10 text-brand border border-focus/20 text-chip-label-sm hover:bg-action-primary hover:text-text-primary transition-all shadow-lg shadow-indigo-500/10 opacity-0 group-hover:opacity-100 disabled:opacity-40"
            >
              {commanding ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" /> EN COURS
                </>
              ) : (
                <>
                  <Terminal className="w-3 h-3" /> COMMANDER
                </>
              )}
            </button>
            <AnimatePresence>
              {commandMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 bottom-full mb-2 w-44 bg-surface-card border border-border-subtle rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="px-3 py-2 border-b border-border-subtle">
                    <p className="text-nano font-black uppercase tracking-widest text-secondary">
                      Action sur {instance.name}
                    </p>
                  </div>
                  {COMMANDER_ACTIONS.map(({ key, label, icon: Icon, danger }) => (
                    <button
                      key={key}
                      onClick={() => onCommand(instance.id, key)}
                      className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-chip-label-sm hover:bg-surface-card transition-colors ${
                        danger ? 'text-error hover:bg-status-danger/10' : 'text-muted hover:text-text-primary'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </td>
    </motion.tr>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.instance === nextProps.instance &&
    prevProps.idx === nextProps.idx &&
    prevProps.reindexing === nextProps.reindexing &&
    prevProps.commanding === nextProps.commanding &&
    prevProps.commandMenuOpen === nextProps.commandMenuOpen
  );
});

FleetCommandTableRow.displayName = 'FleetCommandTableRow';
