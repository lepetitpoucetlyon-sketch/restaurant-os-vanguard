'use client';

import { useState, useEffect } from 'react';
import { BarChart2, Globe, XCircle, Copy, Check, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useTenant } from '@/kernel/hooks';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { updateTenantSettingsAction } from '@/lib/actions/settings.action';

type AnalyticsProvider = 'ga4' | 'plausible' | 'none';

interface AnalyticsConfig {
  provider: AnalyticsProvider;
  ga4MeasurementId?: string;
  plausibleDomain?: string;
  updatedAt?: number;
}

function CodeBlock({ code, onCopy }: { code: string; onCopy: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    onCopy();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-xl border border-border bg-bg-primary overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-bg-secondary">
        <span className="text-xs font-mono text-text-muted">snippet</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-status-success" />
              <span className="text-status-success">Copié</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copier
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-xs text-text-secondary font-mono overflow-x-auto whitespace-pre-wrap break-all">
        {code}
      </pre>
    </div>
  );
}

function GA4Snippet({ measurementId }: { measurementId: string }) {
  const snippet = `<!-- Google Analytics 4 — ajoutez dans votre layout.tsx <head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${measurementId}');
</script>`;

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-secondary">
        Copiez ce snippet et ajoutez-le dans <code className="text-xs bg-bg-secondary px-1.5 py-0.5 rounded font-mono">src/app/layout.tsx</code> dans la balise <code className="text-xs bg-bg-secondary px-1.5 py-0.5 rounded font-mono">&lt;head&gt;</code>.
      </p>
      <CodeBlock code={snippet} onCopy={() => toast.success('Snippet GA4 copié')} />
    </div>
  );
}

function PlausibleSnippet({ domain }: { domain: string }) {
  const snippet = `<!-- Plausible Analytics — ajoutez dans votre layout.tsx <head> -->
<script defer data-domain="${domain}" src="https://plausible.io/js/script.js"></script>`;

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-secondary">
        Copiez ce snippet et ajoutez-le dans <code className="text-xs bg-bg-secondary px-1.5 py-0.5 rounded font-mono">src/app/layout.tsx</code> dans la balise <code className="text-xs bg-bg-secondary px-1.5 py-0.5 rounded font-mono">&lt;head&gt;</code>.
      </p>
      <CodeBlock code={snippet} onCopy={() => toast.success('Snippet Plausible copié')} />
    </div>
  );
}

