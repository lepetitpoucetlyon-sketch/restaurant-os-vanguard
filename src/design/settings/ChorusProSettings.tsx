'use client';

import { useState } from 'react';
import { ExternalLink, Building2, Save, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings } from '@/shared/contexts/SettingsContext';

const SIRET_REGEX = /^\d{14}$/;

export default function ChorusProSettings() {
  const { settings, updateConfig, isSaving: contextIsSaving } = useSettings();

  // Local draft — initialise from global settings
  const [siret, setSiret] = useState<string>(settings?.legal?.siret ?? settings?.siret ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const siretIsValid = SIRET_REGEX.test(siret.replace(/\s/g, ''));

  const handleSave = async () => {
    const normalized = siret.replace(/\s/g, '');

    if (normalized.length > 0 && !SIRET_REGEX.test(normalized)) {
      toast.error('Le SIRET doit comporter exactement 14 chiffres');
      return;
    }

    setIsSaving(true);
    try {
      const currentLegal = settings?.legal ?? {};
      await updateConfig('legal', { ...currentLegal, siret: normalized });
      toast.success('SIRET sauvegardé');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const saving = isSaving || contextIsSaving;

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-bg-secondary border border-border flex items-center justify-center text-accent">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            Facturation secteur public (B2G)
          </h3>
          <p className="text-xs text-text-muted uppercase tracking-wider font-bold">
            Chorus Pro — DGFiP
          </p>
        </div>
      </div>

      {/* Informations Chorus Pro */}
      <div className="rounded-2xl border border-border bg-bg-secondary p-5 space-y-4">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-text-primary">
              La facturation électronique vers les entités publiques est obligatoire via Chorus Pro
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">
              Chorus Pro est le portail officiel de la Direction Générale des Finances Publiques
              (DGFiP) pour le dépôt et la réception des factures électroniques entre les fournisseurs
              du secteur privé et les entités du secteur public (État, collectivités, hôpitaux, etc.).
              Cette obligation découle de l'ordonnance n° 2014-697 du 26 juin 2014.
            </p>
            <p className="text-sm text-text-secondary">
              Configurez votre SIRET ci-dessous pour émettre des factures conformes avec les
              informations légales exactes requises par Chorus Pro.
            </p>
          </div>
        </div>

        <a
          href="https://chorus-pro.gouv.fr"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-bg-primary text-sm font-semibold text-text-primary hover:bg-bg-secondary transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Accéder au portail Chorus Pro (DGFiP)
        </a>
      </div>

      {/* Champ SIRET */}
      <div className="rounded-2xl border border-border bg-bg-secondary p-5 space-y-4">
        <h4 className="text-sm font-semibold text-text-primary">Identification légale</h4>

        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            Numéro SIRET
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="123 456 789 00012"
            value={siret}
            onChange={e => setSiret(e.target.value)}
            maxLength={17}
            className={`w-full rounded-xl border bg-bg-primary px-3 py-2.5 text-text-primary text-sm font-mono focus:outline-none focus:ring-2 transition ${
              siret.length > 0
                ? siretIsValid
                  ? 'border-emerald-500/50 focus:ring-emerald-500/30 focus:border-emerald-500'
                  : 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500'
                : 'border-border focus:ring-accent/50 focus:border-accent'
            }`}
          />
          <p className="text-xs text-text-muted mt-1.5">
            14 chiffres — identifiant unique de votre établissement (SIREN + NIC). Obligatoire sur
            vos factures vers les entités publiques.
          </p>
          {siret.length > 0 && !siretIsValid && (
            <p className="text-xs text-status-danger mt-1 font-medium">
              Format invalide — le SIRET doit contenir exactement 14 chiffres.
            </p>
          )}
        </div>

        {/* Rappel liens utiles */}
        <div className="rounded-xl bg-bg-primary border border-border p-3 space-y-1">
          <p className="text-xs font-semibold text-text-secondary">Liens utiles</p>
          <ul className="space-y-1">
            <li>
              <a
                href="https://www.sirene.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Vérifier votre SIRET sur sirene.fr (INSEE)
              </a>
            </li>
            <li>
              <a
                href="https://chorus-pro.gouv.fr/qualif/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Portail Chorus Pro Qualif (environnement de test)
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-text-primary text-bg-primary font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Sauvegarder
        </button>
      </div>
    </div>
  );
}
