'use client';

import React from 'react';
import { FileText, Video, Plus, ExternalLink } from 'lucide-react';
import type { EquipmentGuide } from '../../../assets/domain/schemas/equipment';

interface DetailGuidesTabProps {
  guides: EquipmentGuide[];
  loadingGuides: boolean;
  onOpenAddGuide: () => void;
}

export function DetailGuidesTab({ guides, loadingGuides, onOpenAddGuide }: DetailGuidesTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">
          Notices constructeurs, vidéos YouTube, tutoriels de nettoyage et pièces détachées.
        </span>
        <button
          onClick={onOpenAddGuide}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ajouter un tuto</span>
        </button>
      </div>

      {loadingGuides ? (
        <div className="p-8 text-center text-text-muted/80 text-xs">Chargement des fiches...</div>
      ) : guides.length > 0 ? (
        <div className="space-y-3">
          {guides.map((guide) => (
            <div
              key={guide.id}
              className="p-4 rounded-2xl bg-surface-glass border border-border-default hover:border-border-focus transition-all space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  {guide.type === 'VIDEO_TUTO' ? (
                    <Video className="w-4 h-4 text-red-400 shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                  )}
                  <h4 className="text-sm font-bold text-text-primary">{guide.title}</h4>
                </div>
                <span className="text-nano px-2 py-0.5 rounded-full bg-surface-glass-hover text-text-muted border border-border-default">
                  {guide.authorName}
                </span>
              </div>

              {guide.contentMarkdown && (
                <p className="text-xs text-text-secondary whitespace-pre-line bg-surface-card p-3 rounded-xl border border-border-default">
                  {guide.contentMarkdown}
                </p>
              )}

              {guide.url && (
                <div className="pt-1">
                  <a
                    href={guide.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ouvrir la notice / regarder la vidéo ({guide.url})</span>
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center bg-surface-glass rounded-2xl border border-border-default text-text-muted text-xs space-y-3">
          <p>Aucun guide ou tuto rattaché pour l instant.</p>
          <button
            onClick={onOpenAddGuide}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Créer la première fiche</span>
          </button>
        </div>
      )}
    </div>
  );
}
