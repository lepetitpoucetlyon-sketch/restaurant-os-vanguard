'use client';

import React, { useState, useEffect } from 'react';
import { Globe, CheckCircle2, AlertCircle, Loader2, Sparkles, ExternalLink } from 'lucide-react';

interface SubdomainSelectorStepProps {
  initialSlug?: string;
  onSelect: (subdomain: string) => void;
  onSkip?: () => void;
}

export function SubdomainSelectorStep({ initialSlug = '', onSelect, onSkip }: SubdomainSelectorStepProps) {
  const [slug, setSlug] = useState(initialSlug);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const rootDomain = process.env.NEXT_PUBLIC_DOMAIN_ROOT || 'webapp.fr';

  useEffect(() => {
    if (!slug || slug.trim().length < 3) {
      setIsAvailable(null);
      setErrorMessage(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsChecking(true);
      setErrorMessage(null);
      try {
        const res = await fetch(`/api/tenant/domain/check?slug=${encodeURIComponent(slug.toLowerCase().trim())}`);
        if (res.ok) {
          const data = await res.json();
          setIsAvailable(data.available);
          if (!data.available) {
            setErrorMessage(data.reason || 'Ce sous-domaine n\'est pas disponible.');
          }
        } else {
          setIsAvailable(false);
          setErrorMessage('Erreur de validation.');
        }
      } catch {
        setIsAvailable(true);
      } finally {
        setIsChecking(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [slug]);

  const handleApply = () => {
    if (isAvailable && slug.trim().length >= 3) {
      onSelect(slug.toLowerCase().trim());
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Globe className="w-5 h-5 text-indigo-600" />
          Choisissez votre adresse web (.webapp.fr)
        </h2>
        <p className="text-sm text-gray-500">
          Votre portail de commande, menu interactif et espace de gestion seront hébergés sur cette URL exclusive.
        </p>
      </div>

      {/* Input de sous-domaine */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">
          Nom du sous-domaine
        </label>
        <div className="flex items-center rounded-xl border border-gray-300 bg-white px-3 py-2.5 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100 transition shadow-sm">
          <span className="text-gray-400 text-sm font-mono select-none">https://</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="mon-restaurant"
            className="flex-1 bg-transparent px-1 font-mono text-sm text-gray-900 outline-none"
          />
          <span className="text-indigo-600 font-semibold text-sm font-mono select-none">.{rootDomain}</span>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 min-h-[20px] text-xs">
          {isChecking && (
            <span className="text-gray-500 flex items-center gap-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" /> Vérification de la disponibilité...
            </span>
          )}
          {!isChecking && isAvailable === true && (
            <span className="text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {slug}.{rootDomain} est disponible !
            </span>
          )}
          {!isChecking && isAvailable === false && (
            <span className="text-rose-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {errorMessage}
            </span>
          )}
        </div>
      </div>

      {/* Mockup Preview Card */}
      <div className="rounded-2xl border border-gray-200 bg-slate-900 p-4 text-white shadow-md space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-slate-800/80 px-3 py-1 text-micro font-mono text-text-secondary">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            https://{slug || 'mon-restaurant'}.{rootDomain}
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-text-muted/80" />
        </div>

        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/50 space-y-2">
          <div className="text-xs font-semibold text-indigo-400">⚡ Inclus dans votre abonnement :</div>
          <ul className="text-micro text-text-muted space-y-1">
            <li>• Certificat SSL HTTPS Let&apos;s Encrypt dédié et renouvelé à vie.</li>
            <li>• Redirection transparente vers votre caisse et menu QR code.</li>
            <li>• Gestion de l&apos;infrastructure assurée par Restaurant OS Master MCC.</li>
          </ul>
        </div>
      </div>

      {/* Action footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        {onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Choisir plus tard →
          </button>
        ) : <div />}

        <button
          type="button"
          onClick={handleApply}
          disabled={!isAvailable || isChecking || slug.trim().length < 3}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          Valider mon adresse web →
        </button>
      </div>
    </div>
  );
}
