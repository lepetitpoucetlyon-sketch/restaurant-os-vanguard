'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, ExternalLink, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useTenant } from '@/shared/hooks';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { authedFetch } from '@/lib/client/authedFetch';

interface GoogleIntegrationData {
  accessToken?: string;
  refreshToken?: string | null;
  expiresAt?: number;
  connectedAt?: number;
  hoursSyncedAt?: number;
}

export default function GoogleIntegrations() {
  const { tenantId } = useTenant();
  const slug = tenantId ?? '';

  const [integration, setIntegration] = useState<GoogleIntegrationData | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const load = async () => {
      try {
        const data = await Nexus.adapter.get<GoogleIntegrationData>(
          `tenants/${slug}/tenantIntegrations/google`,
          { vassalId: slug, actorId: 'client' }
        );
        setIntegration(data);
      } catch {
        // Pas encore d'intégration configurée
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [slug]);

  const isConnected = Boolean(integration?.accessToken);

  const handleConnectGBP = () => {
    // Redirige vers le flux OAuth Google
    window.location.href = '/api/auth/google';
  };

  const handleSyncHours = async () => {
    if (!isConnected) {
      toast.error('Connectez d\'abord Google My Business');
      return;
    }

    setIsSyncing(true);
    try {
      const res = await authedFetch('/api/google/sync-hours', { method: 'GET' });
      const data = await res.json() as { success?: boolean; message?: string; syncedAt?: number; error?: string };

      if (!res.ok || data.error) {
        toast.error(data.error ?? 'Erreur lors de la synchronisation');
        return;
      }

      // Mettre à jour le timestamp local
      setIntegration(prev => ({
        ...prev,
        hoursSyncedAt: data.syncedAt,
      }));

      toast.success(data.message ?? 'Horaires synchronisés avec Google');
    } catch {
      toast.error('Erreur réseau lors de la synchronisation');
    } finally {
      setIsSyncing(false);
    }
  };

  const formatDate = (ts?: number) => {
    if (!ts) return 'Jamais';
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(ts));
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-bg-secondary rounded-xl w-48" />
        <div className="h-24 bg-bg-secondary rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-bg-secondary border border-border flex items-center justify-center text-accent">
          <ExternalLink className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Google My Business</h3>
          <p className="text-xs text-text-muted uppercase tracking-wider font-bold">
            Google Business Profile
          </p>
        </div>
      </div>

      {/* Statut de connexion */}
      <div className="rounded-2xl border border-border bg-bg-secondary p-5 space-y-4">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <CheckCircle className="w-4 h-4 text-status-success" />
              <span className="text-sm text-text-primary font-medium">Connecté</span>
              <span className="text-xs text-text-muted ml-auto">
                Depuis le {formatDate(integration?.connectedAt)}
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-action-primary" />
              <span className="text-sm text-text-primary font-medium">Non connecté</span>
            </>
          )}
        </div>

        {/* Bouton connexion GBP */}
        {!isConnected && (
          <button
            onClick={handleConnectGBP}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-bg-primary text-text-primary text-sm font-semibold hover:bg-bg-secondary transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Connecter Google My Business
          </button>
        )}
      </div>

      {/* Synchronisation des horaires */}
      <div className="rounded-2xl border border-border bg-bg-secondary p-5 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-1">
            Synchronisation des horaires
          </h4>
          <p className="text-xs text-text-muted">
            Envoie vos horaires d'ouverture configurés dans Restaurant OS vers votre fiche Google.
          </p>
          <p className="text-xs text-action-primary mt-1">
            Note : L'appel vers l'API Google Business Profile nécessite une approbation
            Google Actions Center (en cours de validation).
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Clock className="w-3.5 h-3.5" />
          <span>Derniere synchronisation : {formatDate(integration?.hoursSyncedAt)}</span>
        </div>

        <button
          onClick={handleSyncHours}
          disabled={isSyncing}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent text-text-primary text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Synchronisation...' : 'Synchroniser les horaires vers Google'}
        </button>
      </div>
    </div>
  );
}
