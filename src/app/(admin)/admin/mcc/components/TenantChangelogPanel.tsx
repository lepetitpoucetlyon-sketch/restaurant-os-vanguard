"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  ChevronDown,
  RefreshCw,
  Plus,
  GitCommit,
  Search,
  Bot,
  User,
  Cpu,
  Layers,
  Wrench,
  Globe,
  Tag,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { authedFetch } from '@/lib/client/authedFetch';
import { useNexusFleet } from '@/shared/providers/fleet';
import type { ChangeCategory, ChangelogEntry, AuthorType } from '@/lib/mcc/ChangelogService';
import { NewChangelogEntryModal } from './NewChangelogEntryModal';

const CHANGELOG_PAGE_SIZE = 100;

const CATEGORY_META: Record<ChangeCategory, { label: string; icon: string; color: string; dotColor: string }> = {
  GENESIS:      { label: 'Genèse',          icon: '🌱', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', dotColor: 'bg-emerald-400 ring-emerald-500/30' },
  DEV_HOTFIX:   { label: 'Correctif Dev',   icon: '🐛', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',     dotColor: 'bg-amber-400 ring-amber-500/30' },
  CORE_UPDATE:  { label: 'MAJ Core/Flotte', icon: '🌐', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',         dotColor: 'bg-cyan-400 ring-cyan-500/30' },
  EVOLUTION:    { label: 'Évolution',       icon: '🚀', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',   dotColor: 'bg-indigo-400 ring-indigo-500/30' },
  UI_OVERRIDE:  { label: 'Thème & UI',      icon: '🎨', color: 'text-violet-400 bg-violet-500/10 border-violet-500/30',   dotColor: 'bg-violet-400 ring-violet-500/30' },
  FEATURE_FLAG: { label: 'Feature Flag',    icon: '🚩', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',         dotColor: 'bg-blue-400 ring-blue-500/30' },
  BILLING:      { label: 'Facturation',     icon: '💳', color: 'text-teal-400 bg-teal-500/10 border-teal-500/30',         dotColor: 'bg-teal-400 ring-teal-500/30' },
  UPGRADE:      { label: 'Mise à Niveau',   icon: '📦', color: 'text-action-primary bg-action-primary/10 border-action-primary/30', dotColor: 'bg-action-primary ring-action-primary/30' },
  DEBUG:        { label: 'Débogage',        icon: '🔍', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30',   dotColor: 'bg-orange-400 ring-orange-500/30' },
  CONFIG:       { label: 'Configuration',   icon: '⚙️', color: 'text-text-secondary bg-slate-500/10 border-slate-500/30', dotColor: 'bg-slate-400 ring-slate-500/30' },
  MAINTENANCE:  { label: 'Maintenance',     icon: '🛡️', color: 'text-status-danger bg-status-danger/10 border-red-500/30', dotColor: 'bg-red-400 ring-red-500/30' },
  ROLLOUT:      { label: 'Déploiement',     icon: '📡', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',           dotColor: 'bg-sky-400 ring-sky-500/30' },
  CUSTOM:       { label: 'Personnalisé',    icon: '✨', color: 'text-pink-400 bg-pink-500/10 border-pink-500/30',         dotColor: 'bg-pink-400 ring-pink-500/30' },
};

const ALL_CATEGORIES = Object.keys(CATEGORY_META) as ChangeCategory[];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)   return "à l'instant";
  if (m < 60)  return `il y a ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

function renderAuthorBadge(entry: ChangelogEntry) {
  const type = entry.authorType || 'system';
  const name = entry.authorName || entry.appliedBy.split('@')[0] || 'Système';

  switch (type) {
    case 'developer':
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-action-primary/10 text-action-primary border border-action-primary/20">
          <Wrench className="w-2.5 h-2.5" />
          {`Dev: ${name}`}
        </span>
      );
    case 'ai_agent':
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <Bot className="w-2.5 h-2.5" />
          {`Agent: ${name}`}
        </span>
      );
    case 'client':
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <User className="w-2.5 h-2.5" />
          {`Client: ${name}`}
        </span>
      );
    case 'system':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
          <Cpu className="w-2.5 h-2.5" />
          {`Système: ${name}`}
        </span>
      );
  }
}

export function TenantChangelogPanel() {
  const { instances } = useNexusFleet();

  const [selectedId, setSelectedId]         = useState<string>('__FLEET__');
  const [dropdownOpen, setDropdownOpen]     = useState(false);
  const [filterCat, setFilterCat]           = useState<ChangeCategory | 'ALL'>('ALL');
  const [filterAuthor, setFilterAuthor]     = useState<AuthorType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery]       = useState('');
  const [entries, setEntries]               = useState<ChangelogEntry[]>([]);
  const [isLoading, setIsLoading]           = useState(false);
  const [expanded, setExpanded]             = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen]       = useState(false);

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
    ? 'Flotte entière (Toutes instances)'
    : (instances.find(i => i.id === selectedId)?.name ?? selectedId);

  // Filtrage local texte et auteur
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      if (filterAuthor !== 'ALL' && (e.authorType || 'system') !== filterAuthor) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = (e.title || '').toLowerCase().includes(q);
        const inDesc = (e.description || '').toLowerCase().includes(q);
        const inAction = (e.action || '').toLowerCase().includes(q);
        const inKey = (e.key || '').toLowerCase().includes(q);
        const inAuthor = (e.authorName || e.appliedBy || '').toLowerCase().includes(q);
        const inHash = (e.commitHash || '').toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inAction && !inKey && !inAuthor && !inHash) {
          return false;
        }
      }
      return true;
    });
  }, [entries, filterAuthor, searchQuery]);

  return (
    <div className="p-6 bg-surface-card border border-border-subtle rounded-3xl space-y-6 shadow-xl">
      {/* Header avec action de création */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-action-primary/10 flex items-center justify-center border border-action-primary/20 text-action-primary shadow-inner">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-primary flex items-center gap-2">
              {'Registre & Changelog Évolutif'}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-action-primary/10 text-action-primary border border-action-primary/20">
                {`${filteredEntries.length} commits`}
              </span>
            </h3>
            <p className="text-xs text-text-secondary">
              {'Historique inaltérable des corrections dev, évolutions, genèse et mises à jour système'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-action-primary hover:bg-action-primary/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-action-primary/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{'Nouvelle Entrée / Log Dev'}</span>
          </button>

          <button
            aria-label="Rafraîchir l'historique"
            onClick={load}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-bg-primary/50 border border-border-subtle text-text-secondary hover:text-text-primary transition-all"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Barres de filtres & recherche */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Tenant selector */}
        <div className="relative">
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1 block">
            {'Instance / Périmètre'}
          </label>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-bg-primary/60 border border-border-subtle rounded-xl text-xs font-medium text-text-primary hover:border-border-default transition-all"
          >
            <span className="truncate flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-action-primary shrink-0" />
              {displayName}
            </span>
            <ChevronDown className={cn('w-3.5 h-3.5 text-text-secondary shrink-0 ml-1 transition-transform', dropdownOpen && 'rotate-180')} />
          </button>
          {dropdownOpen && (
            <div className="absolute z-20 top-full mt-1 w-full bg-surface-card border border-border-subtle rounded-xl overflow-hidden shadow-2xl max-h-60 overflow-y-auto">
              <button
                onClick={() => { setSelectedId('__FLEET__'); setDropdownOpen(false); }}
                className={cn('w-full text-left px-3.5 py-2 text-xs hover:bg-surface-glass-hover transition-colors flex items-center gap-2', selectedId === '__FLEET__' ? 'text-action-primary font-bold bg-action-primary/5' : 'text-text-secondary')}
              >
                <Globe className="w-3.5 h-3.5" />
                {'Flotte entière (Toutes les instances)'}
              </button>
              {instances.map(inst => (
                <button
                  key={inst.id}
                  onClick={() => { setSelectedId(inst.id); setDropdownOpen(false); }}
                  className={cn('w-full text-left px-3.5 py-2 text-xs hover:bg-surface-glass-hover transition-colors truncate', inst.id === selectedId ? 'text-action-primary font-bold bg-action-primary/5' : 'text-text-secondary')}
                >
                  {`🏢 ${inst.name ?? inst.id}`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search bar */}
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1 block">
            {'Recherche'}
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Titre, description, tag, clé..."
              className="w-full pl-9 pr-3.5 py-2.5 bg-bg-primary/60 border border-border-subtle rounded-xl text-xs font-medium text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-action-primary transition-all"
            />
          </div>
        </div>

        {/* Filter par auteur */}
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1 block">
            {'Auteur / Origine'}
          </label>
          <select
            value={filterAuthor}
            onChange={e => setFilterAuthor(e.target.value as AuthorType | 'ALL')}
            className="w-full px-3.5 py-2.5 bg-bg-primary/60 border border-border-subtle rounded-xl text-xs font-medium text-text-primary focus:outline-none focus:border-action-primary transition-all cursor-pointer"
          >
            <option value="ALL">{'Tous les auteurs'}</option>
            <option value="developer">{'👨‍💻 Développeurs / Équipe Core'}</option>
            <option value="ai_agent">{'🤖 Agents IA'}</option>
            <option value="client">{'👤 Clients / Restaurateurs'}</option>
            <option value="system">{'⚙️ Système / Mises à jour auto'}</option>
          </select>
        </div>
      </div>

      {/* Category badging */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        <button
          onClick={() => setFilterCat('ALL')}
          className={cn(
            'px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all',
            filterCat === 'ALL'
              ? 'bg-action-primary/20 text-action-primary border-action-primary ring-1 ring-action-primary/30'
              : 'bg-bg-primary/40 text-text-secondary border-border-subtle hover:border-border-default'
          )}
        >
          {`Toutes (${entries.length})`}
        </button>
        {ALL_CATEGORIES
          .filter(c => entries.some(e => e.category === c))
          .map(c => {
            const count = entries.filter(e => e.category === c).length;
            const meta = CATEGORY_META[c];
            return (
              <button
                key={c}
                onClick={() => setFilterCat(c)}
                className={cn(
                  'px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1',
                  meta.color,
                  filterCat === c && 'ring-2 ring-white/30 font-black'
                )}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
                <span className="opacity-70">{`(${count})`}</span>
              </button>
            );
          })}
      </div>

      {/* Timeline Git-like */}
      <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
        {isLoading && (
          <div className="py-12 text-center text-text-secondary text-xs flex flex-col items-center gap-2 animate-pulse">
            <GitCommit className="w-6 h-6 animate-spin text-action-primary" />
            <span>{'Chargement du registre en cours...'}</span>
          </div>
        )}

        {!isLoading && filteredEntries.length === 0 && (
          <div className="py-12 text-center text-text-secondary text-xs bg-bg-primary/30 rounded-2xl border border-dashed border-border-subtle p-6">
            <GitCommit className="w-8 h-8 text-text-tertiary mx-auto mb-2 opacity-50" />
            <p className="font-semibold text-text-primary">{'Aucune modification enregistrée'}</p>
            <p className="text-[11px] text-text-secondary mt-1">
              {'Les modifications, interventions développeurs et évolutions de ce tenant apparaîtront ici.'}
            </p>
          </div>
        )}

        {!isLoading && filteredEntries.map((entry, idx) => {
          const meta = CATEGORY_META[entry.category] ?? CATEGORY_META.CUSTOM;
          const isOpen = expanded === entry.id;
          const shortHash = entry.commitHash || entry.id.slice(-7);

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.015, 0.3), duration: 0.2 }}
              className="relative pl-7 group"
            >
              {/* Ligne verticale Git */}
              {idx < filteredEntries.length - 1 && (
                <div className="absolute left-2.5 top-6 bottom-0 w-0.5 bg-border-subtle group-hover:bg-action-primary/30 transition-colors" />
              )}
              
              {/* Nœud Git */}
              <div className={cn('absolute left-1 top-4 w-3.5 h-3.5 rounded-full ring-4 shadow-sm transition-transform group-hover:scale-110', meta.dotColor)} />

              {/* Commit Card */}
              <div
                role="button"
                tabIndex={0}
                aria-label={`Détails de l'entrée ${entry.title || entry.description}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setExpanded(isOpen ? null : entry.id);
                  }
                }}
                onClick={() => setExpanded(isOpen ? null : entry.id)}
                className={cn(
                  'p-4 rounded-2xl border transition-all cursor-pointer text-left',
                  isOpen
                    ? 'bg-surface-glass-hover border-action-primary/40 shadow-lg'
                    : 'bg-bg-primary/40 border-border-subtle hover:border-border-default hover:bg-bg-primary/60'
                )}
              >
                {/* Ligne haute : Hash + Badges + Auteur + Date */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Hash Git */}
                    <span className="px-2 py-0.5 bg-bg-primary/80 border border-border-subtle rounded-md font-mono text-[10px] text-text-secondary font-bold">
                      {`#${shortHash}`}
                    </span>

                    {/* Catégorie */}
                    <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1', meta.color)}>
                      <span>{meta.icon}</span>
                      <span>{meta.label}</span>
                    </span>

                    {/* Auteur */}
                    {renderAuthorBadge(entry)}

                    {/* Badge tenant si vue flotte */}
                    {entry.tenantId !== '__FLEET__' && (
                      <span className="text-[10px] text-text-secondary font-mono px-1.5 py-0.5 bg-bg-primary/60 rounded border border-border-subtle">
                        {entry.tenantId}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-text-secondary" title={new Date(entry.appliedAt).toLocaleString('fr-FR')}>
                      {timeAgo(entry.appliedAt)}
                    </span>
                    <ChevronRight className={cn('w-3.5 h-3.5 text-text-secondary transition-transform', isOpen && 'rotate-90')} />
                  </div>
                </div>

                {/* Titre du commit */}
                <h4 className="text-xs font-bold text-text-primary mt-2 flex items-center gap-1.5">
                  {entry.title || entry.description.slice(0, 90)}
                </h4>

                {/* Description du commit */}
                <p className="text-[11px] text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                  {entry.description}
                </p>

                {/* Tags si présents */}
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex items-center gap-1 mt-2.5 flex-wrap">
                    <Tag className="w-2.5 h-2.5 text-text-tertiary" />
                    {entry.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="px-1.5 py-0.2 rounded text-[9px] bg-bg-primary/50 text-text-tertiary border border-border-subtle">
                        {`#${tag}`}
                      </span>
                    ))}
                  </div>
                )}

                {/* Vue détaillée repliable (Diff / Métadonnées) */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-border-subtle space-y-2.5 text-xs"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-text-tertiary">{'Action système : '}</span>
                          <span className="font-mono text-text-secondary">{entry.action}</span>
                        </div>
                        <div>
                          <span className="text-text-tertiary">{'Date exacte : '}</span>
                          <span className="text-text-secondary">{new Date(entry.appliedAt).toLocaleString('fr-FR')}</span>
                        </div>
                        {entry.key && (
                          <div className="col-span-full">
                            <span className="text-text-tertiary">{'Clé / Fichier ciblé : '}</span>
                            <span className="font-mono text-action-primary bg-action-primary/5 px-1.5 py-0.5 rounded border border-action-primary/20">
                              {entry.key}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-text-tertiary">{'Portée (Scope) : '}</span>
                          <span className="text-text-secondary uppercase font-bold text-[10px]">{entry.scope}</span>
                        </div>
                        <div>
                          <span className="text-text-tertiary">{'Identifiant unique : '}</span>
                          <span className="font-mono text-text-tertiary text-[10px]">{entry.id}</span>
                        </div>
                      </div>

                      {/* Diff Before / After */}
                      {(entry.before !== undefined || entry.after !== undefined) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-border-subtle">
                          {entry.before !== undefined && (
                            <div className="p-2.5 bg-status-danger/5 border border-status-danger/20 rounded-xl">
                              <p className="text-[10px] font-black uppercase text-status-danger mb-1 flex items-center gap-1">
                                <span>-</span> {'État Précédent (Avant)'}
                              </p>
                              <pre className="text-[10px] font-mono text-text-secondary overflow-auto max-h-32 whitespace-pre-wrap break-all p-1 bg-black/20 rounded">
                                {JSON.stringify(entry.before, null, 2)}
                              </pre>
                            </div>
                          )}
                          {entry.after !== undefined && (
                            <div className="p-2.5 bg-status-success/5 border border-status-success/20 rounded-xl">
                              <p className="text-[10px] font-black uppercase text-status-success mb-1 flex items-center gap-1">
                                <span>+</span> {'Nouvel État Appliqué (Après)'}
                              </p>
                              <pre className="text-[10px] font-mono text-text-secondary overflow-auto max-h-32 whitespace-pre-wrap break-all p-1 bg-black/20 rounded">
                                {JSON.stringify(entry.after, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal de création manuelle */}
      <NewChangelogEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={load}
        defaultTenantId={selectedId}
        instances={instances}
      />
    </div>
  );
}
