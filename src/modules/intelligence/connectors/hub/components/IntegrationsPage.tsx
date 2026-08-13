import { logger } from '@/lib/logger';
"use client";

import { useState, useMemo } from 'react';
import { Plug, RefreshCw, Loader2, AlertTriangle, Search } from 'lucide-react';
import { useIntegrations } from '../hooks/useIntegrations';
import { ConnectorCard } from './ConnectorCard';
import { ConnectorConfigModal } from './ConnectorConfigModal';
import { ConnectorHub } from '../ConnectorHub';
import type { ConnectorEntry } from '../hooks/useIntegrations';
import type { IConnectorManifest } from '@/lib/connectors/manifest';

const CATEGORY_LABELS: Record<string, string> = {
  reservations:      '🗓️  Réservations',
  delivery:          '🛵  Livraison',
  reviews:           '⭐  Avis clients',
  emailing:          '📧  Emailing',
  accounting:        '🪙  Comptabilité',
  invoices:          '📥  Factures',
  payments:          '💳  Paiements',
  banking:           '🏦  Banque',
  payroll:           '💼  Paie',
  timeclock:         '📲  Pointage',
  suppliers:         '🛒  Fournisseurs',
  marketplace:       '🏪  Marketplace',
  ecommerce:         '🛍️  E-commerce',
  iot:               '🌡️  IoT / Capteurs',
  weather:           '⛅  Météo',
  events:            '🎟️  Événements',
  'ai-llm':          '🤖  IA générative',
  'ai-legal':        '⚖️  IA juridique & fiscale',
  'ai-search':       '🔍  Recherche IA',
  communication:     '📬  Communication',
  'vertical-specific': '🏗️  Spécifique vertical',
};

export function IntegrationsPage() {
  const { connectors, loading, error, refresh, activate, deactivate, saveCredentials, testConnection, syncNow, actionLoading } = useIntegrations();
  const [configTarget, setConfigTarget] = useState<IConnectorManifest | null>(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'pending' | 'error'>('all');

  // Filtrage
  const filtered = useMemo(() => {
    return connectors.filter(({ manifest, state }) => {
      const matchSearch = !search ||
        manifest.displayName.toLowerCase().includes(search.toLowerCase()) ||
        manifest.category.includes(search.toLowerCase());
      const matchFilter =
        activeFilter === 'all'    ? true :
        activeFilter === 'active' ? state?.status === 'active' :
        activeFilter === 'pending'? state?.status === 'pending_config' :
        activeFilter === 'error'  ? state?.status === 'error' : true;
      return matchSearch && matchFilter;
    });
  }, [connectors, search, activeFilter]);

  // Groupement par catégorie
  const byCategory = useMemo(() => ConnectorHub.byCategory(filtered.map(c => c.manifest)), [filtered]);

  // Stats
  const stats = useMemo(() => ({
    total:   connectors.length,
    active:  connectors.filter(c => c.state?.status === 'active').length,
    pending: connectors.filter(c => c.state?.status === 'pending_config').length,
    error:   connectors.filter(c => c.state?.status === 'error').length,
  }), [connectors]);

  const getEntry = (id: string): ConnectorEntry | undefined =>
    connectors.find(c => c.manifest.id === id);

  const handleSync = async (id: string) => {
    const res = await syncNow(id);
    if (!res.ok && res.error) logger.error(`[sync] ${id}:`, res.error);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-status-danger mx-auto" />
          <p className="text-sm text-text-muted">{error}</p>
          <button onClick={refresh} className="text-xs text-brand-primary hover:underline">Réessayer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base text-text-primary p-6">

      {/* Header */}
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold flex items-center gap-2">
            <Plug className="w-6 h-6" />
            Intégrations
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Connecteurs tiers — réservations, livraison, comptabilité, IA et plus.
          </p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-text-muted hover:text-text-primary text-sm transition-colors flex-shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total',       val: stats.total,   cls: 'text-white' },
          { label: 'Actifs',      val: stats.active,  cls: 'text-status-success' },
          { label: 'À configurer', val: stats.pending, cls: 'text-yellow-500' },
          { label: 'En erreur',   val: stats.error,   cls: 'text-status-danger' },
        ].map(s => (
          <div key={s.label} className="bg-surface-sidebar border border-border rounded-xl p-3">
            <p className="text-xs text-text-muted">{s.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${s.cls}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Barre de recherche + filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="search"
            placeholder="Rechercher un connecteur…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-surface-sidebar text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary transition"
          />
        </div>
        <nav className="flex gap-1 p-1 bg-surface-sidebar border border-border rounded-xl self-start">
          {(['all', 'active', 'pending', 'error'] as const).map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeFilter === f
                  ? 'bg-surface-base text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {{ all: 'Tous', active: 'Actifs', pending: 'À configurer', error: 'Erreurs' }[f]}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu par catégorie */}
      {Object.keys(byCategory).length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <Plug className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun connecteur trouvé</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(byCategory).map(([category, manifests]) => (
            <section key={category}>
              <h2 className="text-sm font-semibold text-text-muted mb-3">
                {CATEGORY_LABELS[category] ?? category}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {manifests.map(manifest => {
                  const entry = getEntry(manifest.id) ?? { manifest, state: null };
                  return (
                    <ConnectorCard
                      key={manifest.id}
                      entry={entry}
                      isLoading={!!actionLoading[manifest.id]}
                      onConfigure={() => setConfigTarget(manifest)}
                      onActivate={() => activate(manifest.id)}
                      onDeactivate={() => deactivate(manifest.id)}
                      onSync={() => handleSync(manifest.id)}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Modal de configuration */}
      {configTarget && (
        <ConnectorConfigModal
          manifest={configTarget}
          onSave={fields => saveCredentials(configTarget.id, fields)}
          onTest={() => testConnection(configTarget.id)}
          onClose={() => setConfigTarget(null)}
          isSaving={!!actionLoading[configTarget.id]}
        />
      )}
    </div>
  );
}
