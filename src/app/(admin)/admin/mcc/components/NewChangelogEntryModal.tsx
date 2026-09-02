"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, GitCommit, User, Tag, FileCode, Layers } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { authedFetch } from '@/lib/client/authedFetch';
import type { ChangeCategory, AuthorType } from '@/lib/mcc/ChangelogService';

interface NewChangelogEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  defaultTenantId?: string;
  instances: Array<{ id: string; name?: string }>;
}

const CATEGORY_OPTIONS: Array<{ value: ChangeCategory; label: string; icon: string; desc: string }> = [
  { value: 'DEV_HOTFIX', label: 'Correctif Développeur', icon: '🐛', desc: "Correction de bug ou patch appliqué directement par l'équipe dev" },
  { value: 'EVOLUTION', label: 'Évolution / Feature', icon: '🚀', desc: 'Nouvelle fonctionnalité ou amélioration métier' },
  { value: 'CORE_UPDATE', label: 'Mise à jour Plateforme', icon: '🌐', desc: 'Mise à jour globale du cœur Restaurant OS sans demande client' },
  { value: 'UI_OVERRIDE', label: 'Personnalisation Thème / UI', icon: '🎨', desc: 'Ajustement de charte graphique, couleurs ou mise en page' },
  { value: 'CONFIG', label: 'Modification Configuration', icon: '⚙️', desc: 'Changement de paramétrage technique ou module' },
  { value: 'MAINTENANCE', label: 'Maintenance & Sécurité', icon: '🛡️', desc: "Opération d'infrastructure, purge ou audit" },
];

export function NewChangelogEntryModal({
  isOpen,
  onClose,
  onCreated,
  defaultTenantId = '__FLEET__',
  instances,
}: NewChangelogEntryModalProps) {
  const [tenantId, setTenantId] = useState<string>(defaultTenantId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ChangeCategory>('DEV_HOTFIX');
  const [authorName, setAuthorName] = useState('');
  const [authorType, setAuthorType] = useState<AuthorType>('developer');
  const [key, setKey] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Veuillez renseigner un titre et une description.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const tags = tagsStr
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean);

      const res = await authedFetch('/api/admin/fleet/changelog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          title: title.trim(),
          description: description.trim(),
          category,
          authorName: authorName.trim() || undefined,
          authorType,
          key: key.trim() || undefined,
          tags: tags.length > 0 ? tags : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error || "Erreur lors de l'enregistrement");
      }

      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title-changelog"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-surface-card border border-border-subtle rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-bg-primary/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-action-primary/10 border border-action-primary/20 flex items-center justify-center text-action-primary">
                <GitCommit className="w-5 h-5" />
              </div>
              <div>
                <h2 id="modal-title-changelog" className="text-base font-bold text-text-primary">{'Nouvelle Entrée au Registre'}</h2>
                <p className="text-xs text-text-secondary">{'Journaliser une modification, un correctif dev ou une mise à jour'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Fermer la boîte de dialogue"
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-glass-hover transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
            {error && (
              <div className="p-3 bg-status-danger/10 border border-status-danger/30 rounded-xl text-xs text-status-danger flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Tenant Cible */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-action-primary" />
                {'Périmètre Cible'}
              </label>
              <select
                value={tenantId}
                onChange={e => setTenantId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-bg-primary/60 border border-border-subtle rounded-xl text-xs font-medium text-text-primary focus:outline-none focus:border-action-primary transition-all cursor-pointer"
              >
                <option value="__FLEET__">{'🌐 Flotte entière (Toutes les instances / Core)'}</option>
                {instances.map(inst => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name ? `🏢 ${inst.name} (${inst.id})` : `🏢 ${inst.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Catégorie d'intervention */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">{"Type d'intervention"}</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CATEGORY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    aria-label={`Sélectionner la catégorie ${opt.label}`}
                    onClick={() => setCategory(opt.value)}
                    className={cn(
                      'text-left p-2.5 rounded-xl border text-xs transition-all flex items-start gap-2.5',
                      category === opt.value
                        ? 'bg-action-primary/10 border-action-primary text-text-primary ring-1 ring-action-primary/30'
                        : 'bg-bg-primary/30 border-border-subtle text-text-secondary hover:border-border-default'
                    )}
                  >
                    <span className="text-base">{opt.icon}</span>
                    <div>
                      <p className="font-semibold text-text-primary">{opt.label}</p>
                      <p className="text-[10px] text-text-secondary line-clamp-1">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Titre */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">{"Titre de l'intervention *"}</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Correctif du calcul de TVA 10% sur les formules du midi"
                className="w-full px-3.5 py-2.5 bg-bg-primary/60 border border-border-subtle rounded-xl text-xs font-medium text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-action-primary transition-all"
                required
              />
            </div>

            {/* Description détaillée */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">{'Description détaillée / Rapport de patch *'}</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="Décrivez les modifications apportées, le contexte, et pourquoi ce changement a été effectué..."
                className="w-full px-3.5 py-2.5 bg-bg-primary/60 border border-border-subtle rounded-xl text-xs font-medium text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-action-primary transition-all resize-none"
                required
              />
            </div>

            {/* Auteur & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-action-primary" />
                  {"Nom de l'auteur / Développeur"}
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                  placeholder="Ex: Marc (Dev Core)"
                  className="w-full px-3.5 py-2.5 bg-bg-primary/60 border border-border-subtle rounded-xl text-xs font-medium text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-action-primary transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">{"Rôle de l'auteur"}</label>
                <select
                  value={authorType}
                  onChange={e => setAuthorType(e.target.value as AuthorType)}
                  className="w-full px-3.5 py-2.5 bg-bg-primary/60 border border-border-subtle rounded-xl text-xs font-medium text-text-primary focus:outline-none focus:border-action-primary transition-all cursor-pointer"
                >
                  <option value="developer">{'👨‍💻 Développeur / Équipe Core'}</option>
                  <option value="system">{'⚙️ Système / Script Automatisé'}</option>
                  <option value="ai_agent">{'🤖 Agent IA / Maintenance Auto'}</option>
                  <option value="client">{'👤 Client / Opérateur Restaurant'}</option>
                </select>
              </div>
            </div>

            {/* Clé / Module & Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-action-primary" />
                  {'Clé ou Module impacté (optionnel)'}
                </label>
                <input
                  type="text"
                  value={key}
                  onChange={e => setKey(e.target.value)}
                  placeholder="Ex: finance.vat_engine ou pos.orders"
                  className="w-full px-3.5 py-2.5 bg-bg-primary/60 border border-border-subtle rounded-xl text-xs font-mono font-medium text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-action-primary transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-action-primary" />
                  {'Tags (séparés par des virgules)'}
                </label>
                <input
                  type="text"
                  value={tagsStr}
                  onChange={e => setTagsStr(e.target.value)}
                  placeholder="Ex: tva, hotfix, fiscal, v4"
                  className="w-full px-3.5 py-2.5 bg-bg-primary/60 border border-border-subtle rounded-xl text-xs font-medium text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-action-primary transition-all"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-border-subtle text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-glass-hover transition-colors"
              >
                {'Annuler'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-action-primary hover:bg-action-primary/90 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-action-primary/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{'Enregistrement...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{'Enregistrer dans le Registre'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