export default function AnalyticsSettings() {
  const { tenantId } = useTenant();
  const slug = tenantId ?? '';

  const [config, setConfig] = useState<AnalyticsConfig>({ provider: 'plausible' });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const load = async () => {
      try {
        const data = await Nexus.adapter.get<AnalyticsConfig>(
          `tenants/${slug}/settings/analytics`,
          { vassalId: slug, actorId: 'client' }
        );
        if (data) setConfig(data);
      } catch {
        // Pas encore de config
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [slug]);

  const handleSave = async () => {
    if (!slug) return;
    setIsSaving(true);
    try {
      const res = await updateTenantSettingsAction(slug, 'analytics', config);
      if (res.success) {
        toast.success('Configuration analytics sauvegardée');
      } else {
        toast.error(res.error || 'Erreur lors de la sauvegarde');
      }
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const providers: Array<{ id: AnalyticsProvider; label: string; icon: React.ReactNode; description: string }> = [
    {
      id: 'none',
      label: 'Aucun',
      icon: <XCircle className="w-4 h-4" />,
      description: 'Pas d\'analytics tiers',
    },
    {
      id: 'ga4',
      label: 'Google Analytics 4',
      icon: <BarChart2 className="w-4 h-4" />,
      description: 'Google Analytics 4 (GA4)',
    },
    {
      id: 'plausible',
      label: 'Plausible',
      icon: <Globe className="w-4 h-4" />,
      description: 'Analytics respectueux de la vie privée',
    },
  ];

  const inputClass =
    'w-full rounded-xl border border-border bg-bg-primary px-3 py-2.5 text-text-primary text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition';

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-bg-secondary rounded-xl w-48" />
        <div className="h-32 bg-bg-secondary rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-bg-secondary border border-border flex items-center justify-center text-accent">
          <BarChart2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Analytics</h3>
          <p className="text-xs text-text-muted uppercase tracking-wider font-bold">
            Suivi et mesure d'audience
          </p>
        </div>
      </div>

      {/* Choix du provider */}
      <div className="rounded-2xl border border-border bg-bg-secondary p-5 space-y-4">
        <h4 className="text-sm font-semibold text-text-primary">Fournisseur analytics</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {providers.map(p => (
            <button
              key={p.id}
              onClick={() => setConfig(prev => ({ ...prev, provider: p.id }))}
              className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                config.provider === p.id
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-bg-primary text-text-secondary hover:bg-bg-secondary'
              }`}
            >
              {p.icon}
              <div>
                <p className="text-sm font-semibold">{p.label}</p>
                <p className="text-xs opacity-70 mt-0.5">{p.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Configuration GA4 */}
      {config.provider === 'ga4' && (
        <div className="rounded-2xl border border-border bg-bg-secondary p-5 space-y-4">
          <h4 className="text-sm font-semibold text-text-primary">Configuration Google Analytics 4</h4>
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Measurement ID
            </label>
            <input
              type="text"
              placeholder="G-XXXXXXXXXX"
              value={config.ga4MeasurementId ?? ''}
              onChange={e => setConfig(prev => ({ ...prev, ga4MeasurementId: e.target.value }))}
              className={inputClass}
            />
            <p className="text-xs text-text-muted mt-1">
              Format : G-XXXXXXXXXX (trouvez-le dans Admin → Flux de données)
            </p>
          </div>
          {config.ga4MeasurementId && (
            <GA4Snippet measurementId={config.ga4MeasurementId} />
          )}
        </div>
      )}

      {/* Configuration Plausible */}
      {config.provider === 'plausible' && (
        <div className="rounded-2xl border border-border bg-bg-secondary p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h4 className="text-sm font-semibold text-text-primary">Configuration Plausible</h4>
            <a
              href="https://plausible.io/sites"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-xs font-semibold text-accent underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              Gérer mes sites →
            </a>
          </div>

          {/* Steps */}
          <ol className="space-y-2">
            {[
              { n: 1, text: 'Créez un compte sur', link: { href: 'https://plausible.io', label: 'plausible.io' } },
              { n: 2, text: 'Ajoutez votre domaine dans le tableau de bord Plausible', link: null },
              { n: 3, text: 'Copiez le "domain slug" (ex : monrestaurant.fr) et collez-le ci-dessous, puis ajoutez NEXT_PUBLIC_PLAUSIBLE_DOMAIN dans votre .env', link: null },
            ].map(step => (
              <li key={step.n} className="flex items-start gap-3 text-sm text-text-secondary">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/10 text-accent text-[10px] font-black flex items-center justify-center mt-0.5">
                  {step.n}
                </span>
                <span>
                  {step.text}
                  {step.link && (
                    <>
                      {' '}
                      <a
                        href={step.link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-accent underline underline-offset-2 hover:opacity-80 transition-opacity"
                      >
                        {step.link.label}
                      </a>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ol>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Domaine
            </label>
            <input
              type="text"
              placeholder="monrestaurant.fr"
              value={config.plausibleDomain ?? ''}
              onChange={e => setConfig(prev => ({ ...prev, plausibleDomain: e.target.value }))}
              className={inputClass}
            />
            <p className="text-xs text-text-muted mt-1">
              Domaine exact tel qu'enregistré sur plausible.io
            </p>
          </div>
          {config.plausibleDomain && (
            <PlausibleSnippet domain={config.plausibleDomain} />
          )}
        </div>
      )}

      {/* Note d'activation */}
      {config.provider !== 'none' && (
        <div className="rounded-xl border border-action-primary/30 bg-action-primary/5 p-4">
          <p className="text-xs text-amber-600 dark:text-action-primary font-medium">
            Pour activer, ajoutez le snippet ci-dessus dans{' '}
            <code className="bg-action-primary/10 px-1 rounded font-mono">src/app/layout.tsx</code>{' '}
            à l'intérieur de la balise <code className="bg-action-primary/10 px-1 rounded font-mono">&lt;head&gt;</code>.
          </p>
        </div>
      )}

      {/* Bouton sauvegarder */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-text-primary text-bg-primary font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Sauvegarder
        </button>
      </div>
    </div>
  );
}
