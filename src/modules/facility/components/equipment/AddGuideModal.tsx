'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  BookOpen,
  Plus,
} from 'lucide-react';
import type {
  EquipmentAsset,
  GuideType,
} from '../../assets/domain/schemas/equipment';

interface AddGuideModalProps {
  asset: EquipmentAsset;
  onClose: () => void;
  onGuideAdded: () => void;
}

export function AddGuideModal({ asset, onClose, onGuideAdded }: AddGuideModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<GuideType>('VIDEO_TUTO');
  const [url, setUrl] = useState('');
  const [authorType, setAuthorType] = useState<'VENDOR' | 'RESTAURATEUR' | 'COMMUNITY'>('RESTAURATEUR');
  const [authorName, setAuthorName] = useState('Équipe Restaurant');
  const [contentMarkdown, setContentMarkdown] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Veuillez renseigner un titre');
      return;
    }

    try {
      setIsSubmitting(true);
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const res = await fetch(`/api/facility/equipment/${asset.id}/guides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          type,
          url: url.trim() || undefined,
          authorType,
          authorName: authorName.trim() || 'Équipe Restaurant',
          contentMarkdown: contentMarkdown.trim() || undefined,
          tags,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de l enregistrement du guide');
      }

      onGuideAdded();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Attacher un Guide / Notice / Vidéo"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-xl bg-surface-card border border-border-default rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-border-default">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">
                Base de Connaissances & Tutos
              </span>
              <h2 className="text-xl font-bold text-text-primary tracking-tight">
                Attacher un Guide / Notice / Vidéo
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="p-2 text-text-muted hover:text-text-primary rounded-xl hover:bg-surface-glass-hover transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="overflow-y-auto py-5 space-y-4 flex-1 pr-1 custom-scrollbar">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
              Titre de la fiche ou du tuto *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Tuto Dégivrage & Nettoyage Condenseur, Tuto YouTube Réparation..."
              className="w-full px-4 py-2.5 bg-surface-glass border border-border-default rounded-xl text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-emerald-500/50 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
                Type de contenu
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as GuideType)}
                className="w-full px-3 py-2.5 bg-surface-glass border border-border-default rounded-xl text-text-primary focus:outline-none focus:border-emerald-500/50 text-sm"
              >
                <option value="VIDEO_TUTO">🎬 Vidéo Tuto (YouTube / Web)</option>
                <option value="MANUAL_PDF">📄 Manuel / Notice Constructeur (PDF)</option>
                <option value="CLEANING_PROCEDURE">🧼 Procédure Nettoyage / HACCP</option>
                <option value="TROUBLESHOOTING_GUIDE">🔧 Fiche de Dépannage Rapide</option>
                <option value="SPARE_PARTS_LINK">🔗 Pièces Détachées & Vue Éclatée</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
                Source de l information
              </label>
              <select
                value={authorType}
                onChange={(e) => setAuthorType(e.target.value as 'VENDOR' | 'RESTAURATEUR' | 'COMMUNITY')}
                className="w-full px-3 py-2.5 bg-surface-glass border border-border-default rounded-xl text-text-primary focus:outline-none focus:border-emerald-500/50 text-sm"
              >
                <option value="RESTAURATEUR">👨‍🍳 Équipe Restaurant (Interne)</option>
                <option value="VENDOR">🏭 Constructeur / Fabricant</option>
                <option value="COMMUNITY">🌐 Tuto Web / YouTube / Communauté</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
              Lien Web / Vidéo YouTube / PDF (Optionnel)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=... ou https://drive.google.com/..."
              className="w-full px-4 py-2.5 bg-surface-glass border border-border-default rounded-xl text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-emerald-500/50 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
              Procédure étape par étape / Notes (Texte Markdown)
            </label>
            <textarea
              rows={4}
              value={contentMarkdown}
              onChange={(e) => setContentMarkdown(e.target.value)}
              placeholder="Décrivez les étapes clés à suivre pour l'équipe (1. Couper le disjoncteur, 2. Dévisser la buse, 3. Nettoyer...)"
              className="w-full px-4 py-2.5 bg-surface-glass border border-border-default rounded-xl text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-emerald-500/50 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
              Tags / Mots-clés (séparés par des virgules)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="nettoyage, hebdomadaire, filtre, sav, youtube"
              className="w-full px-4 py-2.5 bg-surface-glass border border-border-default rounded-xl text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-emerald-500/50 text-sm"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-border-default flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-surface-glass-hover hover:bg-surface-glass text-text-secondary text-xs font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Enregistrement...' : 'Enregistrer le Tuto / Guide'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
