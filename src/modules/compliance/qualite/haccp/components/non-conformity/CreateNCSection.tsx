'use client';

import React from 'react';
import { Paperclip, X } from 'lucide-react';
import {
  NonConformityType,
  NC_TYPES,
  STAFF_LIST,
  TYPE_LABELS,
} from '../nonConformityTypes';

interface CreateNCSectionProps {
  formType: NonConformityType;
  formDate: string;
  formResponsible: string;
  formDescription: string;
  formCorrective: string;
  formPhotoName: string;
  formPhoto?: string;
  submitting: boolean;
  onTypeChange: (type: NonConformityType) => void;
  onDateChange: (date: string) => void;
  onResponsibleChange: (resp: string) => void;
  onDescriptionChange: (desc: string) => void;
  onCorrectiveChange: (corr: string) => void;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: () => void;
  onCancel: () => void;
  onSubmit: () => void;
}

export function CreateNCSection({
  formType,
  formDate,
  formResponsible,
  formDescription,
  formCorrective,
  formPhotoName,
  formPhoto,
  submitting,
  onTypeChange,
  onDateChange,
  onResponsibleChange,
  onDescriptionChange,
  onCorrectiveChange,
  onPhotoChange,
  onRemovePhoto,
  onCancel,
  onSubmit,
}: CreateNCSectionProps) {
  return (
    <div className="bg-surface-sidebar rounded-xl border border-border p-5 space-y-4">
      <h3 className="font-semibold text-text-primary text-sm">Nouvelle non-conformité</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-text-muted mb-1">Type *</label>
          <select
            value={formType}
            onChange={e => onTypeChange(e.target.value as NonConformityType)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface-base text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-action-primary"
          >
            {NC_TYPES.map(t => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-text-muted mb-1">Date *</label>
          <input
            type="date"
            value={formDate}
            onChange={e => onDateChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface-base text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-action-primary"
          />
        </div>

        <div>
          <label className="block text-xs text-text-muted mb-1">Responsable *</label>
          <select
            value={formResponsible}
            onChange={e => onResponsibleChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface-base text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-action-primary"
          >
            {STAFF_LIST.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-text-muted mb-1">Photo (optionnel)</label>
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-surface-base text-text-muted text-sm cursor-pointer hover:text-text-primary transition-colors">
            <Paperclip className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{formPhotoName || 'Joindre une photo'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
          </label>
          {formPhoto && (
            <div className="relative mt-2 w-20 h-20">
              <img src={formPhoto} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-border" />
              <button
                onClick={onRemovePhoto}
                className="absolute -top-1 -right-1 w-5 h-5 bg-status-danger text-text-primary rounded-full flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs text-text-muted mb-1">Description *</label>
        <textarea
          value={formDescription}
          onChange={e => onDescriptionChange(e.target.value)}
          rows={3}
          placeholder="Décrivez la non-conformité observée..."
          className="w-full px-3 py-2 rounded-lg border border-border bg-surface-base text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-action-primary resize-none"
        />
      </div>

      <div>
        <label className="block text-xs text-text-muted mb-1">Action corrective *</label>
        <textarea
          value={formCorrective}
          onChange={e => onCorrectiveChange(e.target.value)}
          rows={2}
          placeholder="Mesure corrective immédiate appliquée ou prévue..."
          className="w-full px-3 py-2 rounded-lg border border-border bg-surface-base text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-action-primary resize-none"
        />
      </div>

      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-border text-text-muted text-sm hover:text-text-primary transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="px-4 py-2 rounded-lg bg-action-primary text-text-primary text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {submitting ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}
