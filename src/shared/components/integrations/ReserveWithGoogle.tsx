'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  MapPin,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTenant } from '@/shared/hooks';
import { Nexus } from '@/lib/nexus/NexusAdapter';

interface ReserveWithGoogleConfig {
  configured: boolean;
  configuredAt?: number;
}

export default function ReserveWithGoogle() {
  const { tenantId } = useTenant();
  const slug = tenantId ?? '';

  const [config, setConfig] = useState<ReserveWithGoogleConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [widgetCopied, setWidgetCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const load = async () => {
      try {
        const data = await Nexus.adapter.get<ReserveWithGoogleConfig>(
          `tenants/${slug}/settings/reserveWithGoogle`,
          { vassalId: slug, actorId: 'client' }
        );
        setConfig(data);
      } catch {
        // Pas encore configuré
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [slug]);

  const widgetUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/${slug}/reservations`
      : `https://restaurant-os.app/${slug}/reservations`;

  const handleCopyWidgetUrl = async () => {
    await navigator.clipboard.writeText(widgetUrl);
    setWidgetCopied(true);
    toast.success('Lien widget copié dans le presse-papiers');
    setTimeout(() => setWidgetCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-bg-secondary rounded-xl w-64" />
        <div className="h-28 bg-bg-secondary rounded-2xl" />
      </div>
    );
  }

  const isConfigured = config?.configured === true;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-bg-secondary border border-border flex items-center justify-center text-accent">
          <MapPin className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Reserve with Google</h3>
          <p className="text-xs text-text-muted uppercase tracking-wider font-bold">
            Réservation directe depuis Google Search
          </p>
        </div>
      </div>

      {/* Statut */}
      <div className="rounded-2xl border border-border bg-bg-secondary p-5">
        <div className="flex items-center gap-2 mb-1">
          {isConfigured ? (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold text-text-primary">Configuré</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-text-primary">Non configuré</span>
            </>
          )}
        </div>
        <p className="text-xs text-text-muted">
          {isConfigured
            ? 'Le bouton de réservation est visible sur votre fiche Google.'
            : 'Suivez les étapes ci-dessous pour activer la réservation directe sur Google Search et Maps.'}
        </p>
      </div>

      {/* Instructions */}
      <div className="rounded-2xl border border-border bg-bg-secondary p-5 space-y-5">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-accent shrink-0" />
          <h4 className="text-sm font-semibold text-text-primary">
            Comment activer Reserve with Google
          </h4>
        </div>

        <ol className="space-y-4">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/15 text-accent text-xs font-bold flex items-center justify-center">
              1
            </span>
            <div>
              <p className="text-sm font-medium text-text-primary">
                Connectez votre compte Google Business Profile
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                Utilisez l'onglet "Google My Business" ci-dessus pour lier votre compte via OAuth.
              </p>
            </div>
          </li>

          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/15 text-accent text-xs font-bold flex items-center justify-center">
              2
            </span>
            <div>
              <p className="text-sm font-medium text-text-primary">
                Activez Reserve with Google via le Actions Center
              </p>
              <p className="text-xs text-text-muted mt-0.5 mb-2">
                Depuis le portail partenaire Google, configurez votre intégration de réservation.
              </p>
              <a
                href="https://reservewithgoogle.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-accent font-semibold hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Ouvrir le Actions Center Google
              </a>
            </div>
          </li>

          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/15 text-accent text-xs font-bold flex items-center justify-center">
              3
            </span>
            <div>
              <p className="text-sm font-medium text-text-primary">
                Copiez l'URL de votre widget de réservation
              </p>
              <p className="text-xs text-text-muted mt-0.5 mb-3">
                Entrez cette URL dans le champ "Booking URL" lors de la configuration sur le Actions
                Center.
              </p>

              {/* Widget URL box */}
              <div className="rounded-xl border border-border bg-bg-primary overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-bg-secondary">
                  <span className="text-xs font-mono text-text-muted">widget URL</span>
                  <button
                    onClick={handleCopyWidgetUrl}
                    className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
                  >
                    {widgetCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Copié</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copier
                      </>
                    )}
                  </button>
                </div>
                <p className="px-3 py-2.5 text-xs font-mono text-text-secondary break-all">
                  {widgetUrl}
                </p>
              </div>
            </div>
          </li>
        </ol>
      </div>

      {/* Note */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
        <p className="text-xs text-blue-600 dark:text-blue-400">
          Reserve with Google nécessite une approbation de Google (délai habituel : 1 à 4 semaines
          après soumission via le Actions Center). Votre restaurant doit être vérifié sur Google
          Business Profile.
        </p>
      </div>
    </div>
  );
}
