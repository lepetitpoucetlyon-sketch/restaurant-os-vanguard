"use client";

import { useState } from 'react';
import { X, Eye, EyeOff, Loader2 } from 'lucide-react';
import type { IConnectorManifest } from '@/lib/connectors/manifest';

interface Props {
  manifest: IConnectorManifest;
  onSave: (fields: Record<string, string>) => Promise<{ ok: boolean; error?: string }>;
  onTest: () => Promise<{ ok: boolean; error?: string }>;
  onClose: () => void;
  isSaving: boolean;
}

export function ConnectorConfigModal({ manifest, onSave, onTest, onClose, isSaving }: Props) {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [phase, setPhase] = useState<'form' | 'testing'>('form');

  const set = (key: string, val: string) => setFields(p => ({ ...p, [key]: val }));
  const toggleVisible = (key: string) => setVisible(p => ({ ...p, [key]: !p[key] }));

  const handleSave = async () => {
    setFeedback(null);
    const res = await onSave(fields);
    if (!res.ok) {
      setFeedback({ type: 'error', msg: res.error ?? 'Erreur lors de la sauvegarde' });
      return;
    }
    setFeedback({ type: 'success', msg: 'Credentials sauvegardés — test en cours…' });
    setPhase('testing');
    const testRes = await onTest();
    setFeedback(testRes.ok
      ? { type: 'success', msg: 'Connexion établie — connecteur actif ✓' }
      : { type: 'error',   msg: testRes.error ?? 'Test de connexion échoué' });
    if (testRes.ok) setTimeout(onClose, 1200);
    else setPhase('form');
  };

  const hasRequired = !manifest.fields || manifest.fields
    .filter(f => !f.optional)
    .every(f => !!fields[f.key]?.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface-base border border-border rounded-2xl w-full max-w-md shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{manifest.logo}</span>
            <div>
              <p className="font-semibold text-text-primary">{manifest.displayName}</p>
              <p className="text-xs text-text-muted capitalize">{manifest.category.replace('-', ' ')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-sidebar text-text-muted hover:text-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {manifest.authType === 'oauth2' && (
            <div className="rounded-xl border border-border bg-surface-sidebar p-4 text-sm text-text-muted">
              Ce connecteur utilise OAuth2. Cliquez sur <strong className="text-text-primary">Connecter</strong> pour être redirigé vers la page d'autorisation.
            </div>
          )}

          {manifest.fields?.map(field => (
            <div key={field.key} className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary flex items-center gap-1">
                {field.label}
                {!field.optional && <span className="text-status-danger">*</span>}
              </label>
              <div className="relative">
                <input
                  type={field.type === 'password' && !visible[field.key] ? 'password' : 'text'}
                  placeholder={field.placeholder ?? ''}
                  value={fields[field.key] ?? ''}
                  onChange={e => set(field.key, e.target.value)}
                  className="w-full px-3 py-2 pr-10 rounded-xl border border-border bg-surface-sidebar text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition"
                />
                {field.type === 'password' && (
                  <button
                    type="button"
                    onClick={() => toggleVisible(field.key)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                  >
                    {visible[field.key] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          ))}

          {feedback && (
            <div className={`rounded-xl p-3 text-sm font-medium ${feedback.type === 'success' ? 'bg-status-success/10 text-status-success' : 'bg-status-danger/10 text-status-danger'}`}>
              {feedback.msg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-5 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-text-muted hover:text-text-primary hover:bg-surface-sidebar border border-border transition-colors">
            Annuler
          </button>
          {manifest.authType === 'oauth2' ? (
            <a
              href={manifest.oauthConfig?.callbackRoute?.replace('/callback', '/connect') ?? '#'}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-brand-primary text-white hover:opacity-90 transition-opacity"
            >
              Connecter via {manifest.displayName}
            </a>
          ) : (
            <button
              onClick={handleSave}
              disabled={!hasRequired || isSaving || phase === 'testing'}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-brand-primary text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {(isSaving || phase === 'testing') && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {phase === 'testing' ? 'Test en cours…' : 'Enregistrer & Tester'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
