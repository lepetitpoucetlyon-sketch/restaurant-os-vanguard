'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Building2, Phone, Mail, Loader2, X, Check, AlertCircle } from 'lucide-react';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

/**
 * Modèle réel de la collection `suppliers`, tel qu'alimenté par
 * `onboarding/migration/importers/suppliersImporter.ts`. L'écran affichait
 * auparavant trois fournisseurs codés en dur (avec IBAN et contacts inventés)
 * sur un modèle qui n'existait nulle part ailleurs : rien de ce qui était
 * importé ou créé n'apparaissait ici.
 */
export interface SupplierRecord {
  id: string;
  name: string;
  category?: string;
  email?: string;
  phone?: string;
  /** Délai de livraison en jours. */
  deliveryDays?: number;
  paymentTerms?: string;
  status?: string;
  createdAt?: number;
  updatedAt?: number;
}

interface DirectoryTabProps {
  searchFilter: string;
  setSearchFilter: (v: string) => void;
}

const EMPTY_DRAFT = { name: '', category: '', email: '', phone: '', deliveryDays: '2', paymentTerms: '30 jours fin de mois' };

export function DirectoryTab({ searchFilter, setSearchFilter }: DirectoryTabProps) {
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rows = await Nexus.adapter.query<SupplierRecord>('suppliers');
      setSuppliers(rows ?? []);
    } catch (err) {
      logger.warn('[DirectoryTab] Chargement des fournisseurs impossible', { error: err });
      setError('Impossible de charger les fournisseurs. Vérifiez la connexion, puis réessayez.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Le champ de recherche était branché sur un état mais ne filtrait rien.
  const visible = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q),
    );
  }, [suppliers, searchFilter]);

  const handleCreate = async () => {
    const name = draft.name.trim();
    if (!name) {
      setError('Le nom du fournisseur est obligatoire.');
      return;
    }
    // Le doublon de nom est ce que l'importateur déduplique aussi : on garde
    // la même règle pour que les deux voies d'entrée restent cohérentes.
    if (suppliers.some(s => s.name?.toLowerCase().trim() === name.toLowerCase())) {
      setError(`« ${name} » figure déjà dans l'annuaire.`);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const id = Nexus.adapter.generateId('suppliers');
      const days = Number.parseInt(draft.deliveryDays, 10);
      const payload: SupplierRecord & { type: string } = {
        id,
        type: 'supplier',
        name,
        category: draft.category.trim() || 'général',
        email: draft.email.trim().toLowerCase() || undefined,
        phone: draft.phone.replace(/[\s.\-()]/g, '') || undefined,
        deliveryDays: Number.isNaN(days) ? 2 : Math.max(1, Math.min(30, days)),
        paymentTerms: draft.paymentTerms.trim() || '30 jours fin de mois',
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await Nexus.adapter.set(`suppliers/${id}`, payload);
      setSuppliers(prev => [...prev, payload]);
      setDraft(EMPTY_DRAFT);
      setIsCreating(false);
    } catch (err) {
      setError(`Création impossible : ${toError(err).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const field = (key: keyof typeof EMPTY_DRAFT, label: string, type = 'text') => (
    <label className="flex flex-col gap-1.5">
      <span className="text-nano font-bold uppercase tracking-wider text-text-muted">{label}</span>
      <input
        type={type}
        value={draft[key]}
        onChange={(e) => setDraft(d => ({ ...d, [key]: e.target.value }))}
        className="bg-surface-glass border border-border-default rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-border-focus"
      />
    </label>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrer fournisseurs..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-surface-glass border border-border-default rounded-xl pl-9 pr-4 py-2 text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-border-focus"
          />
        </div>
        <button
          type="button"
          onClick={() => { setIsCreating(v => !v); setError(null); }}
          className="px-4 py-2 min-h-[44px] rounded-xl bg-action-primary text-text-on-primary font-bold text-xs tracking-wider uppercase hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          {isCreating ? <X className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
          {isCreating ? 'Annuler' : 'Nouveau Fournisseur'}
        </button>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 px-4 py-3 rounded-xl bg-status-danger/10 border border-status-danger/20 text-status-danger text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {isCreating && (
        <div className="p-5 rounded-2xl bg-surface-card border border-border-default space-y-4">
          <h3 className="font-bold text-text-primary text-sm">Nouveau fournisseur</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {field('name', 'Raison sociale')}
            {field('category', 'Catégorie')}
            {field('email', 'Email', 'email')}
            {field('phone', 'Téléphone', 'tel')}
            {field('deliveryDays', 'Délai (jours)', 'number')}
            {field('paymentTerms', 'Conditions de règlement')}
          </div>
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={isSaving || !draft.name.trim()}
            className="px-4 py-2 min-h-[44px] rounded-xl bg-action-primary text-text-on-primary font-bold text-xs uppercase tracking-wider disabled:opacity-40 flex items-center gap-2 transition-opacity"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Enregistrer
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-text-muted text-xs">
          <Loader2 className="w-4 h-4 animate-spin" />
          Chargement de l&apos;annuaire…
        </div>
      ) : visible.length === 0 ? (
        <div className="py-16 text-center space-y-2">
          <Building2 className="w-10 h-10 mx-auto text-text-muted/40" />
          <p className="text-sm text-text-muted">
            {suppliers.length === 0
              ? "Aucun fournisseur enregistré. Créez-en un, ou importez votre annuaire depuis l'assistant de reprise."
              : `Aucun fournisseur ne correspond à « ${searchFilter} ».`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((s) => (
            <div
              key={s.id}
              className="p-5 rounded-2xl bg-surface-card border border-border-default hover:border-border-focus transition-all flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-text-primary text-base truncate">{s.name}</h3>
                    <p className="text-micro text-text-muted">{s.category ?? 'général'}</p>
                  </div>
                  {s.status && (
                    <span className="text-nano font-bold px-2 py-0.5 rounded bg-surface-glass text-text-secondary border border-border-default shrink-0 uppercase">
                      {s.status}
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-2 text-xs text-text-secondary">
                  {typeof s.deliveryDays === 'number' && (
                    <div className="flex items-center justify-between py-1 border-b border-border-default/40">
                      <span className="text-text-muted">Délai de livraison :</span>
                      <span className="font-bold text-text-primary">
                        {s.deliveryDays} jour{s.deliveryDays > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  {s.paymentTerms && (
                    <div className="flex items-center justify-between py-1 border-b border-border-default/40 gap-2">
                      <span className="text-text-muted shrink-0">Règlement :</span>
                      <span className="text-text-primary text-right">{s.paymentTerms}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-border-default flex flex-col gap-1.5 text-micro">
                {s.phone && (
                  <a href={`tel:${s.phone}`} className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors">
                    <Phone className="w-3.5 h-3.5 text-status-success shrink-0" />
                    <span className="truncate">{s.phone}</span>
                  </a>
                )}
                {s.email && (
                  <a href={`mailto:${s.email}`} className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors">
                    <Mail className="w-3.5 h-3.5 text-status-success shrink-0" />
                    <span className="truncate">{s.email}</span>
                  </a>
                )}
                {!s.phone && !s.email && (
                  <span className="text-text-muted/60">Aucun contact renseigné</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
