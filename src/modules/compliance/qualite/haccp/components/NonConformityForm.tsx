'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AlertOctagon, Plus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { useTenant } from '@/shared/hooks';
import {
  type NonConformityType,
  type NonConformity,
  STAFF_LIST,
  buildNcPath,
  buildNcCollectionPath,
  fileToBase64,
} from './nonConformityTypes';
import { CreateNCSection } from './non-conformity/CreateNCSection';
import { NCListItem } from './non-conformity/NCListItem';

export type { NonConformityType, NonConformity };

interface NonConformityFormProps {
  onCountChange?: (openCount: number) => void;
}

export function NonConformityForm({ onCountChange }: NonConformityFormProps) {
  const { tenantId } = useTenant();

  const [records, setRecords] = useState<NonConformity[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<NonConformityType>('température hors norme');
  const [formDescription, setFormDescription] = useState('');
  const [formPhoto, setFormPhoto] = useState<string | undefined>(undefined);
  const [formPhotoName, setFormPhotoName] = useState('');
  const [formCorrective, setFormCorrective] = useState('');
  const [formResponsible, setFormResponsible] = useState(STAFF_LIST[0]);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const path = buildNcCollectionPath(tenantId ?? '');
      const raw = await Nexus.adapter.query<NonConformity>(path, {
        orderBy: { field: 'createdAt', direction: 'desc' },
      });
      setRecords(raw);
      onCountChange?.(raw.filter(r => r.status === 'open').length);
    } catch {
      // Silencieux
    } finally {
      setLoading(false);
    }
  }, [tenantId, onCountChange]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Photo trop volumineuse (max 2 Mo)');
      return;
    }
    try {
      const b64 = await fileToBase64(file);
      setFormPhoto(b64);
      setFormPhotoName(file.name);
    } catch {
      toast.error('Impossible de lire l\'image');
    }
  };

  const handleSubmit = async () => {
    if (!formDescription.trim()) {
      toast.error('Veuillez saisir une description');
      return;
    }
    if (!formCorrective.trim()) {
      toast.error('Veuillez décrire l\'action corrective');
      return;
    }
    setSubmitting(true);
    try {
      const id = crypto.randomUUID();
      const nc: NonConformity = {
        id,
        type: formType,
        description: formDescription.trim(),
        photoRef: formPhoto,
        correctiveAction: formCorrective.trim(),
        responsible: formResponsible,
        date: formDate,
        status: 'open',
        createdAt: Date.now(),
      };
      await Nexus.adapter.set(buildNcPath(tenantId ?? '', id), nc);
      setRecords(prev => [nc, ...prev]);
      onCountChange?.(records.filter(r => r.status === 'open').length + 1);
      toast.success('Non-conformité enregistrée');

      setShowForm(false);
      setFormDescription('');
      setFormCorrective('');
      setFormPhoto(undefined);
      setFormPhotoName('');
      setFormDate(new Date().toISOString().split('T')[0]);
      setFormType('température hors norme');
    } catch {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (nc: NonConformity) => {
    if (!resolutionNote.trim()) {
      toast.error('Veuillez saisir une note de résolution');
      return;
    }
    try {
      const update: Partial<NonConformity> = {
        status: 'resolved',
        resolutionNote: resolutionNote.trim(),
        resolvedAt: Date.now(),
      };
      await Nexus.adapter.update(buildNcPath(tenantId ?? '', nc.id), update);
      setRecords(prev =>
        prev.map(r => (r.id === nc.id ? { ...r, ...update } : r))
      );
      const newOpen = records.filter(r => r.status === 'open' && r.id !== nc.id).length;
      onCountChange?.(newOpen);
      setResolvingId(null);
      setResolutionNote('');
      toast.success('Non-conformité résolue');
    } catch {
      toast.error('Erreur lors de la résolution');
    }
  };

  const openCount = records.filter(r => r.status === 'open').length;

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-text-primary">Non-conformités</h2>
          {openCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-danger/15 text-status-danger text-xs font-bold">
              <AlertOctagon className="w-3 h-3" />
              {openCount} ouverte{openCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-action-primary text-text-primary text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Signaler
        </button>
      </div>

      {/* Formulaire de création */}
      {showForm && (
        <CreateNCSection
          formType={formType}
          formDate={formDate}
          formResponsible={formResponsible}
          formDescription={formDescription}
          formCorrective={formCorrective}
          formPhotoName={formPhotoName}
          formPhoto={formPhoto}
          submitting={submitting}
          onTypeChange={setFormType}
          onDateChange={setFormDate}
          onResponsibleChange={setFormResponsible}
          onDescriptionChange={setFormDescription}
          onCorrectiveChange={setFormCorrective}
          onPhotoChange={handlePhotoChange}
          onRemovePhoto={() => {
            setFormPhoto(undefined);
            setFormPhotoName('');
          }}
          onCancel={() => setShowForm(false)}
          onSubmit={handleSubmit}
        />
      )}

      {/* Liste des NC */}
      {loading ? (
        <div className="text-sm text-text-muted animate-pulse p-4">Chargement...</div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-text-muted bg-surface-card rounded-xl border border-border">
          <CheckCircle2 className="w-8 h-8 opacity-40" />
          <p className="text-sm">Aucune non-conformité enregistrée</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map(nc => (
            <NCListItem
              key={nc.id}
              nc={nc}
              isExpanded={expandedId === nc.id}
              resolvingId={resolvingId}
              resolutionNote={resolutionNote}
              onToggleExpand={() => setExpandedId(expandedId === nc.id ? null : nc.id)}
              onStartResolve={() => {
                setResolvingId(nc.id);
                setResolutionNote('');
              }}
              onCancelResolve={() => {
                setResolvingId(null);
                setResolutionNote('');
              }}
              onChangeResolutionNote={setResolutionNote}
              onConfirmResolve={handleResolve}
            />
          ))}
        </div>
      )}
    </div>
  );
}
